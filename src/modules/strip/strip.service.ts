import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { Subscriptions } from './strip.entity';
import PaymentIntent from 'stripe';
import { User } from '../users/entities/users.entity';
import { PerPostPayment } from './strip.perpost.entity';
@Injectable()
export class StripeService {
  public stripe: Stripe;

  constructor(
    @InjectRepository(Subscriptions)
    private readonly subRepo: Repository<Subscriptions>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PerPostPayment)
    private perpostRepository: Repository<PerPostPayment>,
  ) {
    this.stripe = new Stripe(
      'sk_test_51PryRTP3IH6zcTUbpZZEIaF4jXzIMlI3fAJXgu5Uo8ecwiuobNf8lDTc2QJPKmp38PuHsq6jBzi1ZgEoqKJVnrQu00jMmfnuid',
      {
        apiVersion: null,
      },
    );
  }

  // Create a checkout session
  async createCheckoutSession(
    planId: string,
    userId: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const price = await this.stripe.prices.retrieve(planId);

      let billingPeriod = '';
      if (
        price.recurring?.interval === 'month' &&
        price.recurring.interval_count === 1
      ) {
        billingPeriod = 'Monthly';
      } else if (
        price.recurring?.interval === 'year' &&
        price.recurring.interval_count === 1
      ) {
        billingPeriod = 'Yearly';
      } else if (
        price.recurring?.interval === 'month' &&
        price.recurring.interval_count === 6
      ) {
        billingPeriod = '6-Month';
      } else {
        billingPeriod = `${price.recurring?.interval_count} ${price.recurring?.interval}`;
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        metadata: {
          planId: planId,
          BillingPeriod: billingPeriod,
          userId: userId,
        },
        line_items: [
          {
            price: planId,
            quantity: 1,
          },
        ],
        success_url:
          'https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://yourwebsite.com/cancel',
      });
      console.log('session plan id', session.metadata.planId);

      return session;
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createCheckoutSessionOneTime(
    userId: string,
    descripiton: string,
    amount: number,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        metadata: {
          userId: userId,
        },
        line_items: [
          {
            price_data: {
              currency: 'USD',
              product_data: {
                name: 'Per Post Payment',
                description: 'One-time payment for the selected product',
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        success_url:
          'https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://yourwebsite.com/cancel',
      });

      console.log('Checkout Session created successfully:', session.id);
      return session;
    } catch (error) {
      console.log('Error creating Checkout Session:', error.message);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  constructEvent(
    body: Buffer,
    signature: string | string[],
    secret: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      throw new HttpException(
        `Webhook signature verification failed: ${err.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async storeSubscription(
    subscriptionData: Partial<Subscriptions>,
  ): Promise<Subscriptions> {
    try {
      const subscription = this.subRepo.create(subscriptionData);
      return await this.subRepo.save(subscription);
    } catch (error) {
      console.error('Error storing subscription:', error.message);
      throw new Error('Failed to store subscription');
    }
  }

  async updateSubscriptionPayment(
    subscriptionId: string,
    updateData: Partial<Subscriptions>,
  ): Promise<void> {
    try {
      await this.subRepo.update({ subscriptionId }, updateData);
    } catch (error) {
      console.error(
        `Error updating subscription payment for ID ${subscriptionId}:`,
        error.message,
      );
      throw new Error('Failed to update subscription payment');
    }
  }

  async updateUserDatabase(
    subscriptionId: string,
    updateData: Partial<User>,
  ): Promise<void> {
    try {
      await this.userRepository.update({ subscriptionId }, updateData);
    } catch (error) {
      console.error(
        `Error updating subscription payment for ID ${subscriptionId}:`,
        error.message,
      );
      throw new Error('Failed to update subscription payment');
    }
  }

  async storePerPost(paymentData: {
    customerId: string;
    amountPaid: number;
    userId: string;
    status: string;
    description: string;
    mode: string;
  }): Promise<void> {
    const { customerId, amountPaid, userId, status, description, mode } =
      paymentData;

    const oneTimePayment = this.perpostRepository.create({
      customerId,
      amountPaid,
      userId,
      status,
      description,
      mode,
    });

    await this.perpostRepository.save(oneTimePayment);

    console.log(
      `Per Post payment of ${amountPaid} stored for customer ${customerId}`,
    );
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  }
}
