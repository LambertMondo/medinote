import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { RemindersCronService } from './reminders.cron';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Appointment]),
  ],
  providers: [NotificationsService, RemindersCronService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
