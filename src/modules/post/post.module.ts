import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPost } from './entities/job-post.entity';
import { AuthModule } from '../auth/auth.module';
import { RentalPost, RentalPostImage } from './entities/rental-post.entity';
import { UploadService } from 'src/shared/upload/upload.service';
import { User } from '../users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPost, RentalPost, RentalPostImage, User]),
    AuthModule,
  ],
  controllers: [PostController],
  providers: [PostService, UploadService],
})
export class PostModule {}
