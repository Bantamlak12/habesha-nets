import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  NotFoundException,
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
} from '@nestjs/common';
import { CookieOptions, Response as ExpressResponse } from 'express';
import { Request as ExpressRequest } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
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

    res.cookie('tact', verificationToken, cookieOptionsTact);

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
    let redirectUrl: string;

    if (isProfileCompleted) {
      redirectUrl = 'You are successfully signed in.';
    } else if (user['userType'] === 'employer') {
      redirectUrl = 'PATCH /auth/employers/profile/complete';
    } else if (user['userType'] === 'serviceProvider') {
      redirectUrl = 'PATCH /auth/service-providers/profile/complete';
    } else if (user['userType'] === 'propertyOwner') {
      redirectUrl = 'PATCH /auth/property-owners/profile/complete';
    } else if (user['userType'] === 'propertyRenter') {
      redirectUrl = 'PATCH /auth/property-renters/profile/complete';
    } else if (user['userType'] === 'babySitterFinder') {
      redirectUrl = 'PATCH /auth/baby-sitter-finder/profile/complete';
    }

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      isProfileCompleted: user['isProfileCompleted'],
      message: redirectUrl,
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
}
