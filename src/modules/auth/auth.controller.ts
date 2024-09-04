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
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
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
import { FreelancerProfileDto } from './dto/freelancer-profile.dto';
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
import { Freelancer } from '../users/entities/freelancer.entity';
import { ServiceProvider } from '../users/entities/serviceProvider.entity';
import { PropertyOwner } from '../users/entities/propertyOwner.entity';
import { PropertyRenter } from '../users/entities/propertyRenter.entity';
import { employerProfileSchema } from 'src/shared/schemas/employer-profile.schema';
import { freelancerProfileSchema } from 'src/shared/schemas/freelancer-profile.schema';
import { VerificationGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/signin-user.dto';
import { User } from '../users/entities/users.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Employer)
    private readonly employerRepo: Repository<Employer>,
    @InjectRepository(Freelancer)
    private readonly freelancerRepo: Repository<Freelancer>,
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
      case 'freelancer':
        repository = this.freelancerRepo;
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
    await this.authService.validateUser(this.employerRepo, body);
    await this.authService.validateUser(this.freelancerRepo, body);
    await this.authService.validateUser(this.serviceProviderRepo, body);
    await this.authService.validateUser(this.propertyOwnerRepo, body);
    await this.authService.validateUser(this.propertyRenterRepo, body);

    // 2) Register the user and get the user
    const user = await this.authService.signup(body);

    // 3) Generate verification token
    const verificationToken = this.authService.generateVerificationToken(user);

    // 4) Send response
    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'Verify your account to complete your registration.',
      verificationToken,
    });
  }

  // SEND VERIFICATION CODE TO THE REGISTERED USER
  @Post('send-verification')
  @UseGuards(VerificationGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'This endpoint is used to send a verification code.',
  })
  @ApiResponse({ status: 200 })
  async sendVerification(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
  ) {
    const id = req.user['userId'];
    const repository = await this.returnRepository(id);
    await this.authService.generateAndSendVerificationCode(repository, id);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Verification code sent',
    });
  }

  // VERIFY THE REGISTERED USER
  @Post('verify')
  @UseGuards(VerificationGuard)
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
    const id = req.user['userId'];
    const repository = await this.returnRepository(id);
    await this.authService.verifyAccount(repository, id, body.verificationCode);
    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Your account is verified',
    });
  }

  @Post('signin')
  @ApiOperation({
    summary: 'This endpoint is used to sign in a user.',
  })
  @ApiResponse({ status: 200 })
  async login(@Body() body: LoginDto, @Response() res: ExpressResponse) {
    const tokens = await this.authService.signInUser(body);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'You are successfully logged in.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  // COMPLETE EMPLOYER PROFILE
  @Post('complete-employer-profile')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'This endpoint is used to complete customer profile.',
  })
  @ApiBody({ schema: employerProfileSchema })
  @ApiResponse({ status: 201 })
  async completeEmployerProfile(
    @Body() body: EmployerProfileDto,
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
    const id = '5';
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
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  // COMPLETE PROFESSIONAL FREELANCERS PROFILES
  @Post('complete-freelancer-profile')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'This endpoint is used to complete customer profile.',
  })
  @ApiBody({ schema: freelancerProfileSchema })
  @ApiResponse({ status: 201 })
  async completeFreelancerProfile(
    @Body() body: FreelancerProfileDto,
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
    profilePicture?: Express.Multer.File,
  ) {
    const id = '5';
    const repository = await this.returnRepository(id);
    let user: any;
    if (repository == this.freelancerRepo) {
      user = await this.authService.completeFreelancerProfile(
        repository,
        id,
        body,
        profilePicture,
      );
    }
    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }
}
