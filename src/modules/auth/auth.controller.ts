import {
  Body,
  Controller,
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Response,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerificationCodeDto } from './dto/verification-code.dto';
import { CustomerProfileDto } from './dto/customer-profile.dto';
import { ProviderProfileDto } from './dto/provider-profile.dto';
import { CreateEmployerDto } from './dto/create-employer.dto';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';

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
    @Body() body: CreateEmployerDto,
    @Response() res: ExpressResponse,
  ) {
    const userId = await this.authService.signup(body);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'Verify your account to complete your registration.',
      userId: userId,
    });
  }

  // // @UseGuards(JwtAuthGuard)
  // @Post('send-verification/:id')
  // @ApiOperation({
  //   summary: 'This endpoint is used to send a verification code.',
  // })
  // @ApiResponse({ status: 200 })
  // async sendVerification(
  //   @Param('id') id: string,
  //   @Response() res: ExpressResponse,
  // ) {
  //   await this.authService.generateAndSendVerificationCode(id);

  //   return res.status(HttpStatus.OK).json({
  //     status: 'success',
  //     message: 'Verification code sent',
  //   });
  // }

  // // @UseGuards()
  // @Post('verify/:id')
  // @ApiOperation({
  //   summary: 'This endpoint is used to verify the account with the code sent.',
  // })
  // @ApiResponse({ status: 200 })
  // async verifyAccount(
  //   @Param('id') id: string,
  //   @Body() body: VerificationCodeDto,
  //   @Response() res: ExpressResponse,
  // ) {
  //   await this.authService.verifyAccount(id, body.verificationCode);

  //   return res.status(HttpStatus.OK).json({
  //     status: 'success',
  //     message: 'Your account is verified',
  //   });
  // }

  // @Post('complete-customer-profile/:id')
  // @UseInterceptors(FileInterceptor('profilePicture'))
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({
  //   summary: 'This endpoint is used to complete customer profile.',
  // })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       firstName: { type: 'string', example: 'John' },
  //       lastName: { type: 'string', example: 'Doe' },
  //       email: { type: 'string', example: 'john12@gmail.com', nullable: true },
  //       phoneNumber: {
  //         type: 'string',
  //         example: '+25424545475',
  //         nullable: true,
  //       },
  //       profilePicture: {
  //         type: 'string',
  //         format: 'binary',
  //         description: 'Profile picture file',
  //       },
  //       location: {
  //         type: 'object',
  //         properties: {
  //           city: { type: 'string', example: 'Los Angeles' },
  //           state: { type: 'string', example: 'California' },
  //           country: { type: 'string', example: 'USA' },
  //         },
  //       },
  //     },
  //   },
  // })
  // @ApiResponse({ status: 201 })
  // async completeCustomerProfile(
  //   @Param('id') id: string,
  //   @Body() body: CustomerProfileDto,
  //   @Response() res: ExpressResponse,
  //   @UploadedFile(
  //     new ParseFilePipe({
  //       validators: [
  //         new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
  //         new FileTypeValidator({ fileType: /\/(jpeg|png|jpg)$/ }),
  //       ],
  //       fileIsRequired: false,
  //     }),
  //   )
  //   file?: Express.Multer.File,
  // ) {
  //   const user = await this.authService.completeCustomerProfile(id, body, file);

  //   return res.status(HttpStatus.CREATED).json({
  //     status: 'success',
  //     message: 'You have completed your profile',
  //     rowAffected: user.affected,
  //   });
  // }

  // @Post('complete-provider-profile/:id')
  // @UseInterceptors(FileInterceptor('profilePicture'))
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({
  //   summary: "This endpoint is used to complete service provider's profile",
  // })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       firstName: { type: 'string', example: 'John' },
  //       lastName: { type: 'string', example: 'Doe' },
  //       email: { type: 'string', example: 'john12@gmail.com', nullable: true },
  //       phoneNumber: {
  //         type: 'string',
  //         example: '+25424545475',
  //         nullable: true,
  //       },
  //       profilePicture: {
  //         type: 'string',
  //         format: 'binary',
  //         description: 'Profile picture file',
  //       },
  //       location: {
  //         type: 'object',
  //         properties: {
  //           city: { type: 'string', example: 'Los Angeles' },
  //           state: { type: 'string', example: 'California' },
  //           country: { type: 'string', example: 'USA' },
  //         },
  //       },
  //     },
  //   },
  // })
  // @ApiResponse({ status: 201 })
  // async completeProvidersProfile(
  //   @Param('id') id: string,
  //   @Body() body: ProviderProfileDto,
  //   @Response() res: ExpressResponse,
  //   @UploadedFile(
  //     new ParseFilePipe({
  //       validators: [
  //         new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
  //         new FileTypeValidator({ fileType: /\/(jpeg|png|jpg)$/ }),
  //       ],
  //       fileIsRequired: false,
  //     }),
  //   )
  //   file?: Express.Multer.File,
  // ) {
  //   const user = await this.authService.completeProviderProfile(id, body, file);

  //   return res.status(HttpStatus.CREATED).json({
  //     status: 'success',
  //     message: 'You have completed your profile',
  //     rowAffected: user.affected,
  //   });
  // }
}
