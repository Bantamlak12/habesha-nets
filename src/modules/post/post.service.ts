import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPost } from './entities/employer-post.entity';
import { UploadService } from 'src/shared/upload/upload.service';
import { RentalPost } from './entities/rental-post.entity';
import { User } from '../users/entities/users.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(JobPost)
    private readonly jobPostRepo: Repository<JobPost>,
    @InjectRepository(RentalPost)
    private readonly rentalPostRepo: Repository<RentalPost>,
    private readonly uploadService: UploadService,
  ) {}

  async EmployerCreatePost(id: string, body: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPost = this.jobPostRepo.create({
      ...body,
      postedBy: user,
    });

    await this.jobPostRepo.save(newPost);
  }

  async getPost(id: string) {
    const post = await this.jobPostRepo.findOne({ where: { id } });
    return post;
  }

  async getAllJobPost() {
    const posts = await this.jobPostRepo.find({});
    return posts;
  }

  async getAllRentalPost() {
    const posts = await this.rentalPostRepo.find({});
    return posts;
  }

  async employerUpdatePost(body: any, id: string) {
    const updatedPost = await this.jobPostRepo.update(id, {
      title: body.title,
      description: body.description,
      jobType: body.jobType,
      companyName: body.companyName,
      location: body.location,
      salary: body.salary,
      requiredSkills: body.requiredSkills,
      experienceLevel: body.experienceLevel,
      category: body.category,
      applicationDeadline: body.applicationDeadline,
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
      ...body,
      images: imageUrl,
      postedBy: user,
    });
    await this.rentalPostRepo.save(newPost);
  }

  async rentalUpdate(id: string, body: any) {
    const updatedPost = await this.jobPostRepo.update(id, { ...body });
    return updatedPost.affected;
  }

  async deleteRentalPost(id: string) {
    const result = await this.rentalPostRepo.delete(id);
    return result.affected;
  }
}
