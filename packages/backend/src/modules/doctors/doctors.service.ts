import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';

export interface DoctorFilters {
  specialtyId?: string;
  hospitalId?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly repo: Repository<Doctor>,
  ) {}

  async findAll(filters: DoctorFilters) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);

    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.user', 'u')
      .leftJoinAndSelect('d.specialty', 's')
      .leftJoinAndSelect('d.hospital', 'h')
      .where('d.isActive = :active', { active: true });

    if (filters.specialtyId) {
      qb.andWhere('d.specialtyId = :sid', { sid: filters.specialtyId });
    }

    if (filters.hospitalId) {
      qb.andWhere('d.hospitalId = :hid', { hid: filters.hospitalId });
    }

    if (filters.city) {
      qb.andWhere('LOWER(h.city) = LOWER(:city)', { city: filters.city });
    }

    if (filters.search) {
      qb.andWhere(
        '(LOWER(u.firstName) LIKE :search OR LOWER(u.lastName) LIKE :search OR LOWER(s.name) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('u.lastName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Strip sensitive fields
    const data = items.map((doc) => {
      const { passwordHash, totpSecret, ...userData } = doc.user || ({} as any);
      return { ...doc, user: userData };
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<Doctor> {
    const doc = await this.repo.findOne({
      where: { id },
      relations: ['user', 'specialty', 'hospital'],
    });
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }

  async create(data: Partial<Doctor>): Promise<Doctor> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Doctor>): Promise<Doctor> {
    await this.findById(id);
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
