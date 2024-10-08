import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Response,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Patch,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { CookieOptions, Response as ExpressResponse } from 'express';
import { Request as ExpressRequest } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerificationCodeDto } from './dto/verification-code.dto';
import { EmployerProfileDto } from './dto/employer-profile.dto';
import { serviceProvidersDto } from './dto/service-providers-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from './auth.service';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { employerProfileSchema } from 'src/shared/schemas/employer-profile.schema';
import { freelancerProfileSchema } from 'src/shared/schemas/service-providers-profile.schema';
import { PropertyOwnersProfileSchema } from 'src/shared/schemas/property-owner-profile.schema';
import { PropertyRenterProfileSchema } from 'src/shared/schemas/property-renter-profile.schema';
import { babySitterFinder } from 'src/shared/schemas/baby-sitter-finder.schema';
import { BabySitterFinderDto } from './dto/baby-sitter-finder.dto';
import { PropertyOwnerDto } from './dto/property-owner.dto';
import { LoginDto } from './dto/signin-user.dto';
import { PropertyRenterDto } from './dto/property-renter.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/users.entity';
import { CareGiverFinder } from 'src/shared/schemas/care-giver-finder.schema';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/password-reset.dto';
import { OtpDto } from './dto/password-reset-opt.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  isValidUUID(identifier: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(identifier);
  }

  // REGISTER A NEW USER
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
    // 1) Check if the user exists
    await this.authService.checkUser(this.userRepo, body);

    // 2) Register the user and get the user
    const user = await this.authService.signup(body);

    // 3) Generate verification token
    const verificationToken = this.authService.generateVerificationToken(user);

    // 4) Set access token to cookie
    const cookieOptionsTact: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    };

    res.cookie('act', verificationToken, cookieOptionsTact);

    // 5) Generate and send a verification code
    try {
      await this.authService.generateAndSendVerificationCode(user.id);
    } catch {
      return res.status(HttpStatus.CREATED).json({
        status: 'success',
        statusCode: 201,
        message:
          'Registration successful, but there was an issue sending the verification code. Please resend the verification code.',
      });
    }

    // 6) Send response
    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Verify your account to complete your registration.',
    });
  }

  // SEND VERIFICATION CODE TO THE REGISTERED USER
  @Post('send-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'This endpoint is used to send a verification code.',
  })
  @ApiResponse({ status: 200 })
  async sendVerification(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
  ) {
    const id = req.user['sub'];
    await this.authService.generateAndSendVerificationCode(id);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'Verification code sent',
    });
  }

  // VERIFY THE REGISTERED USER
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'This endpoint is used to verify the account with the code sent.',
  })
  @ApiResponse({ status: 200 })
  async verifyAccount(
    @Body() body: VerificationCodeDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
  ) {
    const id = req.user['sub'];
    await this.authService.verifyAccount(id, body.verificationCode);
    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'Your account is verified',
    });
  }

  @Post('signin')
  @UseGuards(AuthGuard('local'))
  @ApiOperation({
    summary: 'This endpoint is used to sign in a user.',
  })
  @ApiResponse({ status: 200 })
  async login(
    @Body() body: LoginDto,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const user = req.user;
    const tokens = await this.authService.signInUser(user);

    const userAgent = req.headers['user-agent'] || 'Unkown Device';
    const ipAddress = req.ip || 'Unknown IP'; // req.headers['x-forwarded-for']

    // Save the refresh token to DB
    await this.authService.saveRefreshToken(
      user,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    const cookieOptionsRft: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const cookieOptionsAct: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    };

    res.cookie('rft', tokens.refreshToken, cookieOptionsRft);
    res.cookie('act', tokens.accessToken, cookieOptionsAct);

    const isProfileCompleted = user['isProfileCompleted'];
    let message: string;
    if (isProfileCompleted) {
      message = 'You are successfully signed in.';
    } else {
      message = 'You must complete your profile.';
    }

    const signedInUser = await this.userRepo.findOne({
      where: { id: user['id'] },
    });
    if (signedInUser) delete signedInUser.password;

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message,
      user: signedInUser,
    });
  }

  @Post('signout')
  @ApiOperation({
    summary: 'This endpoint is used to sign out a user.',
  })
  @ApiResponse({ status: 200 })
  async signout(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const refreshToken = req?.cookies?.['rft'];

    res.clearCookie('act');
    res.clearCookie('rft');

    await this.authService.validateRefreshToken(refreshToken, true);

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'You have successfully logged out',
    });
  }

  @Post('refresh-token')
  @ApiOperation({
    summary:
      'Refresh the access token using the refresh token stored in cookies.',
  })
  @ApiResponse({ status: 200 })
  async refreshToken(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const refreshToken = req?.cookies?.['rft'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Validate the refresh token
    const user = await this.authService.validateRefreshToken(refreshToken);

    // If valid, generate a new access token
    const accessToken = this.authService.generateAccessToken(user);

    const cookieOptionsAct: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    };

    res.cookie('act', accessToken, cookieOptionsAct);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'Token refreshed successfully',
    });
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'This endpoint is used to change a password.' })
  @ApiResponse({ status: 200 })
  async updatePassword(
    @Body() body: UpdatePasswordDto,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const userId = req.user['sub'];

    if (!userId) {
      throw new UnauthorizedException();
    }

    const currentPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;
    if (currentPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const rowAffected = await this.authService.updatePassword(
      userId,
      body.currentPassword,
      body.newPassword,
      body.confirmPassword,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Password changed successfully',
      rowAffected,
    });
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'This end point is used to request a password reset link.',
  })
  @ApiResponse({ status: 200 })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    await this.authService.forgotPassword(req, body.emailOrPhoneNumber);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message:
        'Password reset link/OTP has been sent to your email/phone number.',
    });
  }

  @Post('check-opt')
  @ApiOperation({
    summary: 'This end point is used to check the validity of the OTP sent',
  })
  @ApiResponse({ status: 200 })
  async checkOtpValidity(
    @Body() body: OtpDto,
    @Response() res: ExpressResponse,
  ) {
    const resetOtpId = await this.authService.checkOtp(body.otp);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'OTP is valid. Return back the id.',
      id: resetOtpId,
    });
  }

  @Patch('reset-password/:identifier')
  @ApiOperation({
    summary:
      'This endpoint is used to reset your password if the token sent to your email is still valid.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'A unique token/OTP sent to your email for password reset.',
  })
  @ApiResponse({
    status: 200,
    description:
      'A success message indicating that the password has been successfully reset.',
  })
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Param('identifier') identifier: string,
    @Response() res: ExpressResponse,
  ) {
    const tokenOrOtp = identifier.split(':')[0];

    let userId: string;
    let token: string;
    let otpRecordId: string;

    const isUUID = this.isValidUUID(tokenOrOtp);
    if (isUUID) {
      otpRecordId = identifier.split(':')[0];
      userId = identifier.split(':')[1];
    } else {
      token = identifier.split(':')[0];
      userId = identifier.split(':')[1];
    }

    await this.authService.resetPassword(
      userId,
      token,
      otpRecordId,
      body.newPassword,
      body.confirmPassword,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'You have successfully reset your pasword.',
    });
  }

  // COMPLETE EMPLOYER PROFILE
  @Patch('employers/profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'This endpoint is used to complete employer profile.',
  })
  @ApiBody({ schema: employerProfileSchema })
  @ApiResponse({ status: 201 })
  async completeEmployerProfile(
    @Body() body: EmployerProfileDto,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /\/(jpeg|png|jpg)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const id = req.user['sub'];
    const userType = req.user['userType'];

    if (userType !== 'employer') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }

    const user = await this.authService.completeEmployerProfile(id, body, file);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  // COMPLETE SERVICE PROVIDERS PROFILES
  @Patch('service-providers/profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'portfolioFiles', maxCount: 5 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'This endpoint is used to complete service Providers profile.',
  })
  @ApiBody({ schema: freelancerProfileSchema })
  @ApiResponse({ status: 201 })
  async completeServiceProvidersProfile(
    @Body() body: serviceProvidersDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File;
      portfolioFiles?: Express.Multer.File[];
    },
  ) {
    const profilePicture = files?.profilePicture?.[0];
    const portfolioFiles = files?.portfolioFiles || [];

    // Check if profile picture did not exceed 2MB
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'The size of the profile picture must not exceed 2MB.',
      );
    }

    // Check if the uploaded file is image
    if (profilePicture && !profilePicture.mimetype.match(/\/(jpeg|png|jpg)$/)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and JPG formats are allowed for profile picture.',
      );
    }

    // Check the portfolio files size. It's should not exceed 10MB in total
    let totalSize: number = 0;
    let imageCount: number = 0;
    let pdfCount: number = 0;

    portfolioFiles.forEach((file) => {
      totalSize += file.size;
      if (file.mimetype.startsWith('image/')) {
        imageCount++;
      } else if (file.mimetype.startsWith('application/pdf')) {
        pdfCount++;
      } else {
        throw new BadRequestException(
          'Only images or PDF file is allowed to upload.',
        );
      }
    });

    if (imageCount > 5) {
      throw new BadRequestException(
        'You can upload a maximum of 5 images for portfolio files.',
      );
    }

    if (pdfCount > 1) {
      throw new BadRequestException(
        'You can upload only one PDF file for portfolio files.',
      );
    }

    if (totalSize > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Total size of portfolio files should not exceed 10MB.',
      );
    }

    const id = req.user['sub'];
    const userType = req.user['userType'];
    if (userType !== 'serviceProvider') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }
    const user = await this.authService.completeServiceProvidersProfile(
      id,
      body,
      profilePicture,
      portfolioFiles,
    );

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  // COMPLETE PROPERTY OWNER PROFILE
  @Patch('property-owners/profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'This endpoint is used to complete property owners profile.',
  })
  @ApiBody({ schema: PropertyOwnersProfileSchema })
  @ApiResponse({ status: 201 })
  async completePropertyOwnersProfile(
    @Body() body: PropertyOwnerDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File;
    },
  ) {
    const profilePicture = files?.profilePicture?.[0];

    // Check if profile picture did not exceed 2MB
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'The size of the profile picture must not exceed 2MB.',
      );
    }

    // Check if the uploaded file is image
    if (profilePicture && !profilePicture.mimetype.match(/\/(jpeg|png|jpg)$/)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and JPG formats are allowed for profile picture.',
      );
    }

    const id = req.user['sub'];
    const userType = req.user['userType'];

    if (userType !== 'propertyOwner') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }

    const user = await this.authService.completePropertyOwnersProfile(
      id,
      body,
      profilePicture,
    );

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  // COMPLETE PROPERTY RENTER PROFILE
  @Patch('property-renters/profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'This endpoint is used to complete property renters profile.',
  })
  @ApiBody({ schema: PropertyRenterProfileSchema })
  @ApiResponse({ status: 201 })
  async completePropertyRenterProfile(
    @Body() body: PropertyRenterDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File;
    },
  ) {
    const profilePicture = files?.profilePicture?.[0];

    // Check if profile picture did not exceed 2MB
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'The size of the profile picture must not exceed 2MB.',
      );
    }

    // Check if the uploaded file is image
    if (profilePicture && !profilePicture.mimetype.match(/\/(jpeg|png|jpg)$/)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and JPG formats are allowed for profile picture.',
      );
    }

    const id = req.user['sub'];
    const userType = req.user['userType'];
    if (userType !== 'propertyRenter') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }
    const user = await this.authService.completePropertyRenterProfile(
      id,
      body,
      profilePicture,
    );

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  // COMPLETE BABY SITTER FINDER PROFILE
  @Patch('baby-sitter-finder/profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: "This endpoint is used to complete baby sitter finder's profile.",
  })
  @ApiBody({ schema: babySitterFinder })
  @ApiResponse({ status: 201 })
  async completeBabySitterFinderProfile(
    @Body() body: BabySitterFinderDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File;
    },
  ) {
    const profilePicture = files?.profilePicture?.[0];

    // Check if profile picture did not exceed 2MB
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'The size of the profile picture must not exceed 2MB.',
      );
    }

    // Check if the uploaded file is image
    if (profilePicture && !profilePicture.mimetype.match(/\/(jpeg|png|jpg)$/)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and JPG formats are allowed for profile picture.',
      );
    }

    const id = req.user['sub'];
    const userType = req.user['userType'];
    if (userType !== 'babySitterFinder') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }

    const user = await this.authService.completeBabySitterFinderProfile(
      id,
      body,
      profilePicture,
    );

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  // COMPLETE CARE GIVER PROFILE
  @Patch('care-giver-finder/profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: "This endpoint is used to complete care giver finder's profile.",
  })
  @ApiBody({ schema: CareGiverFinder })
  @ApiResponse({ status: 201 })
  async completeCareGiverFinderProfile(
    @Body() body: BabySitterFinderDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File;
    },
  ) {
    const profilePicture = files?.profilePicture?.[0];

    // Check if profile picture did not exceed 2MB
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'The size of the profile picture must not exceed 2MB.',
      );
    }

    // Check if the uploaded file is image
    if (profilePicture && !profilePicture.mimetype.match(/\/(jpeg|png|jpg)$/)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and JPG formats are allowed for profile picture.',
      );
    }

    const id = req.user['sub'];
    const userType = req.user['userType'];
    if (userType !== 'careGiverFinder') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }

    const user = await this.authService.completeCareGiverFinderProfile(
      id,
      body,
      profilePicture,
    );

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }
}
