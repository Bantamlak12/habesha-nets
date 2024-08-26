import { Body, Controller, HttpStatus, Post, Response } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
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
    await this.authService.signup(body);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'You have successfully registered.',
    });
  }
}
