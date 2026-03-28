/**
 * MediNote — Responsive HTML email templates
 * Compatible with all major email clients (Gmail, Outlook, Apple Mail)
 */

export interface EmailData {
  patientName: string;
  doctorName: string;
  specialty: string;
  hospitalName: string;
  hospitalAddress: string;
  date: string;       // e.g. "Lundi 5 avril 2026"
  time: string;       // e.g. "14:30"
  appointmentId: string;
}

const baseLayout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo span { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.03em; }
    .icon-circle { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; }
    h1 { font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin: 0 0 8px; }
    .subtitle { font-size: 14px; color: #64748b; text-align: center; margin: 0 0 24px; }
    .details { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-value { color: #0f172a; font-weight: 600; text-align: right; }
    .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .footer a { color: #2563eb; text-decoration: none; }
    @media (max-width: 600px) {
      .card { padding: 24px 16px; }
      .details { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo"><span>🏥 MediNote</span></div>
      ${content}
    </div>
    <div class="footer">
      <p>Cet e-mail a été envoyé automatiquement par MediNote.</p>
      <p>Vous recevez cet e-mail car vous avez un compte MediNote.</p>
    </div>
  </div>
</body>
</html>`;

const detailsBlock = (data: EmailData) => `
<div class="details">
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
    <tr><td style="padding:8px 0;color:#64748b;">Médecin</td><td style="padding:8px 0;color:#0f172a;font-weight:600;text-align:right;">Dr. ${data.doctorName}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;border-top:1px solid #e2e8f0;">Spécialité</td><td style="padding:8px 0;color:#0f172a;font-weight:600;text-align:right;border-top:1px solid #e2e8f0;">${data.specialty}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;border-top:1px solid #e2e8f0;">Date</td><td style="padding:8px 0;color:#0f172a;font-weight:600;text-align:right;border-top:1px solid #e2e8f0;">${data.date}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;border-top:1px solid #e2e8f0;">Heure</td><td style="padding:8px 0;color:#0f172a;font-weight:600;text-align:right;border-top:1px solid #e2e8f0;">${data.time}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;border-top:1px solid #e2e8f0;">Lieu</td><td style="padding:8px 0;color:#0f172a;font-weight:600;text-align:right;border-top:1px solid #e2e8f0;">${data.hospitalName}<br><span style="font-weight:400;color:#64748b;">${data.hospitalAddress}</span></td></tr>
  </table>
</div>`;

export function confirmationEmail(data: EmailData): string {
  return baseLayout('Rendez-vous confirmé', `
    <div style="text-align:center;">
      <div class="icon-circle" style="background:#dcfce7;">✅</div>
      <h1>Rendez-vous confirmé</h1>
      <p class="subtitle">Bonjour ${data.patientName}, votre rendez-vous est confirmé.</p>
    </div>
    ${detailsBlock(data)}
    <p style="font-size:13px;color:#64748b;text-align:center;margin-top:16px;">
      Référence : <strong>${data.appointmentId.slice(0, 8).toUpperCase()}</strong>
    </p>
    <div style="text-align:center;margin-top:24px;">
      <a href="#" class="btn">Voir mes rendez-vous</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:16px;">
      Vous pouvez annuler jusqu'à 2h avant le rendez-vous.
    </p>
  `);
}

export function cancellationEmail(data: EmailData): string {
  return baseLayout('Rendez-vous annulé', `
    <div style="text-align:center;">
      <div class="icon-circle" style="background:#fee2e2;">❌</div>
      <h1>Rendez-vous annulé</h1>
      <p class="subtitle">Bonjour ${data.patientName}, votre rendez-vous a été annulé.</p>
    </div>
    ${detailsBlock(data)}
    <div style="text-align:center;margin-top:24px;">
      <a href="#" class="btn">Reprendre rendez-vous</a>
    </div>
  `);
}

export function reminderEmail(data: EmailData, daysUntil: number): string {
  const label = daysUntil === 1 ? 'demain' : `dans ${daysUntil} jours`;
  return baseLayout('Rappel de rendez-vous', `
    <div style="text-align:center;">
      <div class="icon-circle" style="background:#dbeafe;">🔔</div>
      <h1>Rappel : rendez-vous ${label}</h1>
      <p class="subtitle">Bonjour ${data.patientName}, n'oubliez pas votre rendez-vous.</p>
    </div>
    ${detailsBlock(data)}
    <div style="text-align:center;margin-top:24px;">
      <a href="#" class="btn">Voir les détails</a>
    </div>
  `);
}
