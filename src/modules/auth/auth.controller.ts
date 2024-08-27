import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Post,
  Response,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerificationCodeDto } from './dto/verification-code.dto';
import { CustomerProfileDto } from './dto/customer-profile.dto';
import { ProviderProfileDto } from './dto/provider-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: 'This endpoint is used to create an account.' })
  @ApiResponse({
    status: 201,
    description: 'A successful registration message.',
  })
  async createUser(
    @Body() body: CreateUserDto,
    @Response() res: ExpressResponse,
  ) {
    const userId = await this.authService.signup(body);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'Verify your account to complete your registration.',
      userId: userId,
    });
  }

  // @UseGuards(JwtAuthGuard)
  @Post('send-verification/:id')
  @ApiOperation({
    summary: 'This endpoint is used to send a verification code.',
  })
  @ApiResponse({ status: 200 })
  async sendVerification(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    await this.authService.generateAndSendVerificationCode(id);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Verification code sent',
    });
  }

  // @UseGuards()
  @Post('verify/:id')
  @ApiOperation({
    summary: 'This endpoint is used to verify the account with the code sent.',
  })
  @ApiResponse({ status: 200 })
  async verifyAccount(
    @Param('id') id: string,
    @Body() body: VerificationCodeDto,
    @Response() res: ExpressResponse,
  ) {
    await this.authService.verifyAccount(id, body.verificationCode);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Your account is verified',
    });
  }

  @Post('complete-customer-profile/:id')
  @ApiOperation({
    summary: 'This endpoint is used to complete customer profile.',
  })
  @ApiResponse({ status: 201 })
  async completeCustomerProfile(
    @Param('id') id: string,
    @Body() body: CustomerProfileDto,
    @Response() res: ExpressResponse,
  ) {
    const user = await this.authService.completeCustomerProfile(id, body);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'You have completed your profile',
      userId: user,
    });
  }

  @Post('complete-provider-profile/:id')
  @ApiOperation({
    summary: "This endpoint is used to complete service provider's profile",
  })
  @ApiResponse({ status: 201 })
  async completeProvidersProfile(
    @Param('id') id: string,
    @Body() body: ProviderProfileDto,
    @Response() res: ExpressResponse,
  ) {
    const user = await this.authService.completeProviderProfile(id, body);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'You have completed your profile',
      userId: user,
    });
  }
}
