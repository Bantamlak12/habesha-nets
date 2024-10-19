import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { JobPost } from './entities/job-post.entity';
import { UploadService } from 'src/shared/upload/upload.service';
import { RentalPost, RentalPostImage } from './entities/rental-post.entity';
import { User } from '../users/entities/users.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(JobPost)
    private readonly jobPostRepo: Repository<JobPost>,
    @InjectRepository(RentalPost)
    private readonly rentalPostRepo: Repository<RentalPost>,
    @InjectRepository(RentalPostImage)
    private readonly rentalPostImageRepo: Repository<RentalPostImage>,
    private readonly uploadService: UploadService,
  ) {}

  @Cron('0 0 1 * *') // Runs at midnight on 1st of every month
  async cleanupExpiredResetTokens(): Promise<void> {
    await this.jobPostRepo.delete({ status: 'closed' });
    await this.rentalPostRepo.delete({ postStatus: 'rented' });
  }

  async EmployerCreatePost(id: string, body: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPost = this.jobPostRepo.create({
      title: body.title,
      category: body.category,
      description: body.description,
      country: body.location.country,
      city: body.location.city,
      street: body.location.street,
      postalCode: body.location.postalCode,
      remote: body.remote,
      hourlyRate: body.hourlyRate,
      startTime: body.schedule.start,
      endTime: body.schedule.end,
      preferredHours: body.schedule.preferredHours,
      phoneNumber: body.contactInfo.phoneNumber,
      email: body.contactInfo.email,
      postedBy: user,
    });

    await this.jobPostRepo.save(newPost);
  }

  async getPost(id: string) {
    const post = this.jobPostRepo
      .createQueryBuilder('JobPost')
      .leftJoin('JobPost.postedBy', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .where('JobPost.id = :id', { id })
      .getOne();
    return post;
  }

  async getAllJobPost(userId: string, page: number, limit: number) {
    const query = this.jobPostRepo
      .createQueryBuilder('JobPost')
      .leftJoin('JobPost.postedBy', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .where('user.id = :userId', { userId })
      .orderBy('JobPost.createdAt', 'DESC');

    const [posts, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    return { posts, totalPages };
  }

  async getAllRentalPost(userId: string, page: number, limit: number) {
    const [posts, total] = await this.rentalPostRepo
      .createQueryBuilder('JobPost')
      .leftJoin('JobPost.postedBy', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .where('user.id = :userId', { userId })
      .orderBy('JobPost.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    return { posts, totalPages };
  }

  async getAllRentalLists(page: number, limit: number, category: string) {
    const query = this.rentalPostRepo
      .createQueryBuilder('RentalPost')
      .leftJoin('RentalPost.postedBy', 'user')
      .leftJoinAndSelect('RentalPost.images', 'images')
      .addSelect(['user.firstName', 'user.lastName'])
      .orderBy('RentalPost.createdAt', 'DESC');

    if (category) {
      query.andWhere('RentalPost.rentalType = :category', { category });
    }

    const [posts, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    return { posts, totalPages };
  }

  async getAllJobLists(page: number, limit: number, category: string) {
    const query = this.jobPostRepo
      .createQueryBuilder('JobPost')
      .leftJoin('JobPost.postedBy', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .orderBy('JobPost.createdAt', 'DESC');

    if (category) {
      query.andWhere('JobPost.category = :category', { category });
    }

    const [posts, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    return { posts, totalPages };
  }

  async employerUpdatePost(body: any, id: string) {
    const updatedPost = await this.jobPostRepo.update(id, {
      title: body.title,
      category: body.category,
      description: body.description,
      country: body.location.country,
      city: body.location.city,
      street: body.location.street,
      postalCode: body.location.postalCode,
      remote: body.remote,
      hourlyRate: body.hourlyRate,
      startTime: body.schedule.start,
      endTime: body.schedule.end,
      preferredHours: body.schedule.preferredHours,
      phoneNumber: body.contactInfo.phoneNumber,
      email: body.contactInfo.email,
      status: body.status,
    });

    return updatedPost.affected;
  }

  async deleteJobPost(id: string) {
    const result = await this.jobPostRepo.delete(id);
    return result.affected;
  }

  async createPropertyOwnersPost(
    id: string,
    body: any,
    images: Express.Multer.File[],
  ) {
    let imageUrl: string[] = [];

    if (images && process.env.NODE_ENV === 'development') {
      imageUrl = await Promise.all(
        images.map(async (file) => {
          return await this.uploadService.uploadFile(file, 'property-images');
        }),
      );
    } else if (images && process.env.NODE_ENV === 'production') {
      imageUrl = await Promise.all(
        images.map(async (file) => {
          return await this.uploadService.uploadFile(file, 'property-images');
        }),
      );
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPost = this.rentalPostRepo.create({
      title: body.title,
      rentalType: body.rentalType,
      description: body.description,
      price: body.price,
      country: body.location.country,
      city: body.location.city,
      street: body.location.street,
      postalCode: body.location.postalCode,
      images: imageUrl.map((url) =>
        this.rentalPostImageRepo.create({ imageUrl: url }),
      ),
      availableFrom: body.availabilityDate.from,
      availableUntil: body.availabilityDate.until,
      phoneNumber: body.contactInfo.phoneNumber,
      email: body.contactInfo.email,
      postStatus: body.postStatus,
      postedBy: user,
    });
    await this.rentalPostRepo.save(newPost);
  }

  async getRentalPost(id: string) {
    const post = this.rentalPostRepo
      .createQueryBuilder('JobPost')
      .leftJoin('JobPost.postedBy', 'user')
      .addSelect(['user.firstName', 'user.lastName'])
      .where('JobPost.id = :id', { id })
      .getOne();
    return post;
  }

  async rentalUpdate(id: string, body: any) {
    const updatedPost = await this.rentalPostRepo.update(id, {
      title: body.title,
      rentalType: body.rentalType,
      description: body.description,
      price: body.price,
      country: body.location.country,
      city: body.location.city,
      street: body.location.street,
      postalCode: body.location.postalCode,
      availableFrom: body.availabilityDate.from,
      availableUntil: body.availabilityDate.until,
      phoneNumber: body.contactInfo.phoneNumber,
      email: body.contactInfo.email,
      postStatus: body.postStatus,
    });
    return updatedPost.affected;
  }

  async deleteRentalPost(id: string) {
    const result = await this.rentalPostRepo.delete(id);
    return result.affected;
  }
}
