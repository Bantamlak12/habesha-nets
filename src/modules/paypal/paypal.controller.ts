import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PaypalService } from './paypal.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('get-token')
  async getToken() {
    const tokenResponse = await this.paypalService.getAccessToken();
    return tokenResponse;
  }

  //create product
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
}
