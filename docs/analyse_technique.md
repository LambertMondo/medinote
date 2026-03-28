# MediNote — Analyse Technique & Cahier des Charges

> **Date :** 28 mars 2026  
> **Statut :** ✅ Validé

---

## 1. Contexte & Objectif

Développer une **PWA de prise de rendez-vous médicaux** (type Doctolib), hébergée sur VPS personnel (environnement de test), permettant à des patients de consulter l'annuaire des médecins, de visualiser leurs disponibilités en temps réel et de réserver un créneau, avec confirmation automatique par e-mail.

---

## 2. Acteurs du Système

| Acteur | Description |
|--------|-------------|
| **Patient** | Recherche et réserve des rendez-vous |
| **Médecin** | Gère ses disponibilités et ses rendez-vous |
| **Administrateur** | Gère l'annuaire, les établissements, les comptes |
| **Système** | Moteur de notification, gestion des conflits de créneaux |

---

## 3. Spécifications Fonctionnelles

### 3.1 Module — Annuaire Médical
- Liste paginée des médecins avec filtres multicritères : spécialité, hôpital/clinique, ville
- Fiche médecin complète : photo, biographie, langues, lieu d'exercice, tarif, secteur
- Recherche full-text (nom, spécialité)

### 3.2 Module — Gestion des Disponibilités
- Interface médecin : plages horaires récurrentes (ex : lundi 9h–12h, créneaux de 15 min)
- Blocage de créneaux (congés, absences)
- Vue calendrier hebdomadaire/mensuelle
- Affichage patient : créneaux disponibles en temps réel (30 prochains jours)

### 3.3 Module — Prise de Rendez-vous
- Sélection de créneau → confirmation patient
- Réservation atomique (verrou Redis, gestion de la concurrence)
- Motif de consultation (champ texte libre)
- Annulation et reprogrammation (délai minimum configurable)
- Rappels J-1 et J-7 par e-mail

### 3.4 Module — Authentification
- Inscription patient : e-mail + mot de passe (Argon2id)
- Vérification e-mail obligatoire
- Connexion médecin : gérée par l'admin (pas d'inscription publique)
- JWT + Refresh Token (rotation)
- 2FA optionnel (TOTP) pour les médecins

### 3.5 Module — Notifications
- E-mail transactionnel à la confirmation : détails RDV, médecin, lieu, heure
- E-mail d'annulation
- Rappels automatiques via queue BullMQ

---

## 4. Spécifications Techniques

### 4.1 Architecture Globale

```
Client (PWA Next.js)  ←→  Nginx (Reverse Proxy, TLS)  ←→  NestJS API
                                                             ↕
                                                         PostgreSQL
                                                             ↕
                                                           Redis
```

### 4.2 PWA
- Service Worker (mode offline partiel : profils médecins, RDV passés)
- Web App Manifest (installable mobile)
- Score Lighthouse ≥ 90
- Responsive mobile-first

### 4.3 Sécurité & RGPD

| Mesure | Détail |
|--------|--------|
| Chiffrement en transit | TLS 1.3 (Let's Encrypt) |
| Chiffrement au repos | AES-256-GCM sur champs sensibles |
| Minimisation des données | Collecter le strict nécessaire |
| Cloisonnement | Un patient n'accède qu'à ses propres données |
| Rate limiting | Routes auth + réservation |
| Audit log | Traçabilité des accès aux données patients |
| Politique de rétention | Suppression configurable |
| Headers sécurité | CSP, HSTS, X-Frame-Options (Helmet.js) |

> **Note :** L'application sera déployée en environnement de test. La certification HDS sera envisagée pour un déploiement en production réelle.

---

## 5. Stack Technique Validée

| Couche | Choix |
|--------|-------|
| Frontend | **Next.js 14+ (App Router)** + TypeScript |
| Backend | **NestJS** + TypeScript |
| BDD | **PostgreSQL** |
| Cache / Locks / Queue | **Redis** + BullMQ |
| Emails | **Brevo** (SMTP) |
| Logs | **Pino** |
| Reverse Proxy | **Nginx** |
| Conteneurisation | **Docker** + Docker Compose |
| Hébergement | VPS personnel (test) |

---

## 6. Exigences Non-fonctionnelles

| Critère | Cible |
|---------|-------|
| Temps de réponse API | < 300ms (p95) |
| Temps de chargement PWA | < 2s (3G) |
| Concurrence | 50 réservations simultanées sans conflit |

---

## 7. Stratégie de Concurrence sur les Créneaux

```
1. Patient sélectionne un créneau → UI affiche "réservation en cours"
2. Backend acquiert un verrou Redis (SET slot:<id> locked NX PX 10000)
3. Si obtenu → vérification BDD → écriture → libération → email de confirmation
4. Si non obtenu → 409 Conflict → UI propose le prochain créneau
5. TTL 10s = failsafe si crash serveur
```
