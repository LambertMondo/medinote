# MediNote — Guide de Tests

> Ce guide détaille tous les scénarios de test pour valider le fonctionnement de MediNote.

---

## 1. Prérequis

```bash
# Lancer l'environnement
docker compose -f docker-compose.dev.yml up --build

# Charger les données de test
cd packages/backend
npm run seed
```

### Comptes de test

| Rôle    | Email                      | Mot de passe  |
|---------|---------------------------|---------------|
| Patient | `alice@test.com`           | `MediNote2026!` |
| Patient | `bob@test.com`             | `MediNote2026!` |
| Médecin | `dr.nganou@medinote.cm`    | `MediNote2026!` |
| Médecin | `dr.tchoupo@medinote.cm`   | `MediNote2026!` |
| Admin   | `admin@medinote.cm`        | `MediNote2026!` |

---

## 2. Tests Backend (API)

### 2.1 Authentification

| # | Test | Méthode | Endpoint | Body / Params | Résultat attendu |
|---|------|---------|----------|---------------|-----------------|
| 1 | Inscription patient | `POST` | `/api/auth/register` | `{ "email": "test@test.com", "password": "Test1234!", "firstName": "Test", "lastName": "User" }` | `201` + tokens |
| 2 | Email dupliqué | `POST` | `/api/auth/register` | même email | `409 Conflict` |
| 3 | Connexion valide | `POST` | `/api/auth/login` | `{ "email": "alice@test.com", "password": "MediNote2026!" }` | `200` + accessToken + refreshToken |
| 4 | Mot de passe incorrect | `POST` | `/api/auth/login` | mauvais password | `401 Unauthorized` |
| 5 | Rate limiting | `POST` | `/api/auth/login` | 6x en 1 min | `429 Too Many Requests` |
| 6 | Refresh token | `POST` | `/api/auth/refresh` | `{ "refreshToken": "..." }` | `200` + nouveau accessToken |
| 7 | Déconnexion | `POST` | `/api/auth/logout` | Header `Authorization: Bearer ...` | `200` |

### 2.2 Annuaire Médical

| # | Test | Méthode | Endpoint | Résultat attendu |
|---|------|---------|----------|-----------------|
| 1 | Liste médecins | `GET` | `/api/doctors` | `200` + tableau paginé (10 médecins) |
| 2 | Filtre spécialité | `GET` | `/api/doctors?specialtyId=<uuid>` | Médecins filtrés |
| 3 | Filtre hôpital | `GET` | `/api/doctors?hospitalId=<uuid>` | Médecins filtrés |
| 4 | Recherche texte | `GET` | `/api/doctors?search=Nganou` | 1 résultat |
| 5 | Fiche médecin | `GET` | `/api/doctors/<uuid>` | `200` + détails complets |
| 6 | Liste spécialités | `GET` | `/api/specialties` | `200` + 5 spécialités |
| 7 | Liste hôpitaux | `GET` | `/api/hospitals` | `200` + 3 hôpitaux |

### 2.3 Disponibilités

| # | Test | Méthode | Endpoint | Résultat attendu |
|---|------|---------|----------|-----------------|
| 1 | Créneaux disponibles | `GET` | `/api/slots/available/<doctorId>` | `200` + créneaux (status: available) |
| 2 | Aucun créneau passé | `GET` | `/api/slots/available/<doctorId>` | Tous les créneaux sont dans le futur |
| 3 | Templates horaires | `GET` | `/api/slots/templates/<doctorId>` | `200` + templates (Lun-Ven, 8h-17h) |

### 2.4 Réservation

| # | Test | Méthode | Endpoint | Auth | Body | Résultat attendu |
|---|------|---------|----------|------|------|-----------------|
| 1 | Réserver un créneau | `POST` | `/api/appointments` | Patient | `{ "slotId": "<uuid>", "reason": "Consultation" }` | `201` + appointment |
| 2 | Double réservation | `POST` | `/api/appointments` | Patient | même slotId | `409 Conflict` |
| 3 | Sans auth | `POST` | `/api/appointments` | — | — | `401 Unauthorized` |
| 4 | Mes RDV patient | `GET` | `/api/appointments/me` | Patient | — | `200` + tableau |
| 5 | Annuler RDV | `PATCH` | `/api/appointments/<id>/cancel` | Patient | — | `200` + status: cancelled |
| 6 | Annuler trop tard | `PATCH` | `/api/appointments/<id>/cancel` | Patient | (< 2h avant) | `400 Bad Request` |

