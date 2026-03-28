import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialty } from './entities/specialty.entity';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(Specialty)
    private readonly repo: Repository<Specialty>,
  ) {}

  async findAll(): Promise<Specialty[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Specialty> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Specialty not found');
    return item;
  }

  async create(name: string): Promise<Specialty> {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const entity = this.repo.create({ name, slug });
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
