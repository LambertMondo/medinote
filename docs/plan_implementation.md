# MediNote — Plan d'Implémentation Détaillé

> **Date :** 28 mars 2026  
> **Stack :** Next.js · NestJS · PostgreSQL · Redis · Docker

---

## Vue d'Ensemble des Phases

```mermaid
graph LR
    P0[Phase 0<br/>Fondations] --> P1[Phase 1<br/>Auth & Users]
    P1 --> P2[Phase 2<br/>Annuaire]
    P2 --> P3[Phase 3<br/>Disponibilités]
    P3 --> P4[Phase 4<br/>Réservation]
    P4 --> P5[Phase 5<br/>Notifications]
    P5 --> P6[Phase 6<br/>PWA & Polish]
```

---

## Phase 0 — Fondations & Infrastructure

### 0.1 Arborescence du Projet (Monorepo)

```
medinote/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
├── docs/
│   ├── analyse_technique.md
│   └── plan_implementation.md
├── packages/
│   ├── frontend/          # Next.js 14 App Router
│   │   ├── Dockerfile
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   │   └── manifest.json
│   │   └── src/
│   │       ├── app/                # App Router pages
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── (auth)/
│   │       │   │   ├── login/
│   │       │   │   └── register/
│   │       │   ├── (patient)/
│   │       │   │   ├── doctors/
│   │       │   │   ├── booking/
│   │       │   │   └── appointments/
│   │       │   └── (doctor)/
│   │       │       ├── dashboard/
│   │       │       ├── schedule/
│   │       │       └── appointments/
│   │       ├── components/
│   │       │   ├── ui/             # Composants génériques (Button, Input, Modal…)
│   │       │   ├── layout/         # Header, Footer, Sidebar
│   │       │   └── features/       # Composants métier
│   │       ├── hooks/
│   │       ├── lib/                # API client, utils
│   │       ├── styles/
│   │       └── types/
│   │
│   └── backend/           # NestJS
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── common/
│           │   ├── decorators/
│           │   ├── filters/        # Exception filters
│           │   ├── guards/         # Auth guards
│           │   ├── interceptors/   # Logging, transform
│           │   ├── pipes/          # Validation
│           │   └── middleware/
│           ├── config/
│           │   └── config.module.ts
│           ├── modules/
│           │   ├── auth/
│           │   │   ├── auth.module.ts
│           │   │   ├── auth.controller.ts
│           │   │   ├── auth.service.ts
│           │   │   ├── strategies/     # JWT, local
│           │   │   ├── guards/
│           │   │   └── dto/
│           │   ├── users/
│           │   │   ├── users.module.ts
│           │   │   ├── users.controller.ts
│           │   │   ├── users.service.ts
│           │   │   ├── entities/
│           │   │   └── dto/
│           │   ├── doctors/
│           │   │   ├── doctors.module.ts
│           │   │   ├── doctors.controller.ts
│           │   │   ├── doctors.service.ts
│           │   │   ├── entities/
│           │   │   └── dto/
│           │   ├── hospitals/
│           │   │   ├── hospitals.module.ts
│           │   │   ├── hospitals.controller.ts
│           │   │   ├── hospitals.service.ts
│           │   │   ├── entities/
│           │   │   └── dto/
│           │   ├── specialties/
│           │   │   └── ...
│           │   ├── slots/
│           │   │   ├── slots.module.ts
│           │   │   ├── slots.controller.ts
│           │   │   ├── slots.service.ts
│           │   │   ├── entities/
│           │   │   └── dto/
│           │   ├── appointments/
│           │   │   ├── appointments.module.ts
│           │   │   ├── appointments.controller.ts
│           │   │   ├── appointments.service.ts
│           │   │   ├── entities/
│           │   │   └── dto/
│           │   └── notifications/
│           │       ├── notifications.module.ts
│           │       ├── notifications.service.ts
│           │       ├── notifications.processor.ts  # BullMQ worker
│           │       └── templates/
│           └── database/
│               ├── database.module.ts
│               └── migrations/
│
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
│
└── scripts/
    └── seed.ts             # Données de test
```

