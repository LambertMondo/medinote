# MediNote — Prise de rendez-vous médicaux

> PWA responsive pour la recherche de médecins et la réservation de consultations.

![Stack](https://img.shields.io/badge/Stack-Next.js%20•%20NestJS%20•%20PostgreSQL%20•%20Redis-blue)
![License](https://img.shields.io/badge/License-Private-red)

---

## 🏗️ Architecture

```
medinote/
├── packages/
│   ├── frontend/          # Next.js 14 (App Router, TypeScript)
│   └── backend/           # NestJS (TypeORM, BullMQ)
├── nginx/                 # Reverse proxy
├── scripts/               # Seed, migrations
└── docker-compose.dev.yml # 5 services
```

| Service    | Technologie     | Port |
|-----------|----------------|------|
| Frontend  | Next.js 14      | 3000 |
| Backend   | NestJS          | 3001 |
| Database  | PostgreSQL 16   | 5432 |
| Cache     | Redis 7         | 6379 |
| Proxy     | Nginx           | 80   |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- Git

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/LambertMondo/medinote.git
cd medinote

# 2. Variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (DB, Redis, JWT, SMTP)

# 3. Lancer avec Docker
docker compose -f docker-compose.dev.yml up --build

# 4. Seed (données de test)
cd packages/backend
npx ts-node ../../scripts/seed.ts
```

### Comptes de test

| Rôle    | Email                      | Mot de passe  |
|---------|---------------------------|---------------|
| Patient | alice@test.com             | MediNote2026! |
| Médecin | dr.nganou@medinote.cm      | MediNote2026! |
| Admin   | admin@medinote.cm          | MediNote2026! |

## 📋 Fonctionnalités

### Patient
- 🔍 Recherche de médecins (spécialité, hôpital, ville)
- 📅 Consultation des disponibilités en temps réel
- 📝 Réservation avec verrou atomique (Redis + PostgreSQL)
- 📧 Confirmation par email + rappels J-7 et J-1
- ❌ Annulation (minimum 2h avant)

### Médecin
- 📊 Dashboard avec vue des rendez-vous
- 🗓️ Gestion des plages horaires (templates récurrents)
- 🚫 Blocage de créneaux (congés)

### Sécurité
- 🔐 JWT avec rotation des refresh tokens
- 🛡️ Argon2id pour le hachage des mots de passe
- 👮 RBAC (patient / médecin / admin)
- 🔒 Rate limiting sur les routes auth
- 📝 Audit log de toutes les mutations

## 🧪 Scripts

```bash
# Backend
cd packages/backend
npm run start:dev          # Dev server
npm run build              # Production build
npm run lint               # Linting

# Frontend
cd packages/frontend
npm run dev                # Dev server
npm run build              # Production build

# Seed
npx ts-node scripts/seed.ts
```

## 📁 Modules Backend

| Module          | Description                                    |
|----------------|------------------------------------------------|
| `auth`         | JWT, refresh token rotation, RBAC              |
| `users`        | Gestion des comptes utilisateurs               |
| `doctors`      | Annuaire avec filtres multicritères             |
| `hospitals`    | CRUD établissements                            |
| `specialties`  | CRUD spécialités médicales                     |
| `slots`        | Templates et génération de créneaux            |
| `appointments` | Réservation atomique + audit log               |
| `notifications`| BullMQ email queue + rappels cron              |

---

**MediNote** © 2026 — Lambert Mondo
