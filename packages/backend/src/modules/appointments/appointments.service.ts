import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SlotStatus } from '../slots/entities/slot.entity';
import { Slot } from '../slots/entities/slot.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  private redis: Redis;

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.redis = new Redis(this.config.get<string>('redis.url') || 'redis://localhost:6379');
  }

  async book(
    patientId: string,
    slotId: string,
    reason: string,
    ipAddress?: string,
  ): Promise<Appointment> {
    const lockKey = `lock:slot:${slotId}`;

    // 1. Acquire Redis distributed lock (10s TTL)
    const lockAcquired = await this.redis.set(lockKey, 'locked', 'EX', 10, 'NX');

    if (!lockAcquired) {
      throw new ConflictException('This slot is currently being booked by another user');
    }

    try {
      // 2. Transaction: verify slot + create appointment
      return await this.dataSource.transaction(async (manager) => {
        const slot = await manager.findOne(Slot, {
          where: { id: slotId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!slot) {
          throw new NotFoundException('Slot not found');
        }

        if (slot.status !== SlotStatus.AVAILABLE) {
          throw new ConflictException('This slot is no longer available');
        }

        // Update slot status
        slot.status = SlotStatus.BOOKED;
        slot.version += 1;
        await manager.save(slot);

        // Create appointment
        const appointment = manager.create(Appointment, {
          patientId,
          doctorId: slot.doctorId,
          slotId: slot.id,
          reason, // TODO: encrypt with AES-256-GCM
          status: AppointmentStatus.CONFIRMED,
        });
        const saved = await manager.save(appointment);

        // Audit log
        await manager.save(
          manager.create(AuditLog, {
            userId: patientId,
            action: 'BOOK_APPOINTMENT',
            entity: 'appointments',
            entityId: saved.id,
            ipAddress,
            metadata: { slotId, doctorId: slot.doctorId },
          }),
        );

        // Queue confirmation email
        await this.notificationsService.queueConfirmationEmail(saved.id);

        return saved;
      });
    } finally {
      // 3. Release lock
      await this.redis.del(lockKey);
    }
  }

  async cancel(
    appointmentId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['slot'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment already cancelled');
    }

    // Check cancellation is at least 2h before slot
    const twoHoursBefore = new Date(appointment.slot.startAt);
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);

    if (new Date() > twoHoursBefore) {
      throw new BadRequestException(
        'Cannot cancel less than 2 hours before the appointment',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Free the slot
      appointment.slot.status = SlotStatus.AVAILABLE;
      await manager.save(appointment.slot);

      // Cancel appointment
      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = userId;
      const saved = await manager.save(appointment);

      // Audit
      await manager.save(
        manager.create(AuditLog, {
          userId,
          action: 'CANCEL_APPOINTMENT',
          entity: 'appointments',
          entityId: saved.id,
          ipAddress,
        }),
      );

      // Queue cancellation email
      await this.notificationsService.queueCancellationEmail(saved.id);

      return saved;
    });
  }

  async getPatientAppointments(patientId: string, page = 1, limit = 20) {
    const [items, total] = await this.appointmentRepo.findAndCount({
      where: { patientId },
      relations: ['doctor', 'doctor.user', 'doctor.specialty', 'slot'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDoctorAppointments(doctorId: string, page = 1, limit = 20) {
    const [items, total] = await this.appointmentRepo.findAndCount({
      where: { doctorId },
      relations: ['patient', 'slot'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