### 0.2 Tâches Phase 0

| # | Tâche | Détails |
|---|-------|---------|
| 1 | Initialiser le monorepo | `package.json` racine, workspaces npm |
| 2 | Scaffolder le backend NestJS | `npx @nestjs/cli new backend` + modules de base |
| 3 | Scaffolder le frontend Next.js | `npx create-next-app frontend` (App Router, TypeScript) |
| 4 | Docker Compose (dev) | Services : `postgres`, `redis`, `backend`, `frontend`, `nginx` |
| 5 | Variables d'environnement | `.env.example` avec toutes les clés (DB, Redis, JWT, SMTP) |
| 6 | Nginx config | Reverse proxy, CORS headers, rate limiting basique |
| 7 | CI basique | Linting (ESLint + Prettier) + build check |

---

## Phase 1 — Authentification & Gestion des Utilisateurs

### 1.1 Modèle de Données

```sql
-- Table users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,       -- Argon2id
    role          VARCHAR(20) NOT NULL,         -- 'patient', 'doctor', 'admin'
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    totp_secret   VARCHAR(255),                -- 2FA (médecins)
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Table refresh_tokens
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Tâches Phase 1

| # | Tâche | Détails |
|---|-------|---------|
| 1 | TypeORM setup | `database.module.ts`, entités User, RefreshToken |
| 2 | Module Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| 3 | JWT Strategy | Access token (15min) + Refresh token (7j, rotation) |
| 4 | Guards | `JwtAuthGuard`, `RolesGuard` (RBAC: patient, doctor, admin) |
| 5 | Validation | DTOs avec `class-validator` pour toutes les entrées |
| 6 | Email vérification | Token de vérification + endpoint `GET /auth/verify-email?token=` |
| 7 | Rate limiting | `@nestjs/throttler` sur les routes auth (5 req/min) |
| 8 | Frontend — Pages auth | Login, Register, Forgot Password (formulaires + validation client) |

---

## Phase 2 — Annuaire Médical

### 2.1 Modèle de Données

```sql
CREATE TABLE specialties (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE hospitals (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city    VARCHAR(100) NOT NULL,
    phone   VARCHAR(20),
    image_url TEXT
);

CREATE TABLE doctors (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialty_id  UUID REFERENCES specialties(id),
    hospital_id   UUID REFERENCES hospitals(id),
    bio           TEXT,
    languages     VARCHAR(50)[] DEFAULT '{}',
    consultation_fee DECIMAL(8,2),
    avatar_url    TEXT,
    is_active     BOOLEAN DEFAULT TRUE
);

-- Index pour la recherche
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_doctors_active ON doctors(is_active) WHERE is_active = TRUE;
```

### 2.2 Tâches Phase 2

| # | Tâche | Détails |
|---|-------|---------|
| 1 | Entités & Migrations | Doctor, Specialty, Hospital |
| 2 | Module Doctors | CRUD complet (admin), `GET /doctors` public avec filtres |
| 3 | Module Specialties | CRUD admin, liste publique |
| 4 | Module Hospitals | CRUD admin, liste publique |
| 5 | Recherche & Filtres | Query params : `?specialty=`, `?hospital=`, `?city=`, `?search=` |
| 6 | Pagination | Cursor-based pagination (performant pour de grandes listes) |
| 7 | Cache Redis | Cache des listes médecins/spécialités (TTL 5min), invalidation sur CRUD |
| 8 | Frontend — Annuaire | Page liste + filtres + barre de recherche |
| 9 | Frontend — Fiche médecin | Page détail avec infos + bouton "Prendre RDV" |

---

## Phase 3 — Gestion des Disponibilités

### 3.1 Modèle de Données

```sql
-- Plages horaires récurrentes définies par le médecin
CREATE TABLE schedule_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    slot_duration_minutes SMALLINT DEFAULT 15,
    is_active   BOOLEAN DEFAULT TRUE,
    UNIQUE(doctor_id, day_of_week, start_time)
);

