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
  }
  