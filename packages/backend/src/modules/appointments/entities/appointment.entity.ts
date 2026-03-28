import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Slot } from '../../slots/entities/slot.entity';

export enum AppointmentStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @OneToOne(() => Slot)
  @JoinColumn({ name: 'slot_id' })
  slot: Slot;

  @Column({ name: 'slot_id' })
  slotId: string;

  @Column({ type: 'text', nullable: true })
  reason: string; // Encrypted at application level

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.CONFIRMED })
  status: AppointmentStatus;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
