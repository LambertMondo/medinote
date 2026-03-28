import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class NotificationsService {
  private emailQueue: Queue;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('redis.url') || 'redis://localhost:6379';
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

    this.emailQueue = new Queue('email-notifications', { connection });
  }

  async queueConfirmationEmail(appointmentId: string): Promise<void> {
    await this.emailQueue.add(
      'send-confirmation',
      { appointmentId, type: 'confirmation' },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  async queueCancellationEmail(appointmentId: string): Promise<void> {
    await this.emailQueue.add(
      'send-cancellation',
      { appointmentId, type: 'cancellation' },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  async queueReminderEmail(appointmentId: string, reminderType: 'J-1' | 'J-7'): Promise<void> {
    await this.emailQueue.add(
      'send-reminder',
      { appointmentId, type: 'reminder', reminderType },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }
}
