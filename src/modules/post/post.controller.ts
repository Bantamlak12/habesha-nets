import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Response,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { EmployeeCreatePostDto } from './dto/create-job-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostService } from './post.service';
import { EmployeeUpdatePostDto } from './dto/update-job-post.dto';
import { CreatePropertyOwnersDto } from './dto/create-rental-post.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdatePropertyOwnersDto } from './dto/update-rental-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('job-post')
  @UseGuards(JwtAuthGuard)
  async EmployerCreateJobPost(
    @Body() body: EmployeeCreatePostDto,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const id = req.user['sub'];
    await this.postService.EmployerCreatePost(id, body);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Post created successfully',
    });
  }

  @Get('job-post/:id')
  @UseGuards(JwtAuthGuard)
  async EmployerGetPost(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const post = await this.postService.getPost(id);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      data: post,
    });
  }

  @Get('job-post')
  @UseGuards(JwtAuthGuard)
  async EmployerGetAllPost(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
  ) {
    const userId = req.user['sub'];
    const post = await this.postService.getAllJobPost(
      userId,
      page,
      limit,
      category,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: post.posts.length,
      statusCode: 200,
      totalPages: post.totalPages,
      data: post.posts,
    });
  }

  @Patch('job-post/:id')
  @UseGuards(JwtAuthGuard)
  async EmployerUpdatePost(
    @Param('id') id: string,
    @Body() body: EmployeeUpdatePostDto,
    @Response() res: ExpressResponse,
  ) {
    const affectedRow = await this.postService.employerUpdatePost(body, id);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      affectedRow,
    });
  }

  @Delete('job-post/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') id: string, @Response() res: ExpressResponse) {
    const affectedRow = await this.postService.deleteJobPost(id);

    return res.status(HttpStatus.NO_CONTENT).json({
      status: 'success',
      statusCode: 204,
      affectedRow,
    });
  }

  @Post('rental-post')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'propertyImages', maxCount: 5 }]),
  )
  async PropertyOwnerCreateJobPost(
    @Body() body: CreatePropertyOwnersDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      propertyImages?: Express.Multer.File[];
    },
  ) {
    const propertyImages = files?.propertyImages || [];

    let totalSize: number = 0;
    let imageCount: number = 0;

    propertyImages.forEach((file) => {
      totalSize += file.size;
      if (file.mimetype.startsWith('image/')) {
        imageCount++;
      } else {
        throw new BadRequestException('Only images are allowed to upload.');
      }
    });

    if (imageCount > 5) {
      throw new BadRequestException('You can upload a maximum of 5 images.');
    }

    if (totalSize > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Total size of the images cannot exceed 10MB.',
      );
    }

    const id = req.user['sub'];
    await this.postService.createPropertyOwnersPost(id, body, propertyImages);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Post created successfully',
    });
  }

  @Get('rental-post/:id')
  @UseGuards(JwtAuthGuard)
  async rentalGetPost(@Response() res: ExpressResponse) {}

  @Get('rental-posts')
  @UseGuards(JwtAuthGuard)
  async rentalGetAllPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const userId = req.user['sub'];
    const post = await this.postService.getAllRentalPost(userId, page, limit);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: post.posts.length,
      statusCode: 200,
      totalPages: post.totalPages,
      data: post.posts,
    });
  }

  @Get('rental-post/:id')
  @UseGuards(JwtAuthGuard)
  async rentalUpdatePost(
    @Param('id') id: string,
    @Body() body: UpdatePropertyOwnersDto,
    @Response() res: ExpressResponse,
  ) {
    const affectedRow = await this.postService.rentalUpdate(id, body);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      affectedRow,
    });
  }

  @Delete('rental-post/:id')
  @UseGuards(JwtAuthGuard)
  async rentalDeletePost(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const affectedRow = await this.postService.deleteRentalPost(id);

    return res.status(HttpStatus.NO_CONTENT).json({
      status: 'success',
      statusCode: 204,
      affectedRow,
    });
  }
}
