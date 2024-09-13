import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { accountVerificationEmail } from 'src/shared/mailer/templates/account-verification.template';
import { SmsService } from 'src/shared/sms/sms.service';
import { UploadService } from 'src/shared/upload/upload.service';
import { Employer } from '../users/entities/employer.entity';
import { ServiceProvider } from '../users/entities/serviceProvider.entity';
import { PropertyOwner } from '../users/entities/propertyOwner.entity';
import { PropertyRenter } from '../users/entities/propertyRenter.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { capitalizeString } from 'src/shared/utils/capitilize-string.util';
import { BabySitterFinder } from '../users/entities/babySitterFinder.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employer)
    private readonly employerRepo: Repository<Employer>,
    @InjectRepository(ServiceProvider)
    private readonly serviceProviderRepo: Repository<ServiceProvider>,
    @InjectRepository(PropertyOwner)
    private readonly propertyOwnerRepo: Repository<PropertyOwner>,
    @InjectRepository(PropertyRenter)
    private readonly propertyRenterRepo: Repository<PropertyRenter>,
    @InjectRepository(BabySitterFinder)
    private readonly babySitterFinderRepo: Repository<BabySitterFinder>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly mailerService: CustomMailerService,
    private readonly smsService: SmsService,
    private readonly uploadService: UploadService,
  ) {}
  /****************************************************************************************/
  // COMMONLY USED METHODS
  /****************************************************************************************/

  async hashPassword(
    password: string,
    confirmPassword: string,
  ): Promise<string> {
    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match.');
    }

    const saltRound = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, saltRound);

    return hashedPassword;
  }

  // Random 6-digit number generator
  generateRandomSixDigit() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async validateUser(emailOrPhone: string, password: string) {
    const user = await this.findUserByEmailOrPhone(emailOrPhone, emailOrPhone);

    if (!user) {
      return null;
    }

    // 2) Validate the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async checkUser(repo: Repository<any>, body: any) {
    // Check if email or phone number is not already in use
    const existingUser = await repo.findOne({
      where: [{ email: body.email }, { phoneNumber: body.phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.email === body.email) {
        throw new ConflictException('Email is in use.');
      }
      if (existingUser.phoneNumber === body.phoneNumber) {
        throw new ConflictException('Phone number is in use.');
      }
    }
  }

  generateVerificationToken(user: any) {
    const payload = {
      sub: user.id,
      userType: user.userType,
      isVerified: user.isVerified,
    };
    return this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
  }

  generateAccessToken(user: any) {
    const payload = {
      sub: user.id,
      userType: user.userType,
      isVerified: user.isVerified,
    };
    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }

  async generateRefreshToken(user: any) {
    const payload = {
      sub: user.id,
      userType: user.userType,
      isVerified: user.isVerified,
    };
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const currentDate = new Date();
    const expiresAt = new Date(currentDate);
    expiresAt.setMonth(currentDate.getMonth() + 1);

    // check if there is exisitng token
    const existingToken = await this.refreshTokenRepo.findOne({
      where: { userId: user.id },
    });

    if (existingToken) {
      // Update the existing token
      existingToken.token = refreshToken;
      existingToken.expiresAt = expiresAt;
      await this.refreshTokenRepo.save(existingToken);
    } else {
      const refreshTokenRecord = this.refreshTokenRepo.create({
        userId: user.id,
        token: refreshToken,
        userType: user.userType,
        isVerified: user.isVerfied,
        expiresAt: expiresAt,
      });
      await this.refreshTokenRepo.save(refreshTokenRecord);
    }

    return refreshToken;
  }

  async findUserTypeById(id: string): Promise<string> {
    const user =
      (await this.employerRepo.findOne({ where: { id } })) ||
      (await this.serviceProviderRepo.findOne({ where: { id } })) ||
      (await this.propertyOwnerRepo.findOne({ where: { id } })) ||
      (await this.propertyRenterRepo.findOne({ where: { id } })) ||
      (await this.babySitterFinderRepo.findOne({ where: { id } }));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.userType;
  }

  async findUserByEmailOrPhone(email: string, phoneNumber: string) {
    let user: any;

    user = await this.employerRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (user) return user;

    user = await this.serviceProviderRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (user) return user;

    user = await this.propertyOwnerRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (user) return user;

    user = await this.propertyRenterRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (user) return user;

    user = await this.babySitterFinderRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (user) return user;
  }

  /****************************************************************************************/
  // APPLICATION RELATED METHODS
  /****************************************************************************************/

  // ⁡⁢⁢𝗜𝗡𝗜𝗧𝗜𝗔𝗟 𝗦𝗜𝗚𝗡𝗨𝗣⁡
  async signup(body: any) {
    if (body.userType === 'employer') {
      const hashedPassword = await this.hashPassword(
        body.password,
        body.confirmPassword,
      );
      // Create the user and save to the database
      const user = this.employerRepo.create({
        userType: body.userType,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
      });
      await this.employerRepo.save(user);
      await this.generateAndSendVerificationCode(this.employerRepo, user.id);
      return user;
    } else if (body.userType === 'serviceProvider') {
      const hashedPassword = await this.hashPassword(
        body.password,
        body.confirmPassword,
      );
      // Create the user and save to the database
      const user = this.serviceProviderRepo.create({
        userType: body.userType,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
      });
      await this.serviceProviderRepo.save(user);
      await this.generateAndSendVerificationCode(
        this.serviceProviderRepo,
        user.id,
      );
      return user;
    } else if (body.userType === 'propertyOwner') {
      const hashedPassword = await this.hashPassword(
        body.password,
        body.confirmPassword,
      );
      // Create the user and save to the database
      const user = this.propertyOwnerRepo.create({
        userType: body.userType,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
      });
      await this.propertyOwnerRepo.save(user);
      await this.generateAndSendVerificationCode(
        this.propertyOwnerRepo,
        user.id,
      );
      return user;
    } else if (body.userType === 'propertyRenter') {
      const hashedPassword = await this.hashPassword(
        body.password,
        body.confirmPassword,
      );
      // Create the user and save to the database
      const user = this.propertyRenterRepo.create({
        userType: body.userType,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
      });
      await this.propertyRenterRepo.save(user);
      await this.generateAndSendVerificationCode(
        this.propertyRenterRepo,
        user.id,
      );
      return user;
    } else if (body.userType === 'babySitterFinder') {
      const hashedPassword = await this.hashPassword(
        body.password,
        body.confirmPassword,
      );
      // Create the user and save to the database
      const user = this.babySitterFinderRepo.create({
        userType: body.userType,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
      });
      await this.babySitterFinderRepo.save(user);
      await this.generateAndSendVerificationCode(
        this.babySitterFinderRepo,
        user.id,
      );
      return user;
    } else {
      return false;
    }
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢⁡⁢⁢⁢𝗔𝗖𝗖𝗢𝗨𝗡𝗧 𝗩𝗘𝗥𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡⁡
  // Send 6-digit SMS or email verification code to the user
  async generateAndSendVerificationCode(
    repo: Repository<any>,
    userId: string,
  ): Promise<void> {
    const user = await repo.findOne({
      where: { id: userId },
    });

    // Check if the account is verified
    if (user.isVerified) {
      throw new UnauthorizedException('Account is already verified');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationCode = this.generateRandomSixDigit();
    const expiryTime = 2;
    const verificationCodeExpires = new Date(
      Date.now() + expiryTime * 60 * 1000,
    );

    await repo.update(userId, {
      verificationCode,
      verificationCodeExpires,
    });

    const emailBody = accountVerificationEmail(
      'Habesha Nets',
      new Date().getFullYear(),
      expiryTime,
      verificationCode,
    );
    const subject = 'Account verification code';

    if (user.email) {
      try {
        await this.mailerService.sendEmail(user.email, subject, emailBody);
      } catch (error) {
        throw new ServiceUnavailableException(
          `Failed to send email. Please try again later. ${error}`,
        );
      }
    } else if (user.phoneNumber) {
      try {
        const message = `Your account verification code ${verificationCode}`;
        await this.smsService.sendSms(user.phoneNumber, message);
      } catch (error) {
        throw new ServiceUnavailableException(
          `Failed to send SMS. Please try again later. ${error}`,
        );
      }
    } else {
      throw new BadRequestException('Employer has no email or phone number');
    }
  }

  async verifyAccount(repo: Repository<any>, userId: string, code: string) {
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Employer not found');
    }

    if (user.isVerified) {
      throw new UnauthorizedException('Account is already verified');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationCodeExpires < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    await repo.update(userId, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    });

    return true;
  }

  async signInUser(user: any) {
    // Generate JWT tokens and return
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 ⁡⁢⁢⁢𝗘𝗠𝗣𝗟𝗢𝗬𝗘𝗥⁡
  async completeEmployerProfile(
    repo: Repository<any>,
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isProfileCompleted) {
      throw new BadRequestException('Profile is already completed');
    }

    let profileURL: string | undefined;
    if (profileImg && process.env.NODE_ENV === 'development') {
      profileURL = await this.uploadService.uploadFile(profileImg, 'images');
    } else if (profileImg && process.env.NODE_ENV === 'production') {
      profileURL = await this.uploadService.uploadFileToS3(profileImg);
    }

    // Update the fields
    const updatedUser = await repo.update(userId, {
      firstName: capitalizeString(body.firstName),
      lastName: capitalizeString(body.lastName),
      email: user.email ? user.email : body.email,
      phoneNumber: user.phoneNumber ? user.phoneNumber : body.phoneNumber,
      companyName: body.companyName,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
      bio: body.bio,
    });

    await repo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 𝗣𝗥𝗢𝗩𝗜𝗗𝗘𝗥𝗦⁡
  async completeServiceProvidersProfile(
    repo: Repository<any>,
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
    portfolioFiles: Express.Multer.File[],
  ) {
    // Check if the user exists
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isProfileCompleted) {
      throw new BadRequestException('Profile is already completed');
    }

    let profileURL: string | undefined;
    if (profileImg && process.env.NODE_ENV === 'development') {
      profileURL = await this.uploadService.uploadFile(profileImg, 'images');
    } else if (profileImg && process.env.NODE_ENV === 'production') {
      profileURL = await this.uploadService.uploadFileToS3(profileImg);
    }

    let portfolioUrls: string[] = [];
    if (portfolioFiles && process.env.NODE_ENV === 'development') {
      portfolioUrls = await Promise.all(
        portfolioFiles.map(async (file) => {
          return await this.uploadService.uploadFile(file, 'portfolios');
        }),
      );
    } else if (portfolioFiles && process.env.NODE_ENV === 'production') {
      portfolioUrls = await Promise.all(
        portfolioFiles.map(async (file) => {
          return await this.uploadService.uploadFile(file, 'portfolios');
        }),
      );
    }

    // Update the fields
    const updatedUser = await repo.update(userId, {
      firstName: capitalizeString(body.firstName),
      lastName: capitalizeString(body.lastName),
      email: user.email ? user.email : body.email,
      phoneNumber: user.phoneNumber ? user.phoneNumber : body.phoneNumber,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
      profession: body.profession,
      skills: body.skills,
      qualifications: body.qualifications,
      portfolioLinks: body.portfolioLinks,
      portfolioFiles: portfolioUrls,
      bio: body.bio,
      experience: body.experience,
      availability: body.availability,
      languages: body.languages,
      hourlyRate: body.hourlyRate,
    });

    await repo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗣𝗥𝗢𝗣𝗘𝗥𝗧𝗬 𝗢𝗪𝗡𝗘𝗥𝗦⁡
  async completePropertyOwnersProfile(
    repo: Repository<any>,
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isProfileCompleted) {
      throw new BadRequestException('Profile is already completed');
    }

    let profileURL: string | undefined;
    if (profileImg && process.env.NODE_ENV === 'development') {
      profileURL = await this.uploadService.uploadFile(profileImg, 'images');
    } else if (profileImg && process.env.NODE_ENV === 'production') {
      profileURL = await this.uploadService.uploadFileToS3(profileImg);
    }

    // Update the fields
    const updatedUser = await repo.update(userId, {
      firstName: capitalizeString(body.firstName),
      lastName: capitalizeString(body.lastName),
      email: user.email ? user.email : body.email,
      phoneNumber: user.phoneNumber ? user.phoneNumber : body.phoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
      propertyType: body.propertyType,
    });

    await repo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗣𝗥𝗢𝗣𝗘𝗥𝗧𝗬 𝗥𝗘𝗡𝗧𝗘𝗥⁡
  async completePropertyRenterProfile(
    repo: Repository<any>,
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isProfileCompleted) {
      throw new BadRequestException('Profile is already completed');
    }

    let profileURL: string | undefined;
    if (profileImg && process.env.NODE_ENV === 'development') {
      profileURL = await this.uploadService.uploadFile(profileImg, 'images');
    } else if (profileImg && process.env.NODE_ENV === 'production') {
      profileURL = await this.uploadService.uploadFileToS3(profileImg);
    }

    // Update the fields
    const updatedUser = await repo.update(userId, {
      firstName: capitalizeString(body.firstName),
      lastName: capitalizeString(body.lastName),
      email: user.email ? user.email : body.email,
      phoneNumber: user.phoneNumber ? user.phoneNumber : body.phoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
      budgetRange: body.budgetRange,
    });

    await repo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁢⁢⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗕𝗔𝗕𝗬 𝗦𝗜𝗧𝗧𝗘𝗥 𝗙𝗜𝗡𝗗𝗘𝗥⁡
  async completeBabySitterFinderProfile(
    repo: Repository<any>,
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isProfileCompleted) {
      throw new BadRequestException('Profile is already completed');
    }

    let profileURL: string | undefined;
    if (profileImg && process.env.NODE_ENV === 'development') {
      profileURL = await this.uploadService.uploadFile(profileImg, 'images');
    } else if (profileImg && process.env.NODE_ENV === 'production') {
      profileURL = await this.uploadService.uploadFileToS3(profileImg);
    }

    // Update the fields
    const updatedUser = await repo.update(userId, {
      firstName: capitalizeString(body.firstName),
      lastName: capitalizeString(body.lastName),
      email: user.email ? user.email : body.email,
      phoneNumber: user.phoneNumber ? user.phoneNumber : body.phoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
    });

    await repo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }
}
