import { Body, Controller, Param, Post } from '@nestjs/common';
import { PaypalService } from './paypal.service';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('create-order')
  async createOrder(@Body('plan') plan: string) {
    const order = await this.paypalService.createOrder(plan);

    return {
      id: order.id,
      links: order.links.filter((link) => link.rel === 'approve'),
    };
  }

  @Post('capture/:orderId')
  async captureOrder(@Param('orderId') orderId: string) {
    const capture = await this.paypalService.captureOrder(orderId);
    return capture;
  }
}
