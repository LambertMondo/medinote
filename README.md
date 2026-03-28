# MediNote 🏥

> Application web progressive (PWA) de prise de rendez-vous médicaux.

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Backend | NestJS + TypeScript |
| Base de données | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Emails | Brevo (SMTP) |
| Logs | Pino |
| Reverse Proxy | Nginx |
| Conteneurisation | Docker + Docker Compose |

## Documentation

- [Analyse Technique & Cahier des Charges](docs/analyse_technique.md)
- [Plan d'Implémentation](docs/plan_implementation.md)

## Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/LambertMondo/medinote.git
cd medinote

# Copier les variables d'environnement
cp .env.example .env

# Lancer les services
docker compose up -d
```

## Licence

MIT
