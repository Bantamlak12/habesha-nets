import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
// import { AuthService } from '../auth/auth.service';

@Module({
  // imports: [forwardRef(() => AuthService)],
  providers: [UsersService],
})
export class UsersModule {}
