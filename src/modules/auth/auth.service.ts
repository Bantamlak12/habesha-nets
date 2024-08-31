import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomMailerService } from 'src/shared/mailer/mailer.service';
import { accountVerificationEmail } from 'src/shared/mailer/templates/account-verification.template';
import { SmsService } from 'src/shared/sms/sms.service';
import { UploadService } from 'src/shared/upload/upload.service';
import { Employer } from '../users/entities/employer.entity';
import { Freelancer } from '../users/entities/freelancer.entity';
import { ServiceProvider } from '../users/entities/serviceProvider.entity';
import { PropertyOwner } from '../users/entities/propertyOwner.entity';
import { PropertyRenter } from '../users/entities/propertyRenter.entity';

@Injectable()
export class AuthService {
  constructor(
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

  async validateAndHash(repo: Repository<any>, body: any) {
    // Validate that email or phone number is not already in use
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

    // Check if the password and confirmPassword do match
    const hashedPassword = await this.hashPassword(
      body.password,
      body.confirmPassword,
    );

    return hashedPassword;
  }

  async findUserTypeById(id: string): Promise<string> {
    const user =
      (await this.employerRepo.findOne({ where: { id } })) ||
      (await this.freelancerRepo.findOne({ where: { id } })) ||
      (await this.serviceProviderRepo.findOne({ where: { id } })) ||
      (await this.propertyOwnerRepo.findOne({ where: { id } })) ||
      (await this.propertyRenterRepo.findOne({ where: { id } }));

    return user.userType;
  }

  /****************************************************************************************/
  // APPLICATION RELATED METHODS
  /****************************************************************************************/

  // ⁡⁢⁢⁢𝟭) 𝗜𝗡𝗜𝗧𝗜𝗔𝗟 𝗦𝗜𝗚𝗡𝗨𝗣⁡
  async signup(body: any) {
    if (body.userType === 'employer') {
      const hashedPassword = await this.validateAndHash(
        this.employerRepo,
        body,
      );
      // Create the user and save to the database
      const user = this.employerRepo.create({
        userType: body.userType,
        email: body.email ?? null,
        phoneNumber: body.phoneNumber ?? null,
        password: hashedPassword,
      });
      await this.employerRepo.save(user);
      await this.generateAndSendVerificationCode(this.employerRepo, user.id);
      return user.id;
    } else if (body.userType === 'freelancer') {
      const hashedPassword = await this.validateAndHash(
        this.freelancerRepo,
        body,
      );
      // Create the user and save to the database
      const user = this.freelancerRepo.create({
        userType: body.userType,
        email: body.email ?? null,
        phoneNumber: body.phoneNumber ?? null,
        password: hashedPassword,
      });
      await this.freelancerRepo.save(user);
      await this.generateAndSendVerificationCode(this.freelancerRepo, user.id);
      return user.id;
    } else if (body.userType === 'serviceProvider') {
      const hashedPassword = await this.validateAndHash(
        this.serviceProviderRepo,
        body,
      );
      // Create the user and save to the database
      const user = this.serviceProviderRepo.create({
        userType: body.userType,
        email: body.email ?? null,
        phoneNumber: body.phoneNumber ?? null,
        password: hashedPassword,
      });
      await this.serviceProviderRepo.save(user);
      await this.generateAndSendVerificationCode(
        this.serviceProviderRepo,
        user.id,
      );
      return user.id;
    } else if (body.userType === 'propertyOwner') {
      const hashedPassword = await this.validateAndHash(
        this.propertyOwnerRepo,
        body,
      );
      // Create the user and save to the database
      const user = this.propertyOwnerRepo.create({
        userType: body.userType,
        email: body.email ?? null,
        phoneNumber: body.phoneNumber ?? null,
        password: hashedPassword,
      });
      await this.propertyOwnerRepo.save(user);
      await this.generateAndSendVerificationCode(
        this.propertyOwnerRepo,
        user.id,
      );
      return user.id;
    } else if (body.userType === 'propertyRenter') {
      const hashedPassword = await this.validateAndHash(
        this.propertyRenterRepo,
        body,
      );
      // Create the user and save to the database
      const user = this.propertyRenterRepo.create({
        userType: body.userType,
        email: body.email ?? null,
        phoneNumber: body.phoneNumber ?? null,
        password: hashedPassword,
      });
      await this.propertyRenterRepo.save(user);
      await this.generateAndSendVerificationCode(
        this.propertyRenterRepo,
        user.id,
      );
      return user.id;
    } else {
      return false;
    }
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢⁡⁢⁢⁢𝟮) 𝗔𝗖𝗖𝗢𝗨𝗡𝗧 𝗩𝗘𝗥𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡⁡
  // Send 6-digit SMS or email verification code to the user
  async generateAndSendVerificationCode(
    repo: Repository<any>,
    userId: string,
  ): Promise<void> {
    const user = await repo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Employer not found');
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
      throw new BadRequestException('Account is already verified.');
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

  // ⁡⁢⁣⁣⁡⁢⁢⁢𝟯) 𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗜𝗢𝗡 𝗙𝗢𝗥 𝗖𝗨𝗦𝗧𝗢𝗠𝗘𝗥𝗦 𝗔𝗡𝗗 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 𝗣𝗥𝗢𝗩𝗜𝗗𝗘𝗥𝗦⁡
  async completeEmployerProfile(
    repo: Repository<any>,
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Employer not found');
    }

    let profileURL: string | undefined;
    if (profileImg && process.env.NODE_ENV === 'development') {
      profileURL = await this.uploadService.uploadFile(profileImg, 'images');
    } else if (profileImg && process.env.NODE_ENV === 'production') {
      profileURL = await this.uploadService.uploadFileToS3(profileImg);
    }

    // Update the fields
    const updatedUser = repo.update(userId, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      companyName: body.companyName,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
      description: body.description,
    });

    return updatedUser;
  }

  async completeFreelancerProfile(
    repo: Repository<any>,
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Employer not found');
    }

    let profileURL: string | undefined;
    if (profileImg && process.env.NODE_ENV === 'development') {
      profileURL = await this.uploadService.uploadFile(profileImg, 'images');
    } else if (profileImg && process.env.NODE_ENV === 'production') {
      profileURL = await this.uploadService.uploadFileToS3(profileImg);
    }

    // Update the fields
    const updatedUser = repo.update(userId, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      location: body.location,
      profession: body.profession,
      skills: body.skills,
      qualifications: body.qualification,
      portfolioLinks: body.portfolioLinks,
      portfolioFiles: body.portfolioFiles,
      description: body.description,
      experience: body.experience,
      availability: body.availability,
      languages: body.languages,
      hourlyRate: body.hourlyRate,
    });

    return updatedUser;
  }

  // ⁡⁢⁣⁣⁡⁢⁢⁢𝟰) 𝗥𝗘𝗩𝗜𝗘𝗪 𝗔𝗡𝗗 𝗦𝗨𝗕𝗠𝗜𝗧⁡

  // ⁡⁢⁣⁣⁡⁢⁢⁢𝟱) 𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡⁡

  // ⁡⁢⁣⁣⁡⁢⁣⁣⁡⁢⁢⁢𝟲) 𝗚𝗜𝗩𝗘 𝗔𝗖𝗖𝗘𝗦𝗦 𝗧𝗢 𝗧𝗛𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗⁡
}
