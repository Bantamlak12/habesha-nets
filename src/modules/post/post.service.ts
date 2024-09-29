import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPost } from './entities/employer-post.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(JobPost)
    private readonly jobPostRepo: Repository<JobPost>,
  ) {}

  async EmployerCreatePost(body: any) {
    const newPost = this.jobPostRepo.create({
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

    await this.jobPostRepo.save(newPost);
  }

  async getPost(id: string) {
    const post = await this.jobPostRepo.findOne({ where: { id } });
    return post;
  }

  async getAllPost() {
    const posts = await this.jobPostRepo.find({});
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

  async deletePost(id: string) {
    const result = await this.jobPostRepo.delete(id);
    return result.affected;
  }
}
