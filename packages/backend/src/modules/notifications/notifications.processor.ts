import { Worker, Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import {
  confirmationEmail,
  cancellationEmail,
  reminderEmail,
  type EmailData,
} from './templates/email.templates';

/**
 * BullMQ email worker — processes jobs from the 'email-notifications' queue.
 * Fetches appointment details from DB and sends templated HTML emails via SMTP.
 */
export function startEmailWorker(config: {
  redisUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  dataSource: DataSource;
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
      const { appointmentId, type, reminderType } = job.data;

      // Fetch appointment with relations
      const appointment = await config.dataSource.query(
        `SELECT
          a.id,
          a.status,
          u.email AS patient_email,
          u.first_name AS patient_first_name,
          u.last_name AS patient_last_name,
          du.first_name AS doctor_first_name,
          du.last_name AS doctor_last_name,
          sp.name AS specialty_name,
          h.name AS hospital_name,
          h.address AS hospital_address,
          s.start_at
        FROM appointments a
        JOIN users u ON u.id = a.patient_id
        JOIN doctors d ON d.id = a.doctor_id
        JOIN users du ON du.id = d.user_id
        LEFT JOIN specialties sp ON sp.id = d.specialty_id
        LEFT JOIN hospitals h ON h.id = d.hospital_id
        JOIN slots s ON s.id = a.slot_id
        WHERE a.id = $1`,
        [appointmentId],
      );

      if (!appointment.length) {
        console.warn(`⚠️ Appointment ${appointmentId} not found, skipping email`);
        return;
      }

      const apt = appointment[0];
      const startDate = new Date(apt.start_at);

      const emailData: EmailData = {
        patientName: `${apt.patient_first_name} ${apt.patient_last_name}`,
        doctorName: `${apt.doctor_first_name} ${apt.doctor_last_name}`,
        specialty: apt.specialty_name || 'Médecine générale',
        hospitalName: apt.hospital_name || '',
        hospitalAddress: apt.hospital_address || '',
        date: startDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        time: startDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        appointmentId,
      };

      const subjects: Record<string, string> = {
        confirmation: '✅ Rendez-vous confirmé — MediNote',
        cancellation: '❌ Rendez-vous annulé — MediNote',
        reminder: '🔔 Rappel de rendez-vous — MediNote',
      };

      let html: string;
      switch (type) {
        case 'confirmation':
          html = confirmationEmail(emailData);
          break;
        case 'cancellation':
          html = cancellationEmail(emailData);
          break;
        case 'reminder': {
          const daysUntil = reminderType === 'J-1' ? 1 : 7;
          html = reminderEmail(emailData, daysUntil);
          break;
        }
        default:
          html = confirmationEmail(emailData);
      }

      await transporter.sendMail({
        from: config.smtpFrom,
        to: apt.patient_email,
        subject: subjects[type] || 'MediNote Notification',
        html,
      });

      console.log(`✅ Email sent: ${type} for appointment ${appointmentId} → ${apt.patient_email}`);
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    console.error(`❌ Email job failed: ${job?.id}`, err.message);
  });

  return worker;
}
