import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Category Endpoints
  @Get()
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  // Service Endpoints (Under Categories)
  @Get(':categoryId/services')
  async findAllServices(@Param('categoryId') categoryId: string) {
    const category = await this.categoryService.findOne(categoryId);
    return category.services;
  }

  @Get(':categoryId/services/:serviceId')
  async findOneService(
    @Param('categoryId') categoryId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.categoryService.findOneService(serviceId);
  }

  @Post(':categoryId/services')
  @UseGuards(JwtAuthGuard)
  async createService(
    @Param('categoryId') categoryId: string,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.categoryService.createService(categoryId, createServiceDto);
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
