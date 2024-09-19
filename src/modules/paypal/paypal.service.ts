import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Token } from './entities/token.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Product } from './entities/product.entity';
import { BillingPlan } from './entities/billing.entity';

@Injectable()
export class PaypalService {
  private PAYPAL_API: string;
  private readonly logger = new Logger(PaypalService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(OAuth2Token)
    private readonly tokenRepo: Repository<OAuth2Token>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(BillingPlan)
    private readonly billingRepo: Repository<BillingPlan>,
  ) {
    this.PAYPAL_API = this.config.get<string>('PAYPAL_API');
  }

  async getToken() {
    const encyptedToken = (await this.tokenRepo.findOneBy({})).token;
    const accessToken = await this.authService.decyptPaypalToken(encyptedToken);
    return accessToken;
  }

  async getAccessToken(): Promise<string> {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET');

    // Construct authorization header
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const requestConfig = {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const body = 'grant_type=client_credentials';

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          `${this.PAYPAL_API}/v1/oauth2/token`,
          body,
          requestConfig,
        ),
      );
      await this.saveOrUpdateToken(
        response.data.access_token,
        response.data.expires_in,
      );
      return response.data.access_token;
    } catch (err) {
      throw new HttpException(
        'Failed to retrieve paypal access token',
        err.response?.status || 500,
      );
    }
  }

  // Save token
  private async saveOrUpdateToken(
    token: string,
    expiresIn: number,
  ): Promise<void> {
    const existingToken = await this.tokenRepo.findOneBy({});
    const encryptedToken = await this.authService.encryptPaypalToken(token);

    if (existingToken) {
      existingToken.token = encryptedToken;
      existingToken.expiresIn = expiresIn;
      existingToken.updatedAt = new Date();
      await this.tokenRepo.save(existingToken);
    } else {
      const newToken = this.tokenRepo.create({
        token: encryptedToken,
        expiresIn,
        updatedAt: new Date(),
      });
      await this.tokenRepo.save(newToken);
    }
  }

  // Create product
  async createProduct(): Promise<any> {
    const paypalApiUrlProduct = `${this.PAYPAL_API}/v1/catalogs/products`;

    const requestBody = {
      name: 'Subscription Payment',
      description: 'HabeshaNets Website Subscription Product Service',
      type: 'SERVICE',
      category: 'SOFTWARE',
    };

    const accessToken = await this.getToken();
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(paypalApiUrlProduct, requestBody, requestConfig),
      );
      // Extract data from response
      const productData = response.data;

      // Save product data to the database
      const product = this.productRepo.create({
        id: productData.id,
        name: productData.name,
        description: productData.description,
        type: productData.type,
        category: productData.category,
        create_time: new Date(productData.create_time),
        update_time: new Date(productData.create_time),
      });
      await this.productRepo.save(product);
      return response.data;
    } catch (error) {
      console.error('PayPal API Error:', error.response?.data || error.message);
      throw new Error(
        `Failed to create PayPal product: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  //Create Billing Plan For subscription
  async createBillingPlan(
    paypalRequestId: string,
    name: string,
    description: string,
    amount: string,
    interval_count: number,
    interval_unit: string,
  ): Promise<any> {
    const paypalUrlBillingPlan = `${this.PAYPAL_API}/v1/billing/plans`;

    const accessToken = await this.getToken();
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': paypalRequestId,
        Prefer: 'return=representation',
      },
    };

    const productId = (await this.productRepo.findOneBy({})).id;
    const data = {
      product_id: productId,
      name,
      description,
      status: 'ACTIVE',
      billing_cycles: [
        {
          tenure_type: 'REGULAR',
          sequence: 1,
          frequency: {
            interval_unit: interval_unit,
            interval_count: interval_count,
          },
          total_cycles: 0, // 0 indicates unlimited cycles
          pricing_scheme: {
            fixed_price: {
              value: amount,
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '1',
          currency_code: 'USD',
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
      taxes: {
        percentage: '10',
        inclusive: false,
      },
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(paypalUrlBillingPlan, data, requestConfig),
      );
      this.logger.log('Billing plan created successfully');
      const billingPlanData = response.data;
      this.logger.log('Billing plan data:', billingPlanData);

      const billing = new BillingPlan();
      billing.id = billingPlanData.id;
      billing.product_id = billingPlanData.product_id;
      billing.name = billingPlanData.name;
      billing.description = billingPlanData.description;
      billing.status = billingPlanData.status;
      const firstCycle = billingPlanData.billing_cycles[0];
      if (firstCycle) {
        billing.tenure_type = firstCycle.tenure_type; // Regular or Trial
        billing.interval_count = firstCycle.frequency.interval_count;
        billing.interval_unit = firstCycle.frequency.interval_unit;

        if (
          firstCycle.pricing_scheme &&
          firstCycle.pricing_scheme.fixed_price
        ) {
          billing.currency_code =
            firstCycle.pricing_scheme.fixed_price.currency_code;
          billing.value = firstCycle.pricing_scheme.fixed_price.value;
        } else {
          this.logger.error(
            'Fixed price information is missing in pricing scheme',
          );
        }
      } else {
        this.logger.error('Billing cycle information is missing');
      }

      billing.links = billingPlanData.links;
      billing.created_time = new Date(); // Default to current time if missing
      billing.update_time = new Date(); // Default to current time if missing

      await this.billingRepo.save(billing);

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error creating PayPal billing plan',
        error.response ? error.response.data : error,
      );
      throw error;
    }
  }

  async createSubscription(parameterId: number, userId: string) {
    // let subscriptionId: string | null = null;
    let subscriptionPlan: string | null = null;

    const subscriptionId = await this.billingRepo.find();
    //   if (parameterId === 1) {
    //     subscriptionId = process.env.Month_1_Subscription_ID;
    //     subscriptionPlan = 'monthly';
    //   } else if (parameterId === 2) {
    //     subscriptionId = process.env.Month_6_Subscription_ID;
    //     subscriptionPlan = 'sixMonth';
    //   } else if (parameterId === 3) {
    //     subscriptionId = process.env.YEAR_1_Subscription_ID;
    //     subscriptionPlan = 'Yearly';
    //   } else {
    //     throw new BadRequestException('incorrect URL Request');
    //   }

    //   // Fetch the user data from the database
    //   const user = await this.employerRepository.findOne({
    //     where: { id: userId },
    //   });
    //   if (!user) {
    //     throw new BadRequestException('User not found');
    //   }

    //   const requestBody = {
    //     plan_id: subscriptionId,
    //     quantity: '1',
    //     subscriber: {
    //       name: { given_name: user.firstName, surname: user.lastName },
    //       email_address: user.email,
    //       shipping_address: {
    //         name: { full_name: `${user.firstName} ${user.lastName}` },
    //         address: {
    //           address_line_1: '2211 N First Street',
    //           address_line_2: 'Building 17',
    //           admin_area_2: 'San Jose',
    //           admin_area_1: 'CA',
    //           postal_code: '95131',
    //           country_code: 'US',
    //         },
    //       },
    //     },
    //     application_context: {
    //       brand_name: 'HabeshaNet',
    //       locale: 'en-US',
    //       shipping_preference: 'SET_PROVIDED_ADDRESS',
    //       user_action: 'SUBSCRIBE_NOW',
    //       payment_method: {
    //         payer_selected: 'PAYPAL',
    //         payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
    //       },
    //       return_url: 'https://www.godigitalethio.com/news/returnUrl',
    //       cancel_url: 'https://www.google.com/cancelUrl',
    //     },
    //   };

    //   const headers = {
    //     Authorization: this.accessToken,
    //     'Content-Type': 'application/json',
    //     Accept: 'application/json',
    //     'PayPal-Request-Id': `SUBSCRIPTION-${Date.now()}`,
    //     Prefer: 'return=representation',
    //   };

    //   try {
    //     const response = await firstValueFrom(
    //       this.httpService.post(this.paypalApiUrl, requestBody, { headers }),
    //     );
    //     const approveLink = response.data.links.find(
    //       (link) => link.rel === 'approve',
    //     )?.href;
    //     console.log(approveLink);
    //     this.logger.log(response.data);

    //     const subscriptionData = new Subscription();
    //     const subscription = response.data;

    //     subscriptionData.id = subscription.id;
    //     subscriptionData.status = subscription.status;
    //     subscriptionData.status_update_time = new Date(
    //       subscription.status_update_time,
    //     );
    //     subscriptionData.plan_id = subscription.plan_id;
    //     subscriptionData.user_Id = userId;
    //     subscriptionData.start_time = new Date(subscription.start_time);
    //     subscriptionData.subscriber_given_name =
    //       subscription.subscriber.name.given_name;
    //     subscriptionData.subscriber_surname =
    //       subscription.subscriber.name.surname;
    //     subscriptionData.subscriber_email_address =
    //       subscription.subscriber.email_address;
    //     subscriptionData.create_time = new Date(subscription.create_time);
    //     //  subscriptionData.payer_id = subscription.subscriber.payer_id;
    //     subscriptionData.subscriptio_links = subscription.links;
    //     await this.subscriptionRepository.save(subscriptionData);
    //     await this.employerRepository.update(
    //       { id: userId },
    //       { subscriptionPlan, SubscriptionUpdated: new Date() },
    //     );
    //     // return response.data;
    //     return approveLink;
    //   } catch (error) {
    //     console.error('PayPal API Error:', error.respomse?.data || error.message);
    //     throw new Error(
    //       `Failed to create PayPal subscription: ${error.response?.data?.message || error.message}`,
    //     );
    //   }
  }
}
