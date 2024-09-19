import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaypalService {
  private PAYPAL_API: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.PAYPAL_API = this.config.get<string>('PAYPAL_API');
  }

  async getAccessToken(): Promise<string> {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET');

    // Construct authorization header
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const requestConfig = {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const body = 'grant_type=client_credentials';

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          `${this.PAYPAL_API}/v1/oauth2/token`,
          body,
          requestConfig,
        ),
      );
      return response.data.access_token;
    } catch (err) {
      throw new HttpException(
        'Failed to retrieve paypal access token',
        err.response?.status || 500,
      );
    }
  }

  async createOrder(plan: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    let price = 0;
    if (plan === 'monthly') price = 14.99;
    else if (plan === 'six-month') price = 64.99;
    else if (plan === 'yearly') price = 99.99;

    const requestBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: price.toFixed(2),
          },
        },
      ],
    };

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          `${this.PAYPAL_API}/v2/checkout/orders`,
          requestBody,
          requestConfig,
        ),
      );
      return response.data;
    } catch (err) {
      throw new HttpException(
        'Failed to create paypal order',
        err.response?.status || 500,
      );
    }
  }

  async captureOrder(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          `${this.PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
          {},
          requestConfig,
        ),
      );
      return response.data;
    } catch (err) {
      throw new HttpException(
        'Failed to capture paypal order',
        err.response?.status || 500,
      );
    }
  }
}
