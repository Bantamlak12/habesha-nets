import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPost } from './entities/create-post.entity';
import { Controller } from './.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobPost])],
  providers: [UsersService],
  controllers: [Controller],
})
export class UsersModule {}
