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
  Query,
  Request,
  Response,
  UnauthorizedException,
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
import { UpdatePropertyRenterDto } from '../auth/dto/update-property-renter.dto';
import { UpdateBabySitterFinderDto } from '../auth/dto/update-baby-sitter-finder-profile.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Get('service-providers')
  @UseGuards(JwtAuthGuard)
  async findAllServiceProviders(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userType = req.user?.['userType'];
    let users: any;

    if (userType === 'employer') {
      users = await this.userService.findAllserviceProviders(page, limit);
    }

    if (!users) {
      throw new UnauthorizedException(
        'You are not authorized to access this route.',
      );
    }

    if (users) {
      users.employees.map((user: any) => delete user.password);
    }

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: users.employees.length,
      statusCode: 200,
      totalPages: users.totalPages,
      data: users.employees,
    });
  }

  @Get('renters')
  @UseGuards(JwtAuthGuard)
  async findAllPropertyRenters(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userType = req.user?.['userType'];
    let users: any;

    if (userType === 'propertyOwner') {
      users = await this.userService.findAllPropertyRenters(page, limit);
    }

    if (!users) {
      throw new UnauthorizedException(
        'You are not authorized to access this route.',
      );
    }

    if (users) {
      users.renters.map((user: any) => delete user.password);
    }

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: users.renters.length,
      statusCode: 200,
      totalPages: users.totalPages,
      data: users.renters,
    });
  }

  @Get('baby-sitters')
  @UseGuards(JwtAuthGuard)
  async findAllBabySitters(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userType = req.user?.['userType'];
    let users: any;

    if (userType === 'babySitterFinder') {
      users = await this.userService.findAllBabySitters(page, limit);
    }

    if (!users) {
      throw new UnauthorizedException(
        'You are not authorized to access this route.',
      );
    }

    if (users) {
      users.babysitters.map((user: any) => delete user.password);
    }

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: users.babysitters.length,
      statusCode: 200,
      totalPages: users.totalPages,
      data: users.babysitters,
    });
  }

  @Get('care-givers')
  @UseGuards(JwtAuthGuard)
  async findAllCareGivers(
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userType = req.user?.['userType'];
    let users: any;

    if (userType === 'careGiverFinder') {
      users = await this.userService.findAllCareGivers(page, limit);
    }

    if (!users) {
      throw new UnauthorizedException(
        'You are not authorized to access this route.',
      );
    }

    if (users) {
      users.caregivers.map((user: any) => delete user.password);
    }

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: users.caregivers.length,
      statusCode: 200,
      totalPages: users.totalPages,
      data: users.caregivers,
    });
  }

  // COMPLETE EMPLOYER PROFILE
  @Patch('/employer/profile')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @UseGuards(JwtAuthGuard)
  async updateEmployerProfile(
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
  async updateServiceProvidersProfile(
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
  async updatePropertyOwnersProfile(
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

  @Patch('/property-renters/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  async updatePropertyRenterProfile(
    @Body() body: UpdatePropertyRenterDto,
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
    if (userType !== 'propertyRenter') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }
    const user = await this.userService.updatePropertyRenterProfile(
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

  @Patch('/baby-sitter-finder/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  async updateBabySitterFinderProfile(
    @Body() body: UpdateBabySitterFinderDto,
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
    if (userType !== 'babySitterFinder') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }

    const user = await this.userService.updateBabySitterFinderProfile(
      id,
      body,
      profilePicture,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      message: 'You have completed your profile',
      rowAffected: user.affected,
    });
  }

  @Patch('/care-giver-finder/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }]),
  )
  async completeCareGiverFinderProfile(
    @Body() body: UpdateBabySitterFinderDto,
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
    if (userType !== 'careGiverFinder') {
      throw new BadRequestException(
        `'${req.user['userType']}' can only complete their profile. You cannot edit any users profile.`,
      );
    }

    const user = await this.userService.updateCareGiverFinderProfile(
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
