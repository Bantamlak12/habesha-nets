import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  randomBytes,
  scrypt as _scrypt,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { accountVerificationEmail } from 'src/shared/mailer/templates/account-verification.template';
import { SmsService } from 'src/shared/sms/sms.service';
import { UploadService } from 'src/shared/upload/upload.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { capitalizeString } from 'src/shared/utils/capitilize-string.util';
import { User } from '../users/entities/users.entity';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

  async hashRefreshToken(token: string): Promise<string> {
    // Generate a salt
    const salt = randomBytes(8).toString('hex');
    // Hash the token using scrypt
    const hash = (await scrypt(token, salt, 32)) as Buffer;
    const hashedToken = salt + '.' + hash.toString('hex');

    return hashedToken;
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
      expiresIn: '48h',
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

  generateRefreshToken(user: any) {
    const payload = {
      sub: user.id,
      userType: user.userType,
      isVerified: user.isVerified,
    };
    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  async saveRefreshToken(
    user: any,
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
  ) {
    const currentDate = new Date();
    const expiresAt = new Date(currentDate);
    expiresAt.setMonth(currentDate.getMonth() + 1);

    const hashedToken = await this.hashRefreshToken(refreshToken);
    const refreshTokenRecord = this.refreshTokenRepo.create({
      token: hashedToken,
      userType: user.userType,
      isVerified: user.isVerified,
      userAgent,
      ipAddress,
      expiresAt: expiresAt,
      user,
    });
    await this.refreshTokenRepo.save(refreshTokenRecord);

    return refreshToken;
  }

  async validateRefreshToken(refreshToken: string) {
    // Verify the refresh tokens validity
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = payload['sub'];
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    const userTokens = await this.refreshTokenRepo.find({
      where: { user: { id: userId } },
    });

    for (const refreshTokenRecored of userTokens) {
      const storedToken = refreshTokenRecored.token;
      const [salt, storedHash] = storedToken.split('.');

      const incomingHash = scryptSync(refreshToken, salt, 32).toString('hex');

      // Use timingSafeEqual to prevent timing attacks
      if (
        timingSafeEqual(
          Buffer.from(storedHash, 'hex'),
          Buffer.from(incomingHash, 'hex'),
        )
      ) {
        return {
          id: user.id,
          userType: user.userType,
          isVerified: user.isVerified,
        };
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async findUserTypeById(id: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.userType;
  }

  async findUserByEmailOrPhone(email: string, phoneNumber: string) {
    const user = await this.userRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (user) return user;
  }

  /****************************************************************************************/
  // APPLICATION RELATED METHODS
  /****************************************************************************************/

  // ⁡⁢⁢⁡⁢⁢⁢𝗜𝗡𝗜𝗧𝗜𝗔𝗟 𝗦𝗜𝗚𝗡𝗨𝗣⁡
  async signup(body: any) {
    const hashedPassword = await this.hashPassword(
      body.password,
      body.confirmPassword,
    );
    // Create the user and save to the database
    const user = this.userRepo.create({
      userType: body.userType,
      email: body.email,
      phoneNumber: body.phoneNumber,
      password: hashedPassword,
    });
    await this.userRepo.save(user);
    await this.generateAndSendVerificationCode(user.id);
    return user;
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢⁡⁢⁢⁢𝗔𝗖𝗖𝗢𝗨𝗡𝗧 𝗩𝗘𝗥𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡⁡
  // Send 6-digit SMS or email verification code to the user
  async generateAndSendVerificationCode(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
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

    await this.userRepo.update(userId, {
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

  async verifyAccount(userId: string, code: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
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

    await this.userRepo.update(userId, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    });

    return true;
  }

  async signInUser(user: any) {
    // Generate JWT tokens and return
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 ⁡⁢⁢⁢𝗘𝗠𝗣𝗟𝗢𝗬𝗘𝗥⁡
  async completeEmployerProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
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
    const updatedUser = await this.userRepo.update(userId, {
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

    await this.userRepo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 𝗣𝗥𝗢𝗩𝗜𝗗𝗘𝗥𝗦⁡
  async completeServiceProvidersProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
    portfolioFiles: Express.Multer.File[],
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
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
    const updatedUser = await this.userRepo.update(userId, {
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

    await this.userRepo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗣𝗥𝗢𝗣𝗘𝗥𝗧𝗬 𝗢𝗪𝗡𝗘𝗥𝗦⁡
  async completePropertyOwnersProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
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
    const updatedUser = await this.userRepo.update(userId, {
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

    await this.userRepo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗣𝗥𝗢𝗣𝗘𝗥𝗧𝗬 𝗥𝗘𝗡𝗧𝗘𝗥⁡
  async completePropertyRenterProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
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
    const updatedUser = await this.userRepo.update(userId, {
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

    await this.userRepo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }

  // ⁡⁢⁢⁢⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗕𝗔𝗕𝗬 𝗦𝗜𝗧𝗧𝗘𝗥 𝗙𝗜𝗡𝗗𝗘𝗥⁡
  async completeBabySitterFinderProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
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
    const updatedUser = await this.userRepo.update(userId, {
      firstName: capitalizeString(body.firstName),
      lastName: capitalizeString(body.lastName),
      email: user.email ? user.email : body.email,
      phoneNumber: user.phoneNumber ? user.phoneNumber : body.phoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
    });

    await this.userRepo.update(userId, { isProfileCompleted: true });

    // ⁡⁢⁢⁢𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

    // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡

    return updatedUser;
  }
}
