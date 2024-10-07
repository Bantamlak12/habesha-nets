import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Request,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { UpdateEmployerProfile } from '../auth/dto/update-employer-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  // COMPLETE EMPLOYER PROFILE
  @Patch('/employer/profile')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @UseGuards(JwtAuthGuard)
  async completeEmployerProfile(
    @Body() body: UpdateEmployerProfile,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /\/(jpeg|png|jpg)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const id = req.user['sub'];
    const userType = req.user['userType'];

    if (userType !== 'employer') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only update their profile. You cannot update any users profile.`,
      );
    }

    const user = await this.userService.updateEmployerProfile(id, body, file);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'You have updated your profile',
      rowAffected: user.affected,
    });
  }
}
