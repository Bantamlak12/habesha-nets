import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPost } from './entities/create-post.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(JobPost)
    private readonly jobPostRepo: Repository<JobPost>,
  ) {}

  async createPost(body: any) {
    const newPost = await this.jobPostRepo.create({
      title: body.title,
      description: body.description,
      jobType: body.jobType,
      companyName: body.companyName,
      location: body.location,
      salary: body.salary,
    });
  }
}
