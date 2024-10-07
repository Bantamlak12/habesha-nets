import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { UploadModule } from 'src/shared/upload/upload.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Category } from '../category/entities/category.entity';
import { Service } from '../category/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Service, User]),
    AuthModule,
    UploadModule,
  ],
  providers: [UsersService],
  controllers: [UserController],
})
export class UsersModule {}
