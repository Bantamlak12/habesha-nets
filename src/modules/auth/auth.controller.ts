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
  FilesInterceptor,
} from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employer } from '../users/entities/employer.entity';
import { ServiceProvider } from '../users/entities/serviceProvider.entity';
import { PropertyOwner } from '../users/entities/propertyOwner.entity';
import { PropertyRenter } from '../users/entities/propertyRenter.entity';
import { employerProfileSchema } from 'src/shared/schemas/employer-profile.schema';
import { freelancerProfileSchema } from 'src/shared/schemas/service-providers-profile.schema';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/signin-user.dto';
import { User } from '../users/entities/users.entity';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Employer)
    private readonly employerRepo: Repository<Employer>,
    @InjectRepository(ServiceProvider)
    private readonly serviceProviderRepo: Repository<ServiceProvider>,
    @InjectRepository(PropertyOwner)
    private readonly propertyOwnerRepo: Repository<PropertyOwner>,
    @InjectRepository(PropertyRenter)
    private readonly propertyRenterRepo: Repository<PropertyRenter>,
  ) {}

  async returnRepository(id: string) {
    const userType = await this.authService.findUserTypeById(id);
    if (!userType) {
      throw new NotFoundException('User not found');
    }

    let repository: Repository<any>;
    switch (userType) {
      case 'employer':
        repository = this.employerRepo;
        break;
      case 'serviceProvider':
        repository = this.serviceProviderRepo;
        break;
      case 'propertyOwner':
        repository = this.propertyOwnerRepo;
        break;
      case 'propertyRenter':
        repository = this.propertyRenterRepo;
        break;
      default:
        throw new BadRequestException('Invalid user type');
    }

    return repository;
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
    await this.authService.checkUser(this.employerRepo, body);
    await this.authService.checkUser(this.serviceProviderRepo, body);
    await this.authService.checkUser(this.propertyOwnerRepo, body);
    await this.authService.checkUser(this.propertyRenterRepo, body);

    // 2) Register the user and get the user
    const user = await this.authService.signup(body);

    // 3) Generate verification token
    const verificationToken = this.authService.generateVerificationToken(user);

    // 4) Send response
    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Verify your account to complete your registration.',
      verificationToken,
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
    const repository = await this.returnRepository(id);
    await this.authService.generateAndSendVerificationCode(repository, id);

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
    const repository = await this.returnRepository(id);
    await this.authService.verifyAccount(repository, id, body.verificationCode);
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

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie('rft', tokens.refreshToken, cookieOptions);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'You are successfully signed in.',
      accessToken: tokens.accessToken,
    });
  }

  // COMPLETE EMPLOYER PROFILE
  @Patch('complete-employer-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'This endpoint is used to complete customer profile.',
  })
  @ApiBody({ schema: employerProfileSchema })
  @ApiResponse({ status: 201 })
  async completeEmployerProfile(
    @Body() body: serviceProvidersDto,
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
    const repository = await this.returnRepository(id);

    let user: any;
    if (repository == this.employerRepo) {
      user = await this.authService.completeEmployerProfile(
        repository,
        id,
        body,
        file,
      );
    }

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  // COMPLETE PROFESSIONAL FREELANCERS PROFILES
  @Patch('complete-service-providers-profile')
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
    const repository = await this.returnRepository(id);
    let user: any;
    if (repository == this.serviceProviderRepo) {
      user = await this.authService.completeServiceProvidersProfile(
        repository,
        id,
        body,
        profilePicture,
        portfolioFiles,
      );
    }

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }
}
