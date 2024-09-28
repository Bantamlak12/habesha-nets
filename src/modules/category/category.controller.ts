import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
  Response,
  HttpStatus,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Category Endpoints
  @Get()
  async findAll(@Response() res: ExpressResponse) {
    const categories = await this.categoryService.findAll();

    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: categories.length,
      statusCode: 200,
      data: categories,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Response() res: ExpressResponse) {
    const category = await this.categoryService.findOne(id);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      data: category,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Response() res: ExpressResponse,
  ) {
    await this.categoryService.create(createCategoryDto);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Category created successfully',
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Response() res: ExpressResponse,
  ) {
    const affectedRow = await this.categoryService.update(
      id,
      updateCategoryDto,
    );

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      affectedRow,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Response() res: ExpressResponse) {
    const deletedCategory = await this.categoryService.remove(id);

    return res.status(HttpStatus.NO_CONTENT).json({
      status: 'success',
      statusCode: 204,
      data: deletedCategory,
    });
  }

  // Service Endpoints (Under Categories)
  @Get(':name/services')
  async findAllServices(
    @Param('name') name: string,
    @Response() res: ExpressResponse,
  ) {
    const services = await this.categoryService.findAllService(name);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      results: services.length,
      statusCode: 200,
      data: services,
    });
  }

  @Get(':name/services/:serviceId')
  async findOneService(
    @Param('categoryId') name: string,
    @Param('serviceId') serviceId: string,
    @Response() res: ExpressResponse,
  ) {
    const service = await this.categoryService.findOneService(serviceId);

    return res.status(HttpStatus.OK).json({
      status: 'success',
      statusCode: 200,
      data: service,
    });
  }

  @Post(':name/services')
  @UseGuards(JwtAuthGuard)
  async createService(
    @Param('name') name: string,
    @Body() createServiceDto: CreateServiceDto,
    @Response() res: ExpressResponse,
  ) {
    await this.categoryService.createService(name, createServiceDto);

    return res.status(HttpStatus.CREATED).json({
      status: 'success',
      statusCode: 201,
      message: 'Service created successfully',
    });
  }

  @Patch(':categoryId/services/:serviceId')
  @UseGuards(JwtAuthGuard)
  async updateService(
    @Param('categoryId') categoryId: string,
    @Param('serviceId') serviceId: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.categoryService.updateService(serviceId, updateServiceDto);
  }

  @Delete(':categoryId/services/:serviceId')
  async removeService(
    @Param('categoryId') categoryId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.categoryService.removeService(serviceId);
  }
}
