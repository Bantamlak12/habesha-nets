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

  async findAllEmploy(ID: string): Promise<User[]> {
    try {
      const employer = await this.userRepo.findOneBy({ id: ID });

      if (employer.userType === 'service provider') {
        const employersList = await this.userRepo.findBy({
          userType: 'employer',
        });

        return employersList;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      throw error;
    }
  }

  async findAllOwner(ID: string): Promise<User[]> {
    try {
      const owner = await this.userRepo.findOneBy({ id: ID });

      if (owner.userType === 'service provider') {
        const ownerList = await this.userRepo.findBy({
          serviceCategory: 'Rentals',
        });

        return ownerList;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      throw error;
    }
  }

  async findAllBabySitter(ID: string): Promise<User[]> {
    try {
      const babysitter = await this.userRepo.findOneBy({ id: ID });

      if (babysitter.userType === 'service provider') {
        const babysitterList = await this.userRepo.findBy({
          serviceTitle: In(['Babysitter', 'Nanny', 'Date night babysitter']),
        });

        return babysitterList;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      throw error;
    }
  }

  async findAllCareGiver(ID: string): Promise<User[]> {
    try {
      const babysitter = await this.userRepo.findOneBy({ id: ID });

      if (babysitter.userType === 'service provider') {
        const babysitterList = await this.userRepo.findBy({
          serviceTitle: In([
            'Eldercare',
            'Dog walker',
            'Special needs caregiver',
          ]),
        });

        return babysitterList;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      throw error;
    }
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
}
