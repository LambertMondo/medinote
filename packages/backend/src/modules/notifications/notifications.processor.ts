import { Worker, Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import Redis from 'ioredis';

/**
 * BullMQ email worker — runs as a separate process or can be bootstrapped from NestJS.
 * Processes jobs from the 'email-notifications' queue.
 */
export function startEmailWorker(config: {
  redisUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
}) {
  const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  });

  const worker = new Worker(
    'email-notifications',
    async (job: Job) => {
      const { appointmentId, type } = job.data;

      // In production, fetch appointment details from DB here
      // For now, log the job
      console.log(`📧 Processing email job: ${type} for appointment ${appointmentId}`);

      const subjects: Record<string, string> = {
        confirmation: '✅ Rendez-vous confirmé — MediNote',
        cancellation: '❌ Rendez-vous annulé — MediNote',
        reminder: '🔔 Rappel de rendez-vous — MediNote',
      };

      // TODO: Replace with real template + real patient data
      await transporter.sendMail({
        from: config.smtpFrom,
        to: 'patient@example.com', // Replace with actual patient email
        subject: subjects[type] || 'MediNote Notification',
        html: `<h1>${subjects[type]}</h1><p>Appointment ID: ${appointmentId}</p>`,
      });

      console.log(`✅ Email sent: ${type} for appointment ${appointmentId}`);
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    console.error(`❌ Email job failed: ${job?.id}`, err.message);
  });

  return worker;
}
