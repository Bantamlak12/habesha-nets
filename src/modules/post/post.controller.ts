import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { CreatePost } from './dto/create-job-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostService } from './post.service';
import { UpdatePost } from './dto/update-job-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('post')
  @UseGuards(JwtAuthGuard)
  async EmployerCreateJobPost(
    @Body() body: CreatePost,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    await this.postService.EmployerCreatePost(body);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Post created successfully',
    });
  }

  @Get('post/:id')
  @UseGuards(JwtAuthGuard)
  async EmployerGetPost(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const post = await this.postService.getPost(id);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      data: post,
    });
  }

  @Get('post')
  @UseGuards(JwtAuthGuard)
  async EmployerGetAllPost(@Response() res: ExpressResponse) {
    const post = await this.postService.getAllPost();

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      Results: post.length,
      statusCode: 201,
      data: post,
    });
  }

  @Patch('post/:id')
  @UseGuards(JwtAuthGuard)
  async EmployerUpdatePost(
    @Param('id') id: string,
    @Body() body: UpdatePost,
    @Response() res: ExpressResponse,
  ) {
    const affectedRow = await this.postService.employerUpdatePost(body, id);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      affectedRow,
    });
  }

  @Delete('post/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') id: string, @Response() res: ExpressResponse) {
    const affectedRow = await this.postService.deletePost(id);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      affectedRow,
    });
  }
}
