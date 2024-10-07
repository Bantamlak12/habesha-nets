import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Request,
  Response,
  UploadedFile,
  UploadedFiles,
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
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { updateServiceProvidersDto } from '../auth/dto/update-service-provider-profile.dto';
import { UpdatePropertyOwnerDto } from '../auth/dto/update-property-owner-profile.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Get('employee')
  @UseGuards(JwtAuthGuard)
  async findAllEmploy(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
  ) {
    const ID = req.user?.['id'];
    const Employeeys = await this.userService.findAllEmploy(ID);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: Employeeys.length,
      statusCode: 200,
      data: Employeeys,
    });
  }
  //Get Owner

  @Get('renter')
  @UseGuards(JwtAuthGuard)
  async findAllOwner(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
  ) {
    const ID = req.user?.['id'];
    const Owner = await this.userService.findAllOwner(ID);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: Owner.length,
      statusCode: 200,
      data: Owner,
    });
  }

  //Get Baby Sitter

  @Get('babysitter')
  @UseGuards(JwtAuthGuard)
  async findAllBabySitter(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
  ) {
    const ID = req.user?.['id'];
    const BabySitter = await this.userService.findAllBabySitter(ID);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: BabySitter.length,
      statusCode: 200,
      data: BabySitter,
    });
  }

  //Get Care Giver

  @Get('caregiver')
  @UseGuards(JwtAuthGuard)
  async findAllCareGiver(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
  ) {
    const ID = req.user?.['id'];
    const BabySitter = await this.userService.findAllCareGiver(ID);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: BabySitter.length,
      statusCode: 200,
      data: BabySitter,
    });
  }

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

  @Patch('/service-providers/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'portfolioFiles', maxCount: 5 },
    ]),
  )
  async completeServiceProvidersProfile(
    @Body() body: updateServiceProvidersDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File;
      portfolioFiles?: Express.Multer.File[];
    },
  ) {
    const profilePicture = files?.profilePicture?.[0];
    const portfolioFiles = files?.portfolioFiles || [];

    // Check if profile picture did not exceed 2MB
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'The size of the profile picture must not exceed 2MB.',
      );
    }

    // Check if the uploaded file is image
    if (profilePicture && !profilePicture.mimetype.match(/\/(jpeg|png|jpg)$/)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and JPG formats are allowed for profile picture.',
      );
    }

    // Check the portfolio files size. It's should not exceed 10MB in total
    let totalSize: number = 0;
    let imageCount: number = 0;
    let pdfCount: number = 0;

    portfolioFiles.forEach((file) => {
      totalSize += file.size;
      if (file.mimetype.startsWith('image/')) {
        imageCount++;
      } else if (file.mimetype.startsWith('application/pdf')) {
        pdfCount++;
      } else {
        throw new BadRequestException(
          'Only images or PDF file is allowed to upload.',
        );
      }
    });

    if (imageCount > 5) {
      throw new BadRequestException(
        'You can upload a maximum of 5 images for portfolio files.',
      );
    }

    if (pdfCount > 1) {
      throw new BadRequestException(
        'You can upload only one PDF file for portfolio files.',
      );
    }

    if (totalSize > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Total size of portfolio files should not exceed 10MB.',
      );
    }

    const id = req.user['sub'];
    const userType = req.user['userType'];
    if (userType !== 'serviceProvider') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }
    const user = await this.userService.updateServiceProvidersProfile(
      id,
      body,
      profilePicture,
      portfolioFiles,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'You have updated your profile',
      rowAffected: user.affected,
    });
  }

  @Patch('/property-owners/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  async completePropertyOwnersProfile(
    @Body() body: UpdatePropertyOwnerDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File;
    },
  ) {
    const profilePicture = files?.profilePicture?.[0];

    // Check if profile picture did not exceed 2MB
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'The size of the profile picture must not exceed 2MB.',
      );
    }

    // Check if the uploaded file is image
    if (profilePicture && !profilePicture.mimetype.match(/\/(jpeg|png|jpg)$/)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and JPG formats are allowed for profile picture.',
      );
    }

    const id = req.user['sub'];
    const userType = req.user['userType'];

    if (userType !== 'propertyOwner') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }

    const user = await this.userService.updatePropertyOwnersProfile(
      id,
      body,
      profilePicture,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'You have updated your profile',
      rowAffected: user.affected,
    });
  }
}
