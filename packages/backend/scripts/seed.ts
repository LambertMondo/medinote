import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

/**
 * MediNote Seed Script — Generates demo data for testing.
 *
 * Usage: npx ts-node scripts/seed.ts
 *
 * Creates:
 * - 5 specialties
 * - 3 hospitals
 * - 10 doctors (with user accounts)
 * - 5 patient accounts
 * - Slot templates for each doctor
 * - Sample slots for the next 14 days
 */

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://medinote:medinote_dev@localhost:5432/medinote';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    synchronize: true,
    entities: [],
    logging: false,
  });

  await ds.initialize();
  console.log('🔌 Connected to database');

  const queryRunner = ds.createQueryRunner();

  // ── Clean existing data ────────────────────────────
  await queryRunner.query('DELETE FROM appointments');
  await queryRunner.query('DELETE FROM audit_logs');
  await queryRunner.query('DELETE FROM slots');
  await queryRunner.query('DELETE FROM schedule_templates');
  await queryRunner.query('DELETE FROM doctors');
  await queryRunner.query('DELETE FROM refresh_tokens');
  await queryRunner.query('DELETE FROM users');
  await queryRunner.query('DELETE FROM specialties');
  await queryRunner.query('DELETE FROM hospitals');
  console.log('🗑️  Cleaned existing data');

  // ── Specialties ────────────────────────────────────
  const specialties = [
    { name: 'Médecine générale', slug: 'medecine-generale' },
    { name: 'Cardiologie', slug: 'cardiologie' },
    { name: 'Dermatologie', slug: 'dermatologie' },
    { name: 'Ophtalmologie', slug: 'ophtalmologie' },
    { name: 'Pédiatrie', slug: 'pediatrie' },
  ];

  const specIds: string[] = [];
  for (const s of specialties) {
    const id = uuidv4();
    specIds.push(id);
    await queryRunner.query(
      `INSERT INTO specialties (id, name, slug) VALUES ($1, $2, $3)`,
      [id, s.name, s.slug],
    );
  }
  console.log(`✅ ${specialties.length} spécialités créées`);

  // ── Hospitals ──────────────────────────────────────
  const hospitals = [
    { name: 'Hôpital Central de Douala', address: '123 Rue de la Santé', city: 'Douala', phone: '+237 233 42 00 00' },
    { name: 'Clinique du Plateau', address: '45 Avenue des Palmiers', city: 'Yaoundé', phone: '+237 222 23 00 00' },
    { name: 'Centre Médical de Kribi', address: '78 Boulevard Océan', city: 'Kribi', phone: '+237 233 46 00 00' },
  ];

  const hospIds: string[] = [];
  for (const h of hospitals) {
    const id = uuidv4();
    hospIds.push(id);
    await queryRunner.query(
      `INSERT INTO hospitals (id, name, address, city, phone) VALUES ($1, $2, $3, $4, $5)`,
      [id, h.name, h.address, h.city, h.phone],
    );
  }
  console.log(`✅ ${hospitals.length} hôpitaux créés`);

  // ── Password hash (same for all demo accounts) ────
  const demoPassword = await argon2.hash('MediNote2026!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // ── Doctor users + Doctor profiles ─────────────────
  const doctorNames = [
    { firstName: 'Jean', lastName: 'Nganou' },
    { firstName: 'Marie', lastName: 'Tchoupo' },
    { firstName: 'Pierre', lastName: 'Eyanga' },
    { firstName: 'Claudine', lastName: 'Mbarga' },
    { firstName: 'Paul', lastName: 'Fouda' },
    { firstName: 'Sylvie', lastName: 'Meka' },
    { firstName: 'Emmanuel', lastName: 'Ondo' },
    { firstName: 'Fatou', lastName: 'Diallo' },
    { firstName: 'Alain', lastName: 'Biya' },
    { firstName: 'Nathalie', lastName: 'Fongang' },
  ];

  const doctorIds: string[] = [];
  for (let i = 0; i < doctorNames.length; i++) {
    const d = doctorNames[i];
    const userId = uuidv4();
    const doctorId = uuidv4();
    doctorIds.push(doctorId);

    await queryRunner.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, 'doctor', $4, $5, true)`,
      [userId, `dr.${d.lastName.toLowerCase()}@medinote.cm`, demoPassword, d.firstName, d.lastName],
    );

    await queryRunner.query(
      `INSERT INTO doctors (id, user_id, specialty_id, hospital_id, bio, consultation_fee, languages, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [
        doctorId,
        userId,
        specIds[i % specIds.length],
        hospIds[i % hospIds.length],
        `Dr. ${d.firstName} ${d.lastName} est un spécialiste reconnu avec plus de ${5 + i} ans d'expérience.`,
        10000 + i * 2500,
        '{français,anglais}',
      ],
    );
  }
  console.log(`✅ ${doctorNames.length} médecins créés`);

  // ── Patient users ──────────────────────────────────
  const patients = [
    { firstName: 'Alice', lastName: 'Nguema', email: 'alice@test.com' },
    { firstName: 'Bob', lastName: 'Kamga', email: 'bob@test.com' },
    { firstName: 'Claire', lastName: 'Etame', email: 'claire@test.com' },
    { firstName: 'David', lastName: 'Fokou', email: 'david@test.com' },
    { firstName: 'Eva', lastName: 'Mbi', email: 'eva@test.com' },
  ];

  for (const p of patients) {
    await queryRunner.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, 'patient', $4, $5, true)`,
      [uuidv4(), p.email, demoPassword, p.firstName, p.lastName],
    );
  }
  console.log(`✅ ${patients.length} patients créés`);

  // ── Schedule Templates (Mon-Fri 8:00-17:00) ───────
  for (const doctorId of doctorIds) {
    for (let day = 1; day <= 5; day++) {
      // Morning: 8:00 - 12:00
      await queryRunner.query(
        `INSERT INTO schedule_templates (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
         VALUES ($1, $2, $3, '08:00', '12:00', 30, true)`,
        [uuidv4(), doctorId, day],
      );
      // Afternoon: 14:00 - 17:00
      await queryRunner.query(
        `INSERT INTO schedule_templates (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
         VALUES ($1, $2, $3, '14:00', '17:00', 30, true)`,
        [uuidv4(), doctorId, day],
      );
    }
  }
  console.log(`✅ Templates horaires créés (Lun-Ven, 8h-17h)`);

  // ── Generate Slots (14 days) ───────────────────────
  let slotCount = 0;
  const now = new Date();

  for (const doctorId of doctorIds) {
    for (let d = 0; d < 14; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      const slots = [
        // Morning 8:00-12:00 (30min slots = 8 slots)
        ...Array.from({ length: 8 }, (_, i) => ({
          start: `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
          end: `${String(8 + Math.floor((i + 1) / 2)).padStart(2, '0')}:${(i + 1) % 2 === 0 ? '00' : '30'}`,
        })),
        // Afternoon 14:00-17:00 (30min slots = 6 slots)
        ...Array.from({ length: 6 }, (_, i) => ({
          start: `${String(14 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
          end: `${String(14 + Math.floor((i + 1) / 2)).padStart(2, '0')}:${(i + 1) % 2 === 0 ? '00' : '30'}`,
        })),
      ];

      for (const s of slots) {
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);

        const startAt = new Date(date);
        startAt.setHours(sh, sm, 0, 0);

        const endAt = new Date(date);
        endAt.setHours(eh, em, 0, 0);

        if (startAt < now) continue; // Skip past slots

        await queryRunner.query(
          `INSERT INTO slots (id, doctor_id, start_at, end_at, status, version)
           VALUES ($1, $2, $3, $4, 'available', 1)`,
          [uuidv4(), doctorId, startAt.toISOString(), endAt.toISOString()],
        );
        slotCount++;
      }
    }
  }
  console.log(`✅ ${slotCount} créneaux générés (14 jours)`);

  // ── Admin user ─────────────────────────────────────
  await queryRunner.query(
    `INSERT INTO users (id, email, password_hash, role, first_name, last_name, email_verified)
     VALUES ($1, 'admin@medinote.cm', $2, 'admin', 'Admin', 'MediNote', true)`,
    [uuidv4(), demoPassword],
  );
  console.log('✅ Admin créé (admin@medinote.cm)');

  await queryRunner.release();
  await ds.destroy();

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Comptes de test :');
  console.log('  📧 Patient : alice@test.com / MediNote2026!');
  console.log('  📧 Médecin : dr.nganou@medinote.cm / MediNote2026!');
  console.log('  📧 Admin   : admin@medinote.cm / MediNote2026!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
