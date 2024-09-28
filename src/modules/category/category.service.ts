import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../category/dto/category.dto';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  // Category operations

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({ relations: ['services'] });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['services'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<number> {
    const category = await this.categoryRepository.update(id, {
      ...updateCategoryDto,
    });

    return category.affected;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  // Service operations

  async findAllService(name: string): Promise<Service[]> {
    const id = await this.categoryRepository.findOne({ where: { name } });

    return await this.serviceRepository.find({
      where: { category: id },
      relations: ['category'],
    });
  }

  async findOneService(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async createService(
    name: string,
    createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    const category = await this.categoryRepository.findOne({
      where: { name: name },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${name} not found`);
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      category,
    });
    return await this.serviceRepository.save(service);
  }

  async updateService(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Only update fields present in updateServiceDto.  Avoid overwriting existing data.
    Object.assign(service, updateServiceDto);

    // Handle category update separately.  Only update if categoryId is provided.
    if (updateServiceDto.categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id: updateServiceDto.categoryId,
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateServiceDto.categoryId} not found`,
        );
      }
      service.category = category;
    }

    return this.serviceRepository.save(service);
  }

  async removeService(id: string): Promise<void> {
    const service = await this.findOneService(id);
    await this.serviceRepository.remove(service);
  }
}