-- Créneaux individuels générés (matérialisés)
CREATE TABLE slots (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id  UUID REFERENCES doctors(id) ON DELETE CASCADE,
    start_at   TIMESTAMPTZ NOT NULL,
    end_at     TIMESTAMPTZ NOT NULL,
    status     VARCHAR(20) DEFAULT 'available',  -- 'available', 'booked', 'blocked'
    version    INTEGER DEFAULT 1,                 -- Optimistic locking
    UNIQUE(doctor_id, start_at)
);

CREATE INDEX idx_slots_doctor_date ON slots(doctor_id, start_at);
CREATE INDEX idx_slots_available ON slots(doctor_id, status, start_at)
    WHERE status = 'available';
```

### 3.2 Tâches Phase 3

| # | Tâche | Détails |
|---|-------|---------|
| 1 | Entités & Migrations | ScheduleTemplate, Slot |
| 2 | Module Slots — Génération | Cron job quotidien : génère les créneaux à partir des templates (rolling 30 jours) |
| 3 | Module Slots — Blocage | Endpoint médecin pour bloquer des créneaux (congés) |
| 4 | Cache Redis | Créneaux disponibles par médecin/jour → Redis Hash (invalidation immédiate à chaque changement) |
| 5 | Frontend — Dashboard médecin | Vue calendrier (semaine/mois), gestion des plages horaires |
| 6 | Frontend — Vue patient | Affichage des créneaux disponibles sur la fiche médecin |

---

## Phase 4 — Réservation de Rendez-vous

### 4.1 Modèle de Données

```sql
CREATE TABLE appointments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID REFERENCES users(id),
    doctor_id     UUID REFERENCES doctors(id),
    slot_id       UUID UNIQUE REFERENCES slots(id),
    reason        TEXT,                                      -- Chiffré AES-256-GCM
    status        VARCHAR(20) DEFAULT 'confirmed',           -- 'confirmed', 'cancelled', 'completed'
    cancelled_at  TIMESTAMPTZ,
    cancelled_by  UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id, created_at DESC);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, created_at DESC);

-- Audit log
CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID,
    action     VARCHAR(50) NOT NULL,
    entity     VARCHAR(50) NOT NULL,
    entity_id  UUID,
    ip_address INET,
    metadata   JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Flux de Réservation (séquence détaillée)

```mermaid
sequenceDiagram
    participant P as Patient
    participant F as Frontend
    participant B as Backend (NestJS)
    participant R as Redis
    participant D as PostgreSQL
    participant Q as BullMQ

    P->>F: Clique "Réserver" sur créneau X
    F->>B: POST /appointments { slotId, reason }
    B->>R: SET lock:slot:X NX PX 10000
    alt Verrou obtenu
        B->>D: BEGIN TRANSACTION
        B->>D: SELECT * FROM slots WHERE id=X AND status='available' FOR UPDATE
        alt Créneau disponible
            B->>D: UPDATE slots SET status='booked', version=version+1
            B->>D: INSERT INTO appointments (...)
            B->>D: INSERT INTO audit_logs (...)
            B->>D: COMMIT
            B->>R: DEL lock:slot:X
            B->>R: Invalider cache créneaux doctor
            B->>Q: Ajouter job "send-confirmation-email"
            B->>F: 201 Created { appointment }
            F->>P: ✅ "Rendez-vous confirmé"
        else Créneau déjà pris (race condition)
            B->>D: ROLLBACK
            B->>R: DEL lock:slot:X
            B->>F: 409 Conflict
            F->>P: ⚠️ "Ce créneau n'est plus disponible"
        end
    else Verrou non obtenu
        B->>F: 409 Conflict
        F->>P: ⚠️ "Ce créneau est en cours de réservation"
    end
```

