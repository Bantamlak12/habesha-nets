import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { catchError, firstValueFrom, lastValueFrom, map, of } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Token } from './entities/token.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Product } from './entities/product.entity';
import { BillingPlan } from './entities/billing.entity';
import { User } from '../users/entities/users.entity';
import { Subscription } from './entities/subscription.entity';
import axios from 'axios';
import * as paypal from '@paypal/checkout-server-sdk';
import { Payment } from './entities/per-post-payment.entity';

@Injectable()
export class PaypalService {
  private PAYPAL_API: string;
  private readonly logger = new Logger(PaypalService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OAuth2Token)
    private readonly tokenRepo: Repository<OAuth2Token>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(BillingPlan)
    private readonly billingRepo: Repository<BillingPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
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

  // List Products
  async fetchProducts() {
    const paypalApiUrlListProduct = `${this.PAYPAL_API}/v1/catalogs/products?page_size=2&page=1&total_required=true`;
    const accessToken = await this.getToken();

    return this.httpService
      .get(paypalApiUrlListProduct, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Prefer: 'return=representation',
        },
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching products', error);
          return of({ error: 'Failed to fetch products' });
        }),
      );
  }

  //Update PRoduct
  async updateProduct(
    productId: string,
    updateData: { description?: string; category?: string },
  ): Promise<any> {
    const url = `${this.PAYPAL_API}/v1/catalogs/products/${productId}`;

    const requestBody = [];

    // Conditionally add operations to the request body
    if (updateData.description) {
      requestBody.push({
        op: 'replace',
        path: '/description',
        value: updateData.description,
      });
    }

    if (updateData.category) {
      requestBody.push({
        op: 'replace',
        path: '/category',
        value: updateData.category,
      });
    }

    if (requestBody.length === 0) {
      throw new Error('No fields to update.');
    }

    const accessToken = await this.getToken();
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.patch(url, requestBody, requestConfig),
      );

      return response.data; // Return the updated product data
    } catch (error) {
      console.error('PayPal API Error:', error.response?.data || error.message);
      throw new Error(
        `Failed to update PayPal product: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  //Detail Description Product
  async getProduct(productId: string): Promise<any> {
    const url = `${this.PAYPAL_API}/v1/catalogs/products/${productId}`;

    const accessToken = await this.getToken();
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, requestConfig).pipe(
          map((response) => response.data),
          catchError((error) => {
            console.error('Error fetching product:', error);
            return of({ error: 'Failed to fetch product' });
          }),
        ),
      );

      return response; // Return the product data
    } catch (error) {
      console.error('PayPal API Error:', error.response?.data || error.message);
      throw new Error(
        `Failed to retrieve PayPal product: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  //Create Billing Plan For subscription
  async createBillingPlan(
    name: string, // weekly
    description: string,
    amount: string, //23423432
    currency_code: string,
    interval_count: number, //1
    interval_unit: string, //week
  ): Promise<any> {
    const paypalUrlBillingPlan = `${this.PAYPAL_API}/v1/billing/plans`;
    const accessToken = await this.getToken();
    function generatePaypalRequestId(): string {
      const prefix = 'PRO';
      const randomNumber = Math.floor(10000 + Math.random() * 90000); // Generates a number between 10000 and 99999
      return `${prefix}${randomNumber.toString().slice(0, 4)}`; // Take only the first four digits
    }

    const paypalRequestId = generatePaypalRequestId();

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
              currency_code: currency_code,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '1',
          currency_code: currency_code,
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
      const billingPlanData = response.data;

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

  async fetchBillingPlans(): Promise<any> {
    const paypalApiUrlListPlan = `${this.PAYPAL_API}/v1/billing/plans?sort_by=create_time&sort_order=desc`;
    const accessToken = await this.getToken();
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
    };

    try {
      const response = await lastValueFrom(
        this.httpService.get(paypalApiUrlListPlan, requestConfig),
      );
      return response.data; // Return the fetched billing plans
    } catch (error) {
      console.error(
        'Error fetching billing plans',
        error.response ? error.response.data : error,
      );
      throw error; // Handle error as needed
    }
  }

  async deactivatePlan(planId: string): Promise<any> {
    const url = `${this.PAYPAL_API}/v1/billing/plans/${planId}/deactivate`;
    const accessToken = await this.getToken();
    const billingPlan = await this.billingRepo.findOne({
      where: { id: planId },
    });

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {}, requestConfig),
      );

      billingPlan.status = 'DEACTIVE';
      billingPlan.update_time = new Date(); // Update the timestamp
      await this.billingRepo.save(billingPlan); // Save the updated
      return response.data; // Return the fetched billing plans
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response?.data || 'Failed to deactivate plan',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async activatePlan(planId: string): Promise<any> {
    const url = `${this.PAYPAL_API}/v1/billing/plans/${planId}/activate`; // Correct endpoint for activation
    const accessToken = await this.getToken();
    const billingPlan = await this.billingRepo.findOne({
      where: { id: planId },
    });

    console.log('Access Token:', accessToken);
    console.log('Activation URL:', url);

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {}, requestConfig),
      );
      billingPlan.status = 'ACTIVE';
      billingPlan.update_time = new Date(); // Update the timestamp
      await this.billingRepo.save(billingPlan); // Save the updated
      return response.data; // Return the response data
    } catch (error) {
      console.error('Error during activation:', error); // Log the entire error
      throw new HttpException(
        error.response?.data || 'Failed to activate plan',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createSubscription(subscriptionID: string, userId: string) {
    let subscriptionPlan: string | null;

    const subscriptionId = await this.billingRepo.findOne({
      where: { id: subscriptionID },
      select: ['id', 'interval_count', 'interval_unit'],
    });

    if (!subscriptionId) {
      throw new Error('Subscription plan not found.');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (subscriptionId.interval_unit === 'MONTH') {
      if (subscriptionId.interval_count === 1) {
        subscriptionPlan = 'Monthly';
      } else if (subscriptionId.interval_count === 6) {
        subscriptionPlan = 'Six Monthly';
      }
    } else if (subscriptionId.interval_unit === 'YEAR') {
      if (subscriptionId.interval_count === 1) {
        subscriptionPlan = 'Yearly';
      }
    } else {
      throw new Error('Unsupported interval unit or count.');
    }

    const requestBody = {
      plan_id: subscriptionId.id,
      quantity: '1',
      subscriber: {
        name: { given_name: user.firstName, surname: user.lastName },
        email_address: user.email,
      },
      application_context: {
        brand_name: 'HabeshaNet',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: 'https://www.godigitalethio.com/news/returnUrl',
        cancel_url: 'https://www.google.com/cancelUrl',
      },
    };

    const accessToken = await this.getToken();
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    };

    const paypalUrl = `${this.PAYPAL_API}/v1/billing/subscriptions`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(paypalUrl, requestBody, requestConfig),
      );
      const approveLink = response.data.links.find(
        (link) => link.rel === 'approve',
      )?.href;

      const subscription = response.data;

      const subscriptionData = this.subscriptionRepo.create({
        id: subscription.id,
        plan_id: subscription.plan_id,
        status: subscription.status,
        status_update_time: subscription.status_update_time,
        start_time: subscription.start_time,
        user_Id: userId,
        subscriber_given_name: subscription.subscriber.name.given_name,
        subscriber_surname: subscription.subscriber.name.surname,
        subscriber_email_address: subscription.subscriber.email_address,
        create_time: subscription.create_time,
        subscriptio_links: subscription.links,
      });

      await this.subscriptionRepo.save(subscriptionData);

      await this.userRepo.update(
        { id: userId },
        {
          subscriptionPlan,
          subscriptionId: subscription.id,
          subscriptionStatus: 'subscribed',
          subscriptionUpdated: new Date(),
        },
      );
      return approveLink;
    } catch (error) {
      console.log(error);
      console.error('PayPal API Error:', error.respomse?.data || error.message);
      throw new InternalServerErrorException(
        'Unable to process your request at this time.',
      );
    }
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: string,
    status_update_time: Date,
  ): Promise<void> {
    await this.subscriptionRepo.update(
      { id: subscriptionId },
      { status, status_update_time },
    );
  }

  async cancelSubscription(
    subscriptionId: string,
    reason: string,
  ): Promise<void> {
    const paypalUrl = `${this.PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`;

    const accessToken = await this.getToken();

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    };

    const body = {
      reason,
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(paypalUrl, body, requestConfig),
      );

      if (response.status !== HttpStatus.NO_CONTENT) {
        throw new HttpException(
          'Failed to cancel PayPal subscription',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error(
        'Failed to cancel subscription:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to cancel PayPal subscription: ' +
          (error.response?.data?.message || error.message),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getSubscriptionDetails(subscriptionId) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `https://api-m.sandbox.paypal.com/v1/billing/subscriptions${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data; // Return subscription details
    } catch (error) {
      console.error(
        'Error fetching subscription details:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to fetch subscription details');
    }
  }

  async updateSubscription(subscriptionId: string) {
    const paypalUrl = `${this.PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`;
    const accessToken = await this.getToken();
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        prefer: 'return=representation',
      },
    };

    const body = [
      {
        op: 'replace',
        path: '/plan/billing_cycles/@sequence==1/pricing_scheme/fixed_price',
        value: { currency_code: 'USD', value: '50.00' },
      },
      {
        op: 'replace',
        path: '/plan/billing_cycles/@sequence==2/pricing_scheme/tiers',
        value: [
          {
            starting_quantity: '1',
            ending_quantity: '1000',
            amount: { value: '500', currency_code: 'USD' },
          },
          {
            starting_quantity: '1001',
            amount: { value: '2000', currency_code: 'USD' },
          },
        ],
      },
      {
        op: 'replace',
        path: '/plan/payment_preferences/auto_bill_outstanding',
        value: true,
      },
      {
        op: 'replace',
        path: '/plan/payment_preferences/payment_failure_threshold',
        value: 1,
      },
      {
        op: 'replace',
        path: '/plan/taxes/percentage',
        value: '10',
      },
    ];

    try {
      const response = await lastValueFrom(
        this.httpService.patch(paypalUrl, body, requestConfig),
      );
      return response.data;
    } catch (error) {
      console.error('Error updating PayPal subscription:', error);
      throw error;
    }
  }

  //start
  // Create Payment for Per Post
  async createPayment(
    amount: string,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<any> {
    const createPaymentUrl = `${this.PAYPAL_API}/v1/payments/payment`;
    const accessToken = await this.getToken();

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const paymentData = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
      },
      redirect_urls: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
      transactions: [
        {
          amount: {
            total: amount,
            currency: 'USD',
          },
          description: 'Payment for post on our website',
        },
      ],
    };

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(createPaymentUrl, paymentData, requestConfig),
      );

      return response.data; // Return payment details
    } catch (error) {
      this.logger.error(
        'Error creating PayPal payment',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to create payment',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Execute Payment
  async executePayment(paymentId: string, payerId: string): Promise<any> {
    const executePaymentUrl = `${this.PAYPAL_API}/v1/payments/payment/${paymentId}/execute`;
    const accessToken = await this.getToken();

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const executeData = {
      payer_id: payerId,
    };

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(executePaymentUrl, executeData, requestConfig),
      );

      return response.data; // Return executed payment details
    } catch (error) {
      this.logger.error(
        'Error executing PayPal payment',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to execute payment',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async storePaymentDetails(paymentData: any, userId: string): Promise<void> {
    const newPayment = this.paymentRepository.create({
      paymentId: paymentData.id,
      userId: userId,
      state: paymentData.state,
      payerEmail: paymentData.payer.payer_info.email,
      payerFirstName: paymentData.payer.payer_info.first_name,
      payerLastName: paymentData.payer.payer_info.last_name,
      amount: paymentData.transactions[0].amount.total,
      currency: paymentData.transactions[0].amount.currency,
      description: paymentData.transactions[0].description,
      links: paymentData.links,
    });

    await this.paymentRepository.save(newPayment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find();
  }

  async findById(id: number): Promise<Payment> {
    return this.paymentRepository.findOneBy({ id });
  }
  //end
}