---

## 3. Tests Frontend (Navigateur)

### 3.1 Page d'accueil (`/`)

- [ ] Le hero section s'affiche avec titre et stats
- [ ] Les 3 feature cards s'affichent
- [ ] Le bouton "Trouver un médecin" redirige vers `/doctors`
- [ ] Le bouton "Créer un compte" redirige vers `/register`

### 3.2 Inscription (`/register`)

- [ ] Les 5 champs s'affichent (prénom, nom, email, password, confirm)
- [ ] Validation : erreur si les mots de passe ne correspondent pas
- [ ] Validation : erreur si email déjà existant
- [ ] Succès : redirection vers `/doctors`
- [ ] Le nom apparaît dans la navbar

### 3.3 Connexion (`/login`)

- [ ] Les 2 champs s'affichent (email, password)
- [ ] Erreur : "Identifiants incorrects" si mauvais password
- [ ] Succès : redirection vers `/doctors`
- [ ] Spinner pendant le chargement
- [ ] Lien "Créer un compte" fonctionne

### 3.4 Annuaire (`/doctors`)

- [ ] Les doctor cards s'affichent avec initiales, spécialité, hôpital
- [ ] Skeleton loading pendant le chargement
- [ ] Filtre par spécialité fonctionne
- [ ] Filtre par hôpital fonctionne
- [ ] Recherche texte fonctionne
- [ ] "Réinitialiser les filtres" réaffiche tout
- [ ] Clic sur une carte → navigation vers `/doctors/[id]`

### 3.5 Fiche médecin (`/doctors/[id]`)

- [ ] Infos du médecin (nom, spécialité, hôpital, bio, tarif)
- [ ] Créneaux groupés par jour (lundi, mardi, etc.)
- [ ] Clic sur un créneau → le sélectionne (couleur bleue)
- [ ] Formulaire booking apparaît avec champ "Motif"
- [ ] Bouton "Confirmer le rendez-vous" → réserve
- [ ] Bannière verte "Rendez-vous confirmé !"
- [ ] Le créneau disparaît de la liste
- [ ] Non connecté → redirection vers `/login`

### 3.6 Mes rendez-vous (`/appointments`)

- [ ] Liste des RDV avec médecin, date, heure
- [ ] Badge "Confirmé" (vert), "Annulé" (rouge)
- [ ] Bouton "Annuler" fonctionne (avec confirmation)
- [ ] Après annulation, badge change en "Annulé"
- [ ] Non connecté → message "Connectez-vous"

### 3.7 Navbar

- [ ] Logo cliquable → retour accueil
- [ ] Non connecté : boutons "Connexion" + "S'inscrire"
- [ ] Connecté : nom de l'utilisateur + "Déconnexion"
- [ ] "Déconnexion" vide le token et redirige

---

## 4. Tests Responsifs

| Écran | Breakpoint | Vérifications |
|-------|-----------|--------------|
| Desktop | > 768px | Layout 2 colonnes (fiche médecin), grille 3 colonnes (features) |
| Tablet | 768px | Filtres empilés, grille 1 colonne |
| Mobile | < 480px | Nom utilisateur masqué dans navbar, cards pleine largeur |

---

## 5. Commandes utiles

```bash
# Vérifier le build backend
cd packages/backend && npx tsc --noEmit

# Vérifier le build frontend
cd packages/frontend && npx next build

# Relancer le seed
cd packages/backend && npm run seed

# Logs Docker
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

---

## 6. Checklist de validation

- [ ] Inscription complète (patient)
- [ ] Connexion / Déconnexion
- [ ] Recherche médecin + filtres
- [ ] Réservation d'un créneau
- [ ] Email de confirmation reçu
- [ ] Annulation du RDV
- [ ] Email d'annulation reçu
- [ ] Responsive (mobile + desktop)
- [ ] Builds passent sans erreur (`tsc` + `next build`)
