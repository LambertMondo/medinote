import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('schedule_templates')
export class ScheduleTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number; // 0=Sun, 6=Sat

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'slot_duration_minutes', type: 'smallint', default: 15 })
  slotDurationMinutes: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
