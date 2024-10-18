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
  // @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Body() body: any,
    @Request() req: ExpressRequest,
  ) {
    const { planId } = body; // This is the price ID sent from the frontend (for example, monthly, yearly)
    // const userId  = req.user['sub'];
    const userId = 'fd5ba9e8-17f3-4fd0-9cd1-a913e1f04e0c';

    if (!planId) {
      throw new HttpException('No plan selected', HttpStatus.BAD_REQUEST);
    }

    try {
      const session = await this.stripeService.createCheckoutSession(
        planId,
        userId,
      );
      // return { url: session.url }; // Send the Checkout URL back to the frontend

      const redirectURL = session.url;
      console.log('subscripto url', redirectURL);

      return {
        status: 'success',
        statusCode: 201,
        redirectUrl: redirectURL,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('cancel-subscription')
  async cancelSubscription(@Body() body: { subscriptionId: string }) {
    const { subscriptionId } = body;

    if (!subscriptionId) {
      throw new HttpException(
        'No subscription ID provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const subscription =
        await this.stripeService.cancelSubscription(subscriptionId);
      // Update your database to reflect the cancellation status
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
  async createCheckoutSessionOnetime(@Body() body: { description: string, amount: number }) {

    try {
      // const userId  = req.user['sub'];
      const userId = 'fd5ba9e8-17f3-4fd0-9cd1-a913e1f04e0c';
      // Call the service method to create a session
      const session =
        await this.stripeService.createCheckoutSessionOneTime(userId, body.description, body.amount);
      return {
        status: 'success',
        statusCode: 201,
        sessionId: session.id, // Send sessionId back to the frontend
        redirectUrl: session.url, // Redirect URL to complete the payment
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // @Post('create-payment-intent')
  // async createPaymentIntent(@Body() body: any) {
  //   const { amount, description } = body;

  //   if (!amount) {
  //     throw new HttpException('Amount is required', HttpStatus.BAD_REQUEST);
  //   }

  //   try {
  //     const paymentIntent = await this.stripeService.createPaymentIntent(
  //       amount,
  //       'usd',
  //       description,
  //     );
  //     return {
  //       clientSecret: paymentIntent.client_secret,
  //     };
  //   } catch (error) {
  //     throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  @Post('webhook')
  async handleWebhook(
    @Request() request: ExpressRequest,
    @Response() response: ExpressResponse,
  ) {
    const sig = request.headers['stripe-signature'];
    // process.env.STRIPE_WEBHOOK_SECRET

    const endpointSecret = 'whsec_TDdPLwOXWIe340ikelI0hhvZbrCNzIHf'; // Webhook signing secret

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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Store the session information in your database
        console.log('session ', JSON.stringify(session, null, 2));
        await this.handleSuccessfulCheckout(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        // Handle successful subscription payment
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

      // case 'payment_intent.succeeded':
      //   const paymentIntent = event.data.object as Stripe.PaymentIntent;
      //   console.log('Payment Intent succeeded:', paymentIntent);
      //   // Store the job post and payment information in your database
      //   await this.handleSuccessfulPayment(paymentIntent);
      //   break;

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

    console.log('Mode of Subscription', session.mode);

    if (mode === 'subscription') {
      // Store subscription-based payment information in the subscriptions table
      await this.stripeService.storeSubscription({
        customerId,
        subscriptionId,
        planId,
        billingPeriod,
        userId,
        status: 'active', // Subscription starts as active
        mode: mode, // Store the payment mode as subscription
      });

      console.log(
        `Checkout session completed for customer ${customerId} with plan ${planId}`,
      );
    } else if (mode === 'payment') {
      // Handle one-time payment (store in a different table or perform another action)

        // Fetch line items to extract the product description
  const lineItems = await this.stripeService.stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
  const productDescription = lineItems.data[0].description;

      await this.stripeService.storePerPost({
        customerId,
        amountPaid: session.amount_total / 100, // Convert cents to dollars
        userId,
        status: 'completed',
        description: productDescription,
        mode: mode, // Store the payment mode as one-time payment
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
        "USD",
      );

      console.log(`One-time payment completed for customer ${customerId}`);
    }
  }

  private async handleSuccessfulSubscription(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    const amountPaid = invoice.amount_paid / 100; // Stripe uses cents, so divide by 100
    const currency = 'USD';

    // Update the subscription record with payment info
    await this.stripeService.updateSubscriptionPayment(subscriptionId, {
      status: 'subscribed',
      amountPaid: amountPaid,
    });

    const subscription = await this.subRepo.findOne({
      where: { subscriptionId: subscriptionId },
      select: ['userId', 'billingPeriod', 'mode', 'createdAt'], // Assuming createdAt is when the subscription was created
    });

    if (!subscription) {
      console.error(`Subscription with ID ${subscriptionId} not found.`);
      return; // Exit the function if subscription is not found
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

    // Calculate next billing date based on billing period
    const createdTime = new Date(subscriptionCreatedAt); // Subscription created time
    let nextBillingDate: Date;

    switch (billingPeriod) {
      case 'Monthly':
        nextBillingDate = new Date(createdTime);
        nextBillingDate.setMonth(createdTime.getMonth() + 1); // Add 1 month
        break;
      case 'Yearly':
        nextBillingDate = new Date(createdTime);
        nextBillingDate.setFullYear(createdTime.getFullYear() + 1); // Add 1 year
        break;
      case '6-Month':
        nextBillingDate = new Date(createdTime);
        nextBillingDate.setMonth(createdTime.getMonth() + 6); // Add 6 months
        break;
      default:
        throw new Error('Invalid billing period');
    }

    // Format the dates (optional, depending on your requirements)
    const formattedCreateTime = createdTime.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const formattedNextBillingDate = nextBillingDate
      .toISOString()
      .split('T')[0]; // Format as YYYY-MM-DD

    if (mode === 'subscription') {
      await this.userRepository.update(
        { id: userId },
        {
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
        totalAmount, // totalAmount (payment amount)
        formattedCreateTime, // Subscription created time
        currency,
        billingPeriod,
        formattedNextBillingDate, // Calculated next billing date
      );
    }

    console.log(
      `Invoice for subscription ${subscriptionId} successfully paid.`,
    );
  }

  // private async handleSuccessfulSubscription(invoice: Stripe.Invoice) {
  //   const subscriptionId = invoice.subscription as string;
  //   const amountPaid = invoice.amount_paid / 100; // Stripe uses cents, so divide by 100
  //   const currencey = 'USD'
  //   // Update the subscription record with payment info
  //   await this.stripeService.updateSubscriptionPayment(subscriptionId, {
  //     status: 'subscribed',
  //     amountPaid: amountPaid,
  //   });
  //   const user = await this.subRepo.findOne({
  //     where: { subscriptionId: subscriptionId },
  //     select: ['userId', 'billingPeriod', 'mode'],
  //   });

  //   const { userId: userId, billingPeriod: billingPeriod, mode } = user;

  //   const userDetail = await this.userRepository.findOne({
  //     where: { id: userId },
  //     select: ['firstName', 'email'],
  //   });

  //   const { firstName: firstName, email: email} = userDetail;

  //   if (mode === 'subscription') {
  //     await this.userRepository.update(
  //       { id: userId },
  //       {
  //         subscriptionUpdated: new Date(),
  //         subscriptionStatus: 'subscribed',
  //         subscriptionPlan: billingPeriod,
  //       },
  //     );

  //     await this.mailerservice.sendEmailNotification(
  //       firstName,
  //       'Activated',
  //       email,
  //       totalAmount,
  //       createTime,
  //       currencey,
  //       billingPeriod,
  //       nextBillingDate,
  //     );
  //   }

  //   console.log(
  //     `Invoice for subscription ${subscriptionId} successfully paid.`,
  //   );
  // }

  private async handleSubscriptionCancellation(
    subscription: Stripe.Subscription,
  ) {
    const subscriptionId = subscription.id;

    // Update the subscription status to 'canceled' in your database
    await this.stripeService.updateSubscriptionPayment(subscriptionId, {
      status: 'canceled',
    });

    const user = await this.subRepo.findOne({
      where: { subscriptionId: subscriptionId },
      select: ['userId'],
    });

    const { userId: userId } = user;

    await this.userRepository.update(
      { id: userId },
      { subscriptionUpdated: new Date(), subscriptionStatus: 'unsubscribed' },
    );

    const userDetail = await this.userRepository.findOne({
      where: { id: userId },
      select: ['firstName', 'email'],
    });

    const { firstName, email } = userDetail;

    // Update the subscription status to 'unsubscriped in user database
    await this.stripeService.updateUserDatabase(subscriptionId, {
      subscriptionStatus: 'unsubscribed',
    });

    const updateDate = new Date();

    await this.mailerservice.sendCancelEmailNotification(
      firstName,
      'CANCELLED',
      email,
      '20',
      updateDate,
      'USD',
    );

    console.log(`Subscription ${subscriptionId} has been canceled.`);
  }

  // private async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  //   const jobId = paymentIntent.metadata.jobId;
  //   const userId = paymentIntent.metadata.userId;

  //   // Store the payment and job post information in the database
  //   // You can use your service to store job-related data after the payment succeeds
  //   console.log(`Job post with ID ${jobId} successfully paid by user ${userId}`);
  //   // Update your job post and payment information accordingly
  // }
}
