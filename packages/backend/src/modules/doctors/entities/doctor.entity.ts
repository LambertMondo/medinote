import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Specialty } from '../../specialties/entities/specialty.entity';
import { Hospital } from '../../hospitals/entities/hospital.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Specialty)
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;

  @Column({ name: 'specialty_id', nullable: true })
  specialtyId: string;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @Column({ name: 'hospital_id', nullable: true })
  hospitalId: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column('simple-array', { default: '' })
  languages: string[];

  @Column({ name: 'consultation_fee', type: 'decimal', precision: 8, scale: 2, nullable: true })
  consultationFee: number;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
