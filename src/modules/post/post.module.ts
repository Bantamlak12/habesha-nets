import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPost } from './entities/employer-post.entity';
import { AuthModule } from '../auth/auth.module';
import { RentalPost } from './entities/rental-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobPost, RentalPost]), AuthModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
