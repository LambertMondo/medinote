import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospital } from './entities/hospital.entity';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(Hospital)
    private readonly repo: Repository<Hospital>,
  ) {}

  async findAll(city?: string): Promise<Hospital[]> {
    const qb = this.repo.createQueryBuilder('h');
    if (city) qb.where('LOWER(h.city) = LOWER(:city)', { city });
    qb.orderBy('h.name', 'ASC');
    return qb.getMany();
  }

  async findById(id: string): Promise<Hospital> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Hospital not found');
    return item;
  }

  async create(data: Partial<Hospital>): Promise<Hospital> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Hospital>): Promise<Hospital> {
    await this.findById(id);
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