### 4.3 Tâches Phase 4

| # | Tâche | Détails |
|---|-------|---------|
| 1 | Entités & Migrations | Appointment, AuditLog |
| 2 | Module Appointments | `POST /appointments` (avec verrou Redis + transaction PG) |
| 3 | Annulation | `PATCH /appointments/:id/cancel` (avec vérification délai) |
| 4 | Liste RDV patient | `GET /appointments/me` (paginé, trié par date) |
| 5 | Liste RDV médecin | `GET /appointments/doctor` (paginé, filtrable par date) |
| 6 | Chiffrement `reason` | AES-256-GCM applicatif (clé dans variable d'env) |
| 7 | Audit logging | Interceptor NestJS qui logue toutes les mutations |
| 8 | Frontend — Booking flow | Sélection créneau → Formulaire motif → Confirmation → Récapitulatif |
| 9 | Frontend — Mes RDV | Liste patient avec statuts + bouton annuler |

---

## Phase 5 — Notifications E-mail

### 5.1 Tâches Phase 5

| # | Tâche | Détails |
|---|-------|---------|
| 1 | Module Notifications | Service BullMQ + worker (processor) |
| 2 | Templates e-mail | HTML responsive : confirmation, annulation, rappel |
| 3 | Intégration Brevo | Nodemailer transport SMTP Brevo |
| 4 | Job confirmation | Envoyé immédiatement à la réservation |
| 5 | Job rappels | Cron quotidien : enqueue rappels J-7 et J-1 |
| 6 | Retry & dead-letter | 3 tentatives, log en cas d'échec permanent |

---

## Phase 6 — PWA, Design & Polish

### 6.1 Tâches Phase 6

| # | Tâche | Détails |
|---|-------|---------|
| 1 | Service Worker | Stratégie cache-first pour assets, network-first pour API |
| 2 | Web App Manifest | Nom, icônes, couleur thème, splash screen |
| 3 | Design system | Composants UI unifiés (shadcn/ui ou Radix + CSS) |
| 4 | Animations | Transitions de page (Framer Motion), skeleton loaders, micro-interactions |
| 5 | Dark mode | Toggle avec préférence système par défaut |
| 6 | Accessibilité | ARIA labels, navigation clavier, contraste WCAG AA |
| 7 | Tests E2E | Playwright : parcours inscription → recherche → réservation → annulation |
| 8 | Lighthouse audit | Optimisation jusqu'à score ≥ 90 sur les 4 catégories |
| 9 | Seed script | Données de démo : 10 médecins, 3 hôpitaux, 5 spécialités, créneaux |
| 10 | README.md | Documentation d'installation, architecture, contribution |

---

## Docker Compose — Architecture des Services

```yaml
# docker-compose.yml (production-like)
services:
  nginx:
    build: ./nginx
    ports: ["80:80", "443:443"]
    depends_on: [frontend, backend]

  frontend:
    build: ./packages/frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on: [backend]

  backend:
    build: ./packages/backend
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/medinote
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      - POSTGRES_DB=medinote
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]

volumes:
  pgdata:
  redisdata:
```

---

## Résumé des Livrables par Phase

| Phase | Durée estimée | Livrable principal |
|-------|--------------|-------------------|
| **Phase 0** | 1-2 jours | Infra Docker fonctionnelle, CI, squelettes front/back |
| **Phase 1** | 3-4 jours | Auth complète (inscription, login, JWT, RBAC) |
| **Phase 2** | 3-4 jours | Annuaire médecins avec filtres et cache |
| **Phase 3** | 3-4 jours | Système de disponibilités + calendrier médecin |
| **Phase 4** | 4-5 jours | Réservation atomique + audit log |
| **Phase 5** | 2-3 jours | Emails transactionnels + rappels automatiques |
| **Phase 6** | 3-5 jours | PWA, design, accessibilité, tests |
| **Total** | ~20-27 jours | Application complète prête au déploiement test |
