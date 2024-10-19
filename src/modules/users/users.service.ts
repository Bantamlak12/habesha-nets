import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadService } from 'src/shared/upload/upload.service';
import { User } from './entities/users.entity';
import { In, Repository } from 'typeorm';
import { capitalizeString } from 'src/shared/utils/capitilize-string.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly uploadService: UploadService,
  ) {}

  async findAllserviceProviders(page: number, limit: number) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.userType = :userType', {
        userType: 'serviceProvider',
      })
      .orderBy('user.createdAt', 'DESC');

    const [employees, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return { employees, totalPages };
  }

  async findAllPropertyRenters(page: number, limit: number) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.serviceCategory = :serviceCategory', {
        serviceCategory: 'Rentals',
      })
      .orderBy('user.createdAt', 'DESC');

    const [renters, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return { renters, totalPages };
  }

  async findAllBabySitters(page: number, limit: number) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.serviceTitle IN (:...serviceTitle)', {
        serviceTitle: ['Babysitter', 'Nanny', 'Date Night Babysitter'],
      })
      .orderBy('user.createdAt', 'DESC');

    const [babysitters, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return { babysitters, totalPages };
  }

  async findAllCareGivers(page: number, limit: number) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.serviceTitle IN (:...serviceTitle)', {
        serviceTitle: ['Eldercare', 'Dog Walker', 'Special Needs Caregiver'],
      })
      .orderBy('user.createdAt', 'DESC');

    const [caregivers, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return { caregivers, totalPages };
  }

  async updateEmployerProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
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
      secondaryEmail: user.secondaryEmail,
      secondaryPhoneNumber: user.secondaryPhoneNumber,
      companyName: body.companyName,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      address: body.address,
      bio: body.bio,
    });

    return updatedUser;
  }

  async updateServiceProvidersProfile(
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
      secondaryEmail: user.secondaryEmail,
      secondaryPhoneNumber: user.secondaryPhoneNumber,
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

  async updatePropertyOwnersProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
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
      secondaryEmail: user.secondaryEmail,
      secondaryPhoneNumber: user.secondaryPhoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      address: body.address,
      propertyType: body.propertyType,
    });

    return updatedUser;
  }

  async updatePropertyRenterProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
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
      secondaryEmail: user.secondaryEmail,
      secondaryPhoneNumber: user.secondaryPhoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      address: body.address,
      budgetRange: body.budgetRange,
    });

    return updatedUser;
  }

  async updateBabySitterFinderProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
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
      secondaryEmail: user.secondaryEmail,
      secondaryPhoneNumber: user.secondaryPhoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      address: body.address,
    });

    return updatedUser;
  }

  async updateCareGiverFinderProfile(
    userId: string,
    body: any,
    profileImg: Express.Multer.File,
  ) {
    // Check if the user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
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
      secondaryEmail: user.secondaryEmail,
      secondaryPhoneNumber: user.secondaryPhoneNumber,
      bio: body.bio,
      profilePicture: profileURL,
      preferredContactMethod: body.preferredContactMethod,
      address: body.address,
    });

    return updatedUser;
  }
}
