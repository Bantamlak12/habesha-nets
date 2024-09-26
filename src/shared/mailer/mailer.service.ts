import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from 'src/modules/paypal/entities/subscription.entity';
import { subscriptionconformationEmail } from 'src/shared/mailer/templates/subscription.template';
import { subscriptioncancelEmail } from './templates/subscription-cancel.template';

@Injectable()
export class CustomMailerService {
  private transporter: Transporter;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
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
  ) {
    // const subscription = await this.subscriptionRepo.findOne({
    //   where: { id: subscriptionId }});
    // if (!subscription) {
    //   throw new Error('Subscription not found');
    // }

    console.log('email' + userEmail);

    if (status == 'Activated') {
      const emailBody = subscriptionconformationEmail(
        'Habesha Nets',
        new Date().getFullYear(),
        `${userName}`,
        `${status}`,
      );

      const subject = 'Subscription Payment';

      // const emailContent = `Your subscription with ID ${userEmail} has been ${status}.`;
      await this.sendEmail(userEmail, subject, emailBody);
    } else if (status == 'CANCELED') {
      const emailBody = subscriptioncancelEmail(
        'Habesha Nets',
        new Date().getFullYear(),
        `${userName}`,
        `${status}`,
      );

      const subject = 'Subscription Payment Canceled';

      // const emailContent = `Your subscription with ID ${subscriptionId} has been ${status}.`;
      await this.sendEmail(userEmail, subject, emailBody);
    }
  }
}
