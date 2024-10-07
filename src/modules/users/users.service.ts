import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadService } from 'src/shared/upload/upload.service';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import { capitalizeString } from 'src/shared/utils/capitilize-string.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly uploadService: UploadService,
  ) {}

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
