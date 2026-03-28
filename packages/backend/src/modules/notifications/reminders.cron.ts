import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Cron job that enqueues reminder emails for upcoming appointments.
 * Runs every day at 8:00 AM.
 */
@Injectable()
export class RemindersCronService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendReminders() {
    console.log('🔔 Running daily reminder cron...');

    const now = new Date();

    // J-1 reminders (appointments tomorrow)
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const tomorrowAppointments = await this.appointmentRepo.find({
      where: {
        status: AppointmentStatus.CONFIRMED,
        slot: { startAt: Between(tomorrowStart, tomorrowEnd) },
      },
      relations: ['slot'],
    });

    for (const apt of tomorrowAppointments) {
      await this.notificationsService.queueReminderEmail(apt.id, 'J-1');
    }

    // J-7 reminders (appointments in 7 days)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() + 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setHours(23, 59, 59, 999);

    const weekAppointments = await this.appointmentRepo.find({
      where: {
        status: AppointmentStatus.CONFIRMED,
        slot: { startAt: Between(weekStart, weekEnd) },
      },
      relations: ['slot'],
    });

    for (const apt of weekAppointments) {
      await this.notificationsService.queueReminderEmail(apt.id, 'J-7');
    }

    console.log(
      `✅ Reminders enqueued: ${tomorrowAppointments.length} J-1, ${weekAppointments.length} J-7`,
    );
  }
}
