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
import { CreatePostDto } from './dto/create-job-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostService } from './post.service';
import { UpdateJobPostDto } from './dto/update-job-post.dto';
import { CreatePropertyOwnersDto } from './dto/create-rental-post.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateRentalPostDto } from './dto/update-rental-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // JOB POST
  @Get('job-lists')
  async getAllPosts(
    @Response() res: ExpressResponse,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category: string,
  ) {
    const posts = await this.postService.getAllJobLists(page, limit, category);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: posts.posts.length,
      statusCode: 200,
      totalPages: posts.totalPages,
      data: posts.posts,
    });
  }

  @Post('job-post')
  @UseGuards(JwtAuthGuard)
  async EmployerCreateJobPost(
    @Body() body: CreatePostDto,
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
  ) {
    const userId = req.user['sub'];
    const post = await this.postService.getAllJobPost(userId, page, limit);

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
    @Body() body: UpdateJobPostDto,
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
  async EmployerdeletePost(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const affectedRow = await this.postService.deleteJobPost(id);

    return res.status(HttpStatus.NO_CONTENT).json({
      status: 'success',
      statusCode: 204,
      affectedRow,
    });
  }

  // RENTAL POSTS
  @Get('rental-lists')
  async getAllRentalLists(
    @Response() res: ExpressResponse,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category: string,
  ) {
    const posts = await this.postService.getAllRentalLists(
      page,
      limit,
      category,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      Results: posts.posts.length,
      statusCode: 200,
      totalPages: posts.totalPages,
      data: posts.posts,
    });
  }

  @Post('rental-post')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }]))
  async PropertyOwnerCreateJobPost(
    @Body() body: CreatePropertyOwnersDto,
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @UploadedFiles()
    files?: {
      images?: Express.Multer.File[];
    },
  ) {
    const images = files?.images || [];

    let totalSize: number = 0;
    let imageCount: number = 0;

    images.forEach((file) => {
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
    await this.postService.createPropertyOwnersPost(id, body, images);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Post created successfully',
    });
  }

  @Get('rental-post/:id')
  @UseGuards(JwtAuthGuard)
  async getRentalPost(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const post = await this.postService.getRentalPost(id);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      post,
    });
  }

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

  @Patch('rental-post/:id')
  @UseGuards(JwtAuthGuard)
  async rentalUpdatePost(
    @Param('id') id: string,
    @Body() body: UpdateRentalPostDto,
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
