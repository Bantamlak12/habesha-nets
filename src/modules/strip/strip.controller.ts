import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { StripeService } from '../strip/strip.service';
import Stripe from 'stripe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscriptions } from './strip.entity';
import { User } from '../users/entities/users.entity';
import { Repository } from 'typeorm';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';

@Controller('subscription')
export class PaymentController {
  private stripe: Stripe;
  constructor(
    private readonly stripeService: StripeService,
    @InjectRepository(Subscriptions)
    private readonly subRepo: Repository<Subscriptions>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerservice: CustomMailerService,
  ) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Body() body: any,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const { planId } = body;
    const userId = req.user['sub'];

    if (!planId) {
      throw new HttpException('No plan selected', HttpStatus.BAD_REQUEST);
    }

    try {
      const session = await this.stripeService.createCheckoutSession(
        planId,
        userId,
      );

      const redirectURL = session.url;
      console.log('subscripto url', redirectURL);

      return res.status(HttpStatus.OK).json({
        status: 'success',
        statusCode: 200,
        data: {
          redirectUrl: redirectURL,
        },
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Body() body: any, @Request() req: ExpressRequest) {
    const { title } = body;
    const userId = req.user['sub'];

    const userDetail = await this.userRepository.findOne({
      where: { id: userId },
      select: ['subscriptionId'],
    });

    const { subscriptionId } = userDetail;

    if (!subscriptionId) {
      throw new HttpException(
        'No subscription ID provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const subscription =
        await this.stripeService.cancelSubscription(subscriptionId);

      await this.handleSubscriptionCancellation(subscription);

      return {
        status: 'success',
        message: 'Subscription canceled successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('create-checkout-session-One-time')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSessionOnetime(
    @Body() body: { description: string; amount: number },
    @Request() req: ExpressRequest,
  ) {
    try {
      const userId = req.user['sub'];

      const session = await this.stripeService.createCheckoutSessionOneTime(
        userId,
        body.description,
        body.amount,
      );
      return {
        status: 'success',
        statusCode: 201,
        sessionId: session.id,
        redirectUrl: session.url,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Request() request: ExpressRequest,
    @Response() response: ExpressResponse,
  ) {
    const sig = request.headers['stripe-signature'];

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(
        request.body,
        sig,
        endpointSecret,
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed: ${err.message}`);
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('session ', JSON.stringify(session, null, 2));
        await this.handleSuccessfulCheckout(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;

        await this.handleSuccessfulSubscription(invoice);
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          'Subscription Canceled:',
          JSON.stringify(subscription, null, 2),
        );
        await this.handleSubscriptionCancellation(subscription);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    response.status(HttpStatus.OK).send();
  }

  private async handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
    console.log('session ', JSON.stringify(session.metadata, null, 2));
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const planId = session.metadata.planId;
    const billingPeriod = session.metadata.BillingPeriod;
    const userId = session.metadata.userId;
    const mode = session.mode;

    console.log('Mode of Subscription', subscriptionId);

    if (mode === 'subscription') {
      await this.stripeService.storeSubscription({
        customerId,
        subscriptionId,
        planId,
        billingPeriod,
        userId,
        status: 'active',
        mode: mode,
      });

      console.log(
        `Checkout session completed for customer ${customerId} with plan ${planId}`,
      );
    } else if (mode === 'payment') {
      const lineItems =
        await this.stripeService.stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 1 },
        );
      const productDescription = lineItems.data[0].description;

      await this.stripeService.storePerPost({
        customerId,
        amountPaid: session.amount_total / 100,
        userId,
        status: 'completed',
        description: productDescription,
        mode: mode,
      });

      const perPost = session.amount_total / 100;

      const userDetail = await this.userRepository.findOne({
        where: { id: userId },
        select: ['firstName', 'email'],
      });

      const { firstName, email } = userDetail;

      await this.mailerservice.perPostPayemntConformationEmail(
        firstName,
        'completed',
        perPost,
        email,
        productDescription,
        new Date(),
        'USD',
      );

      console.log(`One-time payment completed for customer ${customerId}`);
    }
  }

  private async handleSuccessfulSubscription(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    const amountPaid = invoice.amount_paid / 100;
    const currency = 'USD';

    await this.stripeService.updateSubscriptionPayment(subscriptionId, {
      status: 'subscribed',
      amountPaid: amountPaid,
    });

    const subscription = await this.subRepo.findOne({
      where: { subscriptionId: subscriptionId },
      select: ['userId', 'billingPeriod', 'mode', 'createdAt'],
    });

    if (!subscription) {
      console.error(`Subscription with ID ${subscriptionId} not found.`);
      return;
    }

    const {
      userId,
      billingPeriod,
      mode,
      createdAt: subscriptionCreatedAt,
    } = subscription;

    const userDetail = await this.userRepository.findOne({
      where: { id: userId },
      select: ['firstName', 'email'],
    });

    const { firstName, email } = userDetail;

    const createdTime = new Date(subscriptionCreatedAt);
    let nextBillingDate: Date;

    switch (billingPeriod) {
      case 'Monthly':
        nextBillingDate = new Date(createdTime);
        nextBillingDate.setMonth(createdTime.getMonth() + 1);
        break;
      case 'Yearly':
        nextBillingDate = new Date(createdTime);
        nextBillingDate.setFullYear(createdTime.getFullYear() + 1);
        break;
      case '6-Month':
        nextBillingDate = new Date(createdTime);
        nextBillingDate.setMonth(createdTime.getMonth() + 6);
        break;
      default:
        throw new Error('Invalid billing period');
    }

    const formattedCreateTime = createdTime.toISOString().split('T')[0];
    const formattedNextBillingDate = nextBillingDate
      .toISOString()
      .split('T')[0];

    if (mode === 'subscription') {
      await this.userRepository.update(
        { id: userId },
        {
          subscriptionId: subscriptionId,
          subscriptionUpdated: new Date(),
          subscriptionStatus: 'subscribed',
          subscriptionPlan: billingPeriod,
        },
      );

      const totalAmount = amountPaid.toFixed(2);

      // Send email notification with calculated dates and amount
      await this.mailerservice.sendEmailNotification(
        firstName,
        'Activated',
        email,
        totalAmount,
        formattedCreateTime,
        currency,
        billingPeriod,
        formattedNextBillingDate,
      );
    }

    console.log(
      `Invoice for subscription ${subscriptionId} successfully paid.`,
    );
  }

  private async handleSubscriptionCancellation(
    subscription: Stripe.Subscription,
  ) {
    const subscriptionId = subscription.id;

    await this.stripeService.updateSubscriptionPayment(subscriptionId, {
      status: 'canceled',
    });

    const user = await this.subRepo.findOne({
      where: { subscriptionId: subscriptionId },
      select: ['userId', 'amountPaid'],
    });

    const { userId: userId, amountPaid: amountPaid } = user;

    await this.userRepository.update(
      { id: userId },
      { subscriptionUpdated: new Date(), subscriptionStatus: 'unsubscribed' },
    );

    const userDetail = await this.userRepository.findOne({
      where: { id: userId },
      select: ['firstName', 'email'],
    });

    const { firstName, email } = userDetail;

    await this.stripeService.updateUserDatabase(subscriptionId, {
      subscriptionStatus: 'unsubscribed',
    });

    const updateDate = new Date();

    await this.mailerservice.sendCancelEmailNotification(
      firstName,
      'CANCELLED',
      email,
      amountPaid.toString(),
      updateDate,
      'USD',
    );

    console.log(`Subscription ${subscriptionId} has been canceled.`);
  }
}
