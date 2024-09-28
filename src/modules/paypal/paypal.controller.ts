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
  Get
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Request as ExpressRequest,
  Response as ExxpressResponse,
} from 'express';
import { PaypalService } from './paypal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { User } from '../users/entities/users.entity';
import { BillingPlan } from './entities/billing.entity';

interface WebhookVerificationResponse {
  verification_status: 'SUCCESS' | 'FAILURE';
}

@Controller('paypal')
export class PaypalController {
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
  async getToken() {
    try {
      return await this.paypalService.getAccessToken();
    } catch (error) {
      throw new HttpException('Unable to retrieve access token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //create product name
  @Post('create-product')
  @UseGuards(JwtAuthGuard)
  async createProduct() {
    const result = await this.paypalService.createProduct();
    return result;
  }

  //List Product 
  @Get('list-products')
  @UseGuards(JwtAuthGuard)
  async getProducts() {
    return this.paypalService.fetchProducts();
  }

  //Update Product
  @Patch('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: { description?: string; category?: string }, // Accept object with optional fields
  ) {
    return this.paypalService.updateProduct(id, updateData);
  }

  //Create Plan
  @Post('create-plan')
  async createPlan(@Body() body: any) {
    return await this.paypalService.createBillingPlan(
      body.PaypalRequestId,
      body.name,
      body.description,
      body.amount,
      body.interval_count,
      body.interval_unit,
    );
  }

  //Create Subscription
  @Post('create-subscription/:planId')
  @UseGuards(JwtAuthGuard)
  async createSubscription(
    @Param('planId') planId: string,
    @Request() req: ExpressRequest,
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
      return subscription;
    } catch (error) {
      throw new HttpException(
        `Failed to create PayPal subscription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('paypal-webhook')
  async handleWebhook(@Req() req: Request, @Response() res: ExxpressResponse) {
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const resource = body.resource || {};
      
      console.log(JSON.stringify(resource, null, 2));
  
      switch (body.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(resource);
          break;
  
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(resource);
          break;
  
        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePaymentCompleted(resource);
          break;
  
        default:
          console.log(`Unhandled event type: ${body.event_type}`);
      }
  
      res.status(HttpStatus.OK).send();
    } catch (error) {
      console.error('Error handling webhook event:', error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error handling webhook event');
    }
  }
  
  private async handleSubscriptionActivated(resource) {
    const subscriptionId = resource.id; // Use resource.id for subscription ID
    const planID = resource.plan_id;

    const user = await this.subscriptionRepo.findOne({
            where: { id: subscriptionId },
            select: ['user_Id', 'subscriber_given_name', 'subscriber_email_address'],
          });

          const priceAmount = await this.billingRepo.findOne({
            where: {id: planID },
            select: ['value', 'interval_count', 'interval_unit']
          })
          

          const {value: totalAmount, interval_count: interval_count, interval_unit: interval_unit } = priceAmount;
  
    if (!user) {
      throw new Error('User associated with the subscription not found');
    }

    console.log("Subscription resource "+ JSON.stringify(resource, null , 2))
  
    const { user_Id: userId, subscriber_given_name: userName, subscriber_email_address: userEmail } = user;
    // const totalAmount = resource.billing_info.last_payment.amount.value ;
    const currency = resource.billing_info.last_payment.amount.currency_code ;
    const createTime = resource.create_time;
    const nextBillingDate = new Date(resource.billing_info.next_billing_time);
    const subscriptionPlan = this.determineSubscriptionPlan(interval_unit, interval_count);

   
  
    await this.paypalService.updateSubscriptionStatus(subscriptionId, 'ACTIVE', new Date());
    await this.userRepo.update({ id: userId }, { subscriptionUpdated: new Date(), subscriptionStatus: 'subscribed' });
    await this.mailerservice.sendEmailNotification(userName, 'Activated', userEmail, totalAmount, createTime, currency, subscriptionPlan, nextBillingDate);
    console.log('Subscription activated, status updated to ACTIVE from wwebhook');
  }
  
  private async handleSubscriptionCancelled(resource) {
    const subscriptionId = resource.id; // Use resource.id for subscription ID
    const planID = resource.plan_id

    console.log('resource'+JSON.stringify(resource, null, 2))
    console.log('subscription active '+ subscriptionId)
    console.log('paln id'+planID)
    const user = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      select: ['user_Id', 'subscriber_given_name', 'subscriber_email_address'],
    });

    const priceAmount = await this.billingRepo.findOne({
      where: {id: planID },
      select: ['value','interval_count', 'interval_unit']
    })

    console.log('resource'+JSON.stringify(resource, null, 2))
    console.log('subscription active '+ subscriptionId)
    console.log('paln id'+planID)


    const {value: totalAmount, interval_count: interval_count, interval_unit: interval_unit } = priceAmount;

    console.log('price'+totalAmount+'interval unit'+interval_unit)

  
    if (!user) {
      throw new Error('User associated with the subscription not found');
    }
  
    const { user_Id: userId, subscriber_given_name: userName, subscriber_email_address: userEmail } = user;
    // const lastPaymentValue = resource.billing_info.last_payment.amount.value || "0.0";
    const currency = resource.billing_info.last_payment.amount.currency_code || 'USD';
    const subscriptionPlan = this.determineSubscriptionPlan(interval_unit, interval_count );
    console.log('subscription cancel plan' + subscriptionPlan)
  
    await this.paypalService.updateSubscriptionStatus(subscriptionId, 'CANCELLED', new Date());
    await this.userRepo.update({ id: userId }, { subscriptionUpdated: new Date(), subscriptionStatus: 'unsubscribed' });
    await this.mailerservice.sendCancelEmailNotification(userName, 'CANCELLED', userEmail, totalAmount, resource.update_time, currency);
    console.log('Subscription canceled, status updated to CANCELED form webhook');
  }
  
  private determineSubscriptionPlan(intervalUnit: string, intervalCount: number): string {
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
    console.log('subscripiton id'+ resource.billing_agreement_id)
    const subscriptionId = resource.billing_agreement_id;
    const transactionId = resource.id;
    const createTime = resource.create_time;

    const user = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      select: ['user_Id', 'subscriber_given_name', 'subscriber_email_address', 'plan_id'],
    });
  
    if (!user) {
      throw new Error('User associated with the payment not found');
    }

     const { user_Id: userId, subscriber_given_name: userName, subscriber_email_address: userEmail, plan_id: planID } = user;

     const amount = await this.billingRepo.findOne({
      where: {id: planID },
      select: ['value', 'currency_code']
    })

    const{value: value, currency_code: currencyCode} = amount

    await this.mailerservice.sendPayemntConformationEmailNotification(userName, transactionId, value,userEmail, createTime,  currencyCode )
  

  }

  //Canceel Subscription
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async handleWebhoo(
    @Request() req: ExpressRequest,
    @Response() res: ExxpressResponse,
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

}

// @Patch('subscription')
// @UseGuards(JwtAuthGuard)
// async updateSubscription(
//   @Request() req: ExpressRequest
// ) {
//   const userId = req.user?.['sub'];
//   const subscriptionId =( await this.userRepo.findOne({where: {id: userId}})).subscriptionId;
//   return await this.paypalService.updateSubscription(subscriptionId);
// }
// }
