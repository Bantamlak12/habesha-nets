import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  Response,
  UseGuards,
  Req,
  Patch,
  Get,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { PaypalService } from './paypal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { User } from '../users/entities/users.entity';
import { BillingPlan } from './entities/billing.entity';
import * as PayPalSDK from '@paypal/checkout-server-sdk';

@Controller('paypal')
export class PaypalController {
  private client: PayPalSDK.PayPalHttpClient;
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(BillingPlan)
    private readonly billingRepo: Repository<BillingPlan>,
    private readonly paypalService: PaypalService,
    private readonly mailerservice: CustomMailerService,
  ) {}

  @Post('get-token')
  @UseGuards(JwtAuthGuard)
  async getToken(@Response() res: ExpressResponse) {
    try {
      const token = await this.paypalService.getAccessToken();

      return res.status(HttpStatus.OK).json({
        status: 'success',
        statusCode: 200,
        data: token,
      });
    } catch (error) {
      throw new HttpException(
        'Unable to retrieve access token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Create Product Name
  @Post('create-product')
  @UseGuards(JwtAuthGuard)
  async createProduct(@Response() res: ExpressResponse) {
    await this.paypalService.createProduct();

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Product reated successfully',
    });
  }

  //List Product
  @Get('list-products')
  @UseGuards(JwtAuthGuard)
  async getProducts(@Response() res: ExpressResponse) {
    const Product = await this.paypalService.fetchProducts();

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      data: Product,
    });
  }

  //Update Product
  @Patch('products/:id')
  @UseGuards(JwtAuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: { description?: string; category?: string },
    @Response() res: ExpressResponse,
  ) {
    const affectedRow = await this.paypalService.updateProduct(id, updateData);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      affectedRow,
    });
  }

  //Create Plan for subscription based payment
  @Post('create-subscription-plan')
  @UseGuards(JwtAuthGuard)
  async createPlan(@Body() body: any, @Response() res: ExpressResponse) {
    await this.paypalService.createBillingPlan(
      body.name,
      body.description,
      body.amount,
      body.currency_code,
      body.interval_count,
      body.interval_unit,
    );

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Subscription Plan created successfully',
    });
  }

  //List Plan
  @Get('billing-plans')
  @UseGuards(JwtAuthGuard)
  async getBillingPlans(@Response() res: ExpressResponse): Promise<any> {
    const response = await this.paypalService.fetchBillingPlans();

    const plans = response.plans || [];

    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: plans.length,
      statusCode: 200,
      data: plans,
    });
  }

  //Deactivate billing plan
  @Post('billing-plans/:planId/deactivate')
  async deactivatePlan(
    @Param('planId') planId: string,
    @Response() res: ExpressResponse,
  ) {
    const deactivatedPlan = await this.paypalService.deactivatePlan(planId);

    return res.status(HttpStatus.NO_CONTENT).json({
      status: 'success',
      statusCode: 204,
      data: deactivatedPlan,
    });
  }

  //Activate billing plan
  @Post('billing-plans/:planId/activate')
  @UseGuards(JwtAuthGuard)
  async activateBillingPlan(
    @Param('planId') planId: string,
    @Response() res: ExpressResponse,
  ): Promise<any> {
    try {
      const response = await this.paypalService.activatePlan(planId);
      return res.status(HttpStatus.OK).json({
        status: 'success',
        statusCode: 200,
        data: response,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to activate billing plan',
      });
    }
  }

  //Create Subscription
  @Post('create-subscription/:planId')
  @UseGuards(JwtAuthGuard)
  async createSubscription(
    @Param('planId') planId: string,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const parameterId = parseInt(planId, 10);
    const userId = req.user?.['sub'];
    if (!parameterId) {
      throw new HttpException('Invalid parameter ID', HttpStatus.BAD_REQUEST);
    }
    try {
      const subscription = await this.paypalService.createSubscription(
        parameterId,
        userId,
      );
      const redirectURL = subscription;

      return res.status(HttpStatus.CREATED).json({
        status: 'success',
        statusCode: 201,
        redirectUrl: redirectURL,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to create PayPal subscription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('paypal-webhook')
  async handleWebhook(@Req() req: Request, @Response() res: ExpressResponse) {
    const authAlgo = req.headers['paypal-auth-algo'];
    const certUrl = req.headers['paypal-cert-url'];
    const transmissionId = req.headers['paypal-transmission-id'];
    const transmissionSig = req.headers['paypal-transmission-sig'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    const verifyRequest = {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: req.body,
    };

    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const resource = body.resource || {};

      console.log(JSON.stringify(resource, null, 2));

      switch (body.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(resource);
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(resource);
          break;

        case 'BILLING.SUBSCRIPTION.RENEWED':
          await this.handleSubscriptionRenewed(resource);
          break;

        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePaymentCompleted(resource);
          break;

        case 'PAYMENTS.PAYMENT.COMPLETED':
          const source_per = req.body;
          console.log('payemt completed' + JSON.stringify(source_per, null, 2));
          // await this.handlePerPostPaymentCompleted(source_per);
          break;

        default:
          console.log(`Unhandled event type: ${body.event_type}`);
      }

      res.status(HttpStatus.OK).send();
    } catch (error) {
      console.error('Error handling webhook event:', error.message);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error handling webhook event');
    }
  }

  async handleSubscriptionRenewed(resource) {
    // Logic to update subscription status in your database
    const subscriptionId = resource.id;
    const subscriptionStatus = resource.status;
    console.log(
      `Subscription renewed: ${subscriptionId}, Status: ${subscriptionStatus}`,
    );

    // Update your database or notify the user
    // await this.updateSubscriptionStatus(subscriptionId, subscriptionStatus);
  }

  private async handleSubscriptionActivated(resource) {
    const subscriptionId = resource.id; // Use resource.id for subscription ID
    const planID = resource.plan_id;

    const user = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      select: ['user_Id', 'subscriber_given_name', 'subscriber_email_address'],
    });

    const priceAmount = await this.billingRepo.findOne({
      where: { id: planID },
      select: ['value', 'interval_count', 'interval_unit'],
    });

    const {
      value: totalAmount,
      interval_count: interval_count,
      interval_unit: interval_unit,
    } = priceAmount;

    if (!user) {
      throw new Error('User associated with the subscription not found');
    }

    console.log('Subscription resource ' + JSON.stringify(resource, null, 2));

    const {
      user_Id: userId,
      subscriber_given_name: userName,
      subscriber_email_address: userEmail,
    } = user;
    // const totalAmount = resource.billing_info.last_payment.amount.value ;
    const currency = resource.billing_info.last_payment.amount.currency_code;
    const createTime = resource.create_time;
    const nextBillingDate = new Date(resource.billing_info.next_billing_time);
    const subscriptionPlan = this.determineSubscriptionPlan(
      interval_unit,
      interval_count,
    );

    await this.paypalService.updateSubscriptionStatus(
      subscriptionId,
      'ACTIVE',
      new Date(),
    );
    await this.userRepo.update(
      { id: userId },
      { subscriptionUpdated: new Date(), subscriptionStatus: 'subscribed' },
    );
    await this.mailerservice.sendEmailNotification(
      userName,
      'Activated',
      userEmail,
      totalAmount,
      createTime,
      currency,
      subscriptionPlan,
      nextBillingDate,
    );
  }

  private async handleSubscriptionCancelled(resource) {
    const subscriptionId = resource.id; // Use resource.id for subscription ID
    const planID = resource.plan_id;

    console.log('resource' + JSON.stringify(resource, null, 2));
    console.log('subscription active ' + subscriptionId);
    console.log('paln id' + planID);
    const user = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      select: ['user_Id', 'subscriber_given_name', 'subscriber_email_address'],
    });

    const priceAmount = await this.billingRepo.findOne({
      where: { id: planID },
      select: ['value', 'interval_count', 'interval_unit'],
    });

    console.log('resource' + JSON.stringify(resource, null, 2));
    console.log('subscription active ' + subscriptionId);
    console.log('paln id' + planID);

    const {
      value: totalAmount,
      interval_count: interval_count,
      interval_unit: interval_unit,
    } = priceAmount;

    console.log('price' + totalAmount + 'interval unit' + interval_unit);

    if (!user) {
      throw new Error('User associated with the subscription not found');
    }

    const {
      user_Id: userId,
      subscriber_given_name: userName,
      subscriber_email_address: userEmail,
    } = user;
    // const lastPaymentValue = resource.billing_info.last_payment.amount.value || "0.0";
    const currency =
      resource.billing_info.last_payment.amount.currency_code || 'USD';
    const subscriptionPlan = this.determineSubscriptionPlan(
      interval_unit,
      interval_count,
    );
    console.log('subscription cancel plan' + subscriptionPlan);

    await this.paypalService.updateSubscriptionStatus(
      subscriptionId,
      'CANCELLED',
      new Date(),
    );
    await this.userRepo.update(
      { id: userId },
      { subscriptionUpdated: new Date(), subscriptionStatus: 'unsubscribed' },
    );
    await this.mailerservice.sendCancelEmailNotification(
      userName,
      'CANCELLED',
      userEmail,
      totalAmount,
      resource.update_time,
      currency,
    );
    console.log(
      'Subscription canceled, status updated to CANCELED form webhook',
    );
  }

  private determineSubscriptionPlan(
    intervalUnit: string,
    intervalCount: number,
  ): string {
    switch (intervalUnit) {
      case 'MONTH':
        return intervalCount === 6 ? 'Six-Month' : 'Month';
      case 'DAY':
        return 'Daily';
      case 'YEAR':
        return 'Yearly';
      default:
        return 'Unknown';
    }
  }

  private async handlePaymentCompleted(resource) {
    console.log('subscripiton id' + resource.billing_agreement_id);
    const subscriptionId = resource.billing_agreement_id;
    const transactionId = resource.id;
    const createTime = resource.create_time;

    const user = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      select: [
        'user_Id',
        'subscriber_given_name',
        'subscriber_email_address',
        'plan_id',
      ],
    });

    if (!user) {
      throw new Error('User associated with the payment not found');
    }

    const {
      user_Id: userId,
      subscriber_given_name: userName,
      subscriber_email_address: userEmail,
      plan_id: planID,
    } = user;

    const amount = await this.billingRepo.findOne({
      where: { id: planID },
      select: ['value', 'currency_code'],
    });

    const { value: value, currency_code: currencyCode } = amount;

    await this.mailerservice.sendPayemntConformationEmailNotification(
      userName,
      transactionId,
      value,
      userEmail,
      createTime,
      currencyCode,
    );
  }

  /*
START
  */
  // Create Order for Per Post Payment
  @Post('create-Perpost')
  @UseGuards(JwtAuthGuard)
  async createPerPostPayment(
    @Body('totalAmount') totalAmount: string,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const returnUrl = 'http://localhost:3000/paypal/success'; // Adjust for your frontend
    const cancelUrl = 'http://localhost:3000/paypal/cancel'; // Adjust for your frontend

    try {
      const payment = await this.paypalService.createPayment(
        totalAmount,
        returnUrl,
        cancelUrl,
      );

      // Extract the approval URL from the payment response
      const approvalUrl = payment.links.find(
        (link) => link.rel === 'approval_url',
      ).href;

      return res.status(HttpStatus.CREATED).json({
        status: 'success',
        statusCode: 201,
        redirectUrl: approvalUrl,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to create payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Handle payment success
  @Get('success')
  // @UseGuards(JwtAuthGuard)
  async handlePaymentSuccess(
    @Query('paymentId') paymentId: string,
    @Query('PayerID') payerId: string,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    if (!paymentId || !payerId) {
      throw new HttpException(
        'Missing paymentId or PayerID',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Execute the payment
      const payment = await this.paypalService.executePayment(
        paymentId,
        payerId,
      );

      console.log(payment);

      // Store payment details in the database
      // const userId = req.user?.['sub']; // Get user ID from the request
      const userId = 'fd5ba9e8-17f3-4fd0-9cd1-a913e1f04e0c';
      await this.paypalService.storePaymentDetails(payment, userId);
      await this.mailerservice.perPostPayemntConformationEmail(
        payment.payer.payer_info.first_name,
        payment.id,
        payment.transactions[0].amount.total,
        payment.payer.payer_info.email,
        new Date(),
        payment.transactions[0].amount.currency,
      );

      // Redirect the user to a confirmation page

      return res.status(HttpStatus.CREATED).json({
        status: 'success',
        statusCode: 201,
        redirectUrl: 'https://github.com/eijiotieno-official?tab=repositories',
      });
    } catch (error) {
      throw new HttpException(
        `Payment execution failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('perpost')
  async getAllPayments(@Response() res: ExpressResponse) {
    const payments = await this.paypalService.findAll();
    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: payments.length,
      statusCode: 200,
      data: payments,
    });
  }

  @Get('perpost:id')
  async getPaymentById(
    @Param('id') id: number,
    @Response() res: ExpressResponse,
  ) {
    const payment = await this.paypalService.findById(id);
    if (!payment) {
      return res.status(HttpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Payment not found',
      });
    }
    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      data: payment,
    });
  }

  /* END */

  //Canceel Subscription
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async handleWebhoo(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const userId = req.user['sub'];
    const subscriptionId = (
      await this.userRepo.findOne({ where: { id: userId } })
    ).subscriptionId;

    console.log(subscriptionId);

    let currentDateString: string = new Date().toISOString();
    let updateDate: Date = new Date(currentDateString);

    try {
      const reason = 'Stop Subscription';

      await this.paypalService.cancelSubscription(subscriptionId, reason);
      console.log('Subscription canceled successfully');
      await this.paypalService.updateSubscriptionStatus(
        subscriptionId,
        'CANCELED',
        updateDate,
      );

      res.status(HttpStatus.OK).send();
    } catch (error) {
      console.error('Error handling webhook event:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error handling webhook event');
    }
  }

  @Patch('subscription')
  @UseGuards(JwtAuthGuard)
  async updateSubscription(@Request() req: ExpressRequest) {
    const userId = req.user?.['sub'];
    const subscriptionId = (
      await this.userRepo.findOne({ where: { id: userId } })
    ).subscriptionId;
    return await this.paypalService.updateSubscription(subscriptionId);
  }
}
