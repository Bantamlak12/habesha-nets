import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio;

  constructor() {
    const accoundSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioClient = new Twilio(accoundSid, authToken);
  }

  async sendSms(to: string, body: string) {
    const from = process.env.TWILIO_PHONE_NUMBER;
    try {
      const message = await this.twilioClient.messages.create({
        body,
        from,
        to,
      });
      return message;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to send SMS, ${error}`);
    }
  }
}
