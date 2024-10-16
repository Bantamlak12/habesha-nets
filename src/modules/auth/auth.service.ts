import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { accountVerificationEmail } from 'src/shared/mailer/templates/account-verification.template';
import { SmsService } from 'src/shared/sms/sms.service';
import { UploadService } from 'src/shared/upload/upload.service';
import { User } from '../users/entities/users.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { ResetTokens } from './entities/password-reset-token.entity';
import { capitalizeString } from 'src/shared/utils/capitilize-string.util';
import { ConfigService } from '@nestjs/config';
import { generatePasswordResetEmail } from 'src/shared/mailer/templates/password-reset.template';
import { Cron } from '@nestjs/schedule';

const scrypt = promisify(crypto.scrypt);

@Injectable()
export class AuthService {
  private readonly algorithm: string = 'aes-256-cbc';
  private readonly key: any;
  private readonly iv: any;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(ResetTokens)
    private readonly passwordResetTokenRepo: Repository<ResetTokens>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailerService: CustomMailerService,
    private readonly smsService: SmsService,
    private readonly uploadService: UploadService,
  ) {
    this.key = Buffer.from(config.get<string>('PAYPAL_TOKEN_KEY'), 'hex');
    this.iv = Buffer.from(config.get<string>('PAYPAL_TOKEN_IV'), 'hex');
  }
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
    const salt = crypto.randomBytes(8).toString('hex');
    // Hash the token using scrypt
    const hash = (await scrypt(token, salt, 32)) as Buffer;
    const hashedToken = salt + '.' + hash.toString('hex');

    return hashedToken;
  }

  async encryptPaypalToken(token: string) {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${this.iv.toString('hex')}:${encrypted}`;
  }

  async decyptPaypalToken(encyptedToken: string) {
    const [ivHex, encrypted] = encyptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await this.passwordResetTokenRepo.delete({ id });
  }

  // @Cron('*/10 * * * * *') // Runs every 10 seconds
  @Cron('0 0 * * 0') // Runs every sunday at mid-night
  async cleanupExpiredResetTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenRepo.delete({ expiresAt: LessThan(now) });
    await this.passwordResetTokenRepo.delete({
      resetTokenExpiry: LessThan(now),
      OtpExpiry: LessThan(now),
    });
  }

  async resetAndUpdatePassword(
    userId: string,
    id: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const hashedPassword = await this.hashPassword(
      newPassword,
      confirmPassword,
    );
    await this.userRepo.update(userId, {
      password: hashedPassword,
    });
    await this.clearPasswordResetToken(id);
    await this.cleanupExpiredResetTokens();
  }

  // Random 6-digit number generator
  generateRandomSixDigit() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async checkOtp(OTP: string) {
    const resetOTP = await this.passwordResetTokenRepo.findOne({
      where: { OTP },
      relations: ['user'],
    });

    if (!resetOTP || resetOTP.OtpExpiry < new Date()) {
      throw new BadRequestException('Your OTP has expired.');
    }

    const userId = resetOTP.user['id'];

    return `${resetOTP.id}:${userId}`;
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

  async checkEmailOrPhoneNumber(body: any) {
    const userForEmail = await this.userRepo.findOne({
      where: { email: body.email },
    });
    if (body.email === userForEmail?.email) {
      throw new ConflictException('This email has been used');
    }

    const userForPhoneNumber = await this.userRepo.findOne({
      where: { phoneNumber: body.phoneNumber },
    });
    if (body.phoneNumber === userForPhoneNumber?.phoneNumber) {
      throw new ConflictException('This phone number has been used');
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
      tokenType: 'refresh',
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

  async validateRefreshToken(refreshToken: string, signout: boolean = false) {
    // Verify the refresh tokens validity
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET'),
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

      const incomingHash = crypto
        .scryptSync(refreshToken, salt, 32)
        .toString('hex');

      // Use timingSafeEqual to prevent timing attacks
      if (
        crypto.timingSafeEqual(
          Buffer.from(storedHash, 'hex'),
          Buffer.from(incomingHash, 'hex'),
        )
      ) {
        // If signout is true, remove the refresh token from the database
        if (signout) {
          await this.refreshTokenRepo.delete({ token: storedToken });
        }

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
    const expiryTime = 3;
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

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    // Check if the user exist in the database
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new UnauthorizedException();
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      throw new BadRequestException('Current password is not correct');
    }

    // The new password should not be the same as the older password
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'Your new password cannot be the same as your current password',
      );
    }

    const hashedPassword = await this.hashPassword(
      newPassword,
      confirmPassword,
    );

    const rowAffected = (
      await this.userRepo.update(userId, {
        password: hashedPassword,
      })
    ).affected;

    return rowAffected;
  }

  async forgotPassword(req: any, emailOrPhoneNumber: string) {
    const user = await this.userRepo.findOne({
      where: [
        { email: emailOrPhoneNumber },
        { phoneNumber: emailOrPhoneNumber },
      ],
    });

    if (!user) {
      throw new NotFoundException(
        'The provided contact information does not exist.',
      );
    }

    let resetTokenRecord = await this.passwordResetTokenRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (user.email === emailOrPhoneNumber) {
      const token = crypto.randomBytes(32).toString('hex');

      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);

      if (resetTokenRecord) {
        resetTokenRecord.resetToken = hashedToken;
        resetTokenRecord.resetTokenExpiry = expiryTime;
      } else {
        resetTokenRecord = this.passwordResetTokenRepo.create({
          resetToken: hashedToken,
          resetTokenExpiry: expiryTime,
          user,
        });
      }

      const userId = user.id;
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}:${userId}`;
      const emailBody = generatePasswordResetEmail(
        resetUrl,
        new Date().getFullYear(),
      );
      const subject = 'Password Reset';

      await this.mailerService.sendEmail(user.email, subject, emailBody);
      await this.passwordResetTokenRepo.save(resetTokenRecord);
    } else if (user.phoneNumber === emailOrPhoneNumber) {
      const OTP = this.generateRandomSixDigit();
      const expiryTime = 5;
      const OtpExpiry = new Date(Date.now() + expiryTime * 60 * 1000);

      if (resetTokenRecord) {
        resetTokenRecord.OTP = OTP;
        resetTokenRecord.OtpExpiry = OtpExpiry;
      } else {
        resetTokenRecord = this.passwordResetTokenRepo.create({
          OTP,
          OtpExpiry,
          user,
        });
      }

      // await this.smsService.sendSms(user.phoneNumber, OTP);
      await this.passwordResetTokenRepo.save(resetTokenRecord);
    }
  }

  async resetPassword(
    userId: string,
    token: string,
    otpRecordId: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (token) {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const resetToken = await this.passwordResetTokenRepo.findOne({
        where: { resetToken: hashedToken },
      });

      if (!resetToken) {
        throw new BadRequestException(
          'You already may have have reseted your password. Ask a new password reset link.',
        );
      }

      if (resetToken.resetTokenExpiry < new Date()) {
        throw new BadRequestException('Your reset reset link has expired.');
      }

      return await this.resetAndUpdatePassword(
        userId,
        resetToken.id,
        newPassword,
        confirmPassword,
      );
    }

    const resetOTP = await this.passwordResetTokenRepo.findOne({
      where: { id: otpRecordId },
    });

    if (!resetOTP) {
      throw new BadRequestException(
        'You already may have have reseted your password. Ask a new reset OTP.',
      );
    }

    return await this.resetAndUpdatePassword(
      userId,
      otpRecordId,
      newPassword,
      confirmPassword,
    );
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

    await this.checkEmailOrPhoneNumber(body);

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
      address: body.address,
      bio: body.bio,
    });

    await this.userRepo.update(userId, { isProfileCompleted: true });

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

    await this.checkEmailOrPhoneNumber(body);

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
      address: body.address,
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

    await this.checkEmailOrPhoneNumber(body);

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
      address: body.address,
      propertyType: body.propertyType,
    });

    await this.userRepo.update(userId, { isProfileCompleted: true });

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

    await this.checkEmailOrPhoneNumber(body);

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
      address: body.address,
      budgetRange: body.budgetRange,
    });

    await this.userRepo.update(userId, { isProfileCompleted: true });

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

    await this.checkEmailOrPhoneNumber(body);

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
      address: body.address,
    });

    await this.userRepo.update(userId, { isProfileCompleted: true });

    return updatedUser;
  }

  // ⁡⁢⁢⁢⁡⁢⁢⁢𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 ⁡⁢⁢⁢𝗖𝗔𝗥𝗘 𝗚𝗜𝗩𝗘𝗥⁡ ⁡⁢⁢⁢𝗙𝗜𝗡𝗗𝗘𝗥⁡
  async completeCareGiverFinderProfile(
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

    await this.checkEmailOrPhoneNumber(body);

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
      address: body.address,
    });

    await this.userRepo.update(userId, { isProfileCompleted: true });

    return updatedUser;
  }
}
