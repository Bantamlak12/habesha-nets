import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
  Res,  
  Req
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request as ExpressRequest, Response } from 'express';
import { PaypalService } from './paypal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { User } from '../users/entities/users.entity';


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
    private readonly paypalService: PaypalService,
    private readonly mailerservice: CustomMailerService,
  ) {}

  @Post('get-token')
  async getToken() {
    const tokenResponse = await this.paypalService.getAccessToken();
    return tokenResponse;
  }

  //create product name
  @Post('create-product')
  async createProduct() {
    const result = await this.paypalService.createProduct();
    return result;
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
async handleWebhook(@Req() req: Request, @Res() res: Response) {
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

  let currentDate: Date = new Date();
  let user_Id: string;

  try {
    // Parse the body from the request
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const resource = body.resource || {};
    const subscriptionId = resource.id;

    if (!subscriptionId) {
      throw new Error('Subscription ID is missing from the webhook payload');
    }

    const getuserId = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      select: ['user_Id'],
    });

    const userId = getuserId?.user_Id;

    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        await this.paypalService.updateSubscriptionStatus(subscriptionId, 'APPROVAL_PENDING', currentDate);
        await this.mailerservice.sendEmailNotification(subscriptionId, 'APPROVAL_PENDING');
        console.log('Subscription activated, status updated to APPROVAL_PENDING');
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.paypalService.updateSubscriptionStatus(subscriptionId, 'ACTIVE', currentDate);
        await this.userRepo.update(
          { id: userId },
          { subscriptionUpdated: new Date(), subscriptionStatus: 'subscribed' }
        );
        await this.mailerservice.sendEmailNotification(subscriptionId, 'Activated');
        console.log('Subscription activated, status updated to ACTIVATED');
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.paypalService.updateSubscriptionStatus(subscriptionId, 'CANCELLED', currentDate);
        await this.userRepo.update(
          { id: userId },
          { subscriptionUpdated: new Date(), subscriptionStatus: 'unsubscribed' }
        );
        await this.mailerservice.sendEmailNotification(subscriptionId, 'CANCELLED');
        console.log('Subscription canceled, status updated to CANCELED');
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await this.paypalService.updateSubscriptionStatus(subscriptionId, 'PAID', currentDate);
        await this.mailerservice.sendEmailNotification(subscriptionId, 'PAID');
        console.log('Payment completed, subscription status updated to PAID');
        break;

      default:
        console.log(`Unhandled event type: ${body.event_type}`);
    }

    res.status(HttpStatus.OK).send();
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error handling webhook event');
  }
}
  
}
