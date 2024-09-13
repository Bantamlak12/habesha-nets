import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class CustomMailerService {
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      //   secure: this.config.get<string>('MAIL_SECURE'),
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
      throw new Error(`Email could not be sent, ${error}`);
    }
  }
}
