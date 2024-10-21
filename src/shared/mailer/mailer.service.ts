import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { subscriptionConfirmationEmail } from 'src/shared/mailer/templates/subscription.template';
import { subscriptionCancelEmail } from './templates/subscription-cancel.template';
import { subscriptionPayemntConformationEmail } from './templates/subscription-payemnt_conformation';
import { perPostPayemntConformationEmail } from './templates/per-post-approval.templet';
import { Subscriptions } from 'src/modules/stripe/stripe.entity';

@Injectable()
export class CustomMailerService {
  private transporter: Transporter;

  constructor(
    @InjectRepository(Subscriptions)
    private readonly subscriptionRepo: Repository<Subscriptions>,
    private config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      secure: process.env.NODE_ENV === 'development' ? false : true,
      auth: {
        user: this.config.get<string>('MAIL_USERNAME'),
        pass: this.config.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const options: Mail.Options = {
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Email could not be sent, ${error}`,
      );
    }
  }

  async sendEmailNotification(
    userName: string,
    status: string,
    userEmail: string,
    totalAmount: string,
    createTime: string,
    currency: string,
    subscriptionPlan: string,
    nextBillingDate: string,
  ) {
    const emailBody = subscriptionConfirmationEmail(
      'Habesha Nets',
      new Date().getFullYear(),
      `${userName}`,
      `${totalAmount}`,
      `${subscriptionPlan}`,
      `${nextBillingDate}`,
      `${currency}`,
    );

    const subject = 'Subscription Activated';

    // const emailContent = `Your subscription with ID ${userEmail} has been ${status}.`;
    await this.sendEmail(userEmail, subject, emailBody);
  }

  async sendCancelEmailNotification(
    userName: string,
    status: string,
    userEmail: string,
    totalAmount: string,
    update_time: Date,
    currency: string,
  ) {
    const emailBody = subscriptionCancelEmail(
      'Habesha Nets',
      new Date().getFullYear(),
      `${userName}`,
      `${totalAmount}`,
      new Date(update_time),
      `${status}`,
      `$${currency}`,
    );

    const subject = 'Subscription Payment Canceled';

    // const emailContent = `Your subscription with ID ${subscriptionId} has been ${status}.`;
    await this.sendEmail(userEmail, subject, emailBody);
  }

  async sendPayemntConformationEmailNotification(
    userName: string,
    transaction_id: string,
    amount: string,
    userEmail: string,
    date: Date,
    currency: string,
  ) {
    const emailBody = subscriptionPayemntConformationEmail(
      'Habesha Nets',
      new Date().getFullYear(),
      `${userName}`,
      `${transaction_id}`,
      `${date}`,
      `${amount}`,
      `$${currency}`,
    );

    const subject = 'Payment Conformation';

    await this.sendEmail(userEmail, subject, emailBody);
  }

  async perPostPayemntConformationEmail(
    userName: string,
    status: string,
    amount: number,
    userEmail: string,
    description: string,
    date: Date,
    currency: string,
  ) {
    const emailBody = perPostPayemntConformationEmail(
      'Habesha Nets',
      `${userName}`,
      `${status}`,
      `${description}`,
      `${date}`,
      `${amount}`,
      `$${currency}`,
    );

    const subject = 'Subscription Payment Conformation';

    await this.sendEmail(userEmail, subject, emailBody);
  }
}
