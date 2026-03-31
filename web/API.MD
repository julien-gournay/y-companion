# Campus Companion — Documentation API

> **Base URL** : `http://localhost:8080`
> **Format** : `application/json` sauf mention contraire
> **Date** : Mars 2026

---

## Table des matières

1. [Auth — Authentification JWT](#1-auth--authentification-jwt)
2. [Chat — Chatbot étudiant](#2-chat--chatbot-étudiant)
3. [Tickets — Demandes pédagogiques](#3-tickets--demandes-pédagogiques)
4. [Documents — Base documentaire](#4-documents--base-documentaire)
5. [Knowledge — Base de connaissances IA](#5-knowledge--base-de-connaissances-ia)
6. [Interactions — Historique & Feedback](#6-interactions--historique--feedback)
7. [Users — Utilisateurs & Push Token](#7-users--utilisateurs--push-token)
8. [Codes d'erreur](#8-codes-derreur)
9. [Flux complets](#9-flux-complets)
10. [Récap des permissions](#10-récap-des-permissions)

---

## 1. Auth — Authentification JWT

> Tous les endpoints protégés nécessitent le header :
> `Authorization: Bearer <token>`

### `POST /api/auth/register` 🔓 PUBLIC

Crée un compte ADMIN ou PEDAGOGUE avec mot de passe haché BCrypt.

**Body :**
```json
{
  "email": "admin@ynov.com",
  "password": "password123",
  "role": "ADMIN"
}
```

| Champ | Type | Obligatoire | Valeurs |
|---|---|---|---|
| `email` | string | ✅ | Email unique |
| `password` | string | ✅ | Mot de passe (haché BCrypt) |
| `role` | string | ✅ | `ADMIN`, `PEDAGOGUE` |

**Réponse `201 Created` :**
```json
{
  "id": 1,
  "email": "admin@ynov.com",
  "role": "ADMIN",
  "createdAt": "2026-03-31T10:00:00Z"
}
```

---

### `POST /api/auth/login` 🔓 PUBLIC

Connexion — retourne un JWT valable 24h.

**Body :**
```json
{
  "email": "admin@ynov.com",
  "password": "password123"
}
```

**Réponse `200 OK` :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "admin@ynov.com",
  "role": "ADMIN"
}
```

> ⚠️ Copier le `token` et l'utiliser dans le header `Authorization: Bearer <token>` pour tous les appels protégés.

---

## 2. Chat — Chatbot étudiant

### `POST /api/chat` 🔓 PUBLIC

Point d'entrée principal. L'étudiant pose sa question, l'IA répond en s'appuyant sur la KB.

**Body :**
```json
{
  "question": "Comment je rattrape un examen ?",
  "userId": null,
  "sessionId": "uuid-genere-cote-front",
  "studentName": null,
  "studentFirstname": null,
  "studentEmail": null
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `question` | string | ✅ | Question posée par l'étudiant |
| `userId` | number | ❌ | ID si l'étudiant est connecté |
| `sessionId` | string | ❌ | UUID front pour grouper une conversation |
| `studentName` | string | ❌ | Nom (requis à l'étape 2 du fallback) |
| `studentFirstname` | string | ❌ | Prénom (requis à l'étape 2 du fallback) |
| `studentEmail` | string | ❌ | Email (requis à l'étape 2 du fallback) |

**Réponse `200 OK` — IA a répondu :**
```json
{
  "answer": "Pour rattraper un examen, tu dois avoir une moyenne inférieure à 10/20...",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 12,
  "requiresStudentInfo": false,
  "sources": [
    {
      "documentId": 1,
      "title": "Reglement des examens et rattrapage",
      "tags": "examen,rattrapage,session",
      "downloadUrl": null
    }
  ]
}
```

**Réponse `200 OK` — IA incertaine, pas d'infos étudiant → afficher le formulaire :**
```json
{
  "answer": "Je n'ai pas trouvé de réponse précise. Merci de renseigner ton prénom, nom et email.",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 13,
  "requiresStudentInfo": true,
  "sources": []
}
```
> Le front doit afficher le formulaire (nom, prénom, email) et re-soumettre.

**Réponse `200 OK` — Ticket créé (étape 2 avec infos étudiant) :**
```json
{
  "answer": "Ta question a bien été transmise (ticket #8). Tu recevras une réponse par email à lucas@ynov.com.",
  "ticketCreated": true,
  "ticketId": 8,
  "interactionId": 14,
  "requiresStudentInfo": false,
  "sources": []
}
```

**Réponse `200 OK` — Fichier téléchargeable détecté :**
```json
{
  "answer": "Voici le document : **Planning B3 DEV**\n/api/documents/14/download",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 15,
  "requiresStudentInfo": false,
  "sources": [
    {
      "documentId": 14,
      "title": "Planning B3 DEV - CDA Logique niveau",
      "tags": "planning,b3,dev",
      "downloadUrl": "/api/documents/14/download"
    }
  ]
}
```

**Questions à tester :**
```json
{ "question": "Comment justifier une absence ?", "sessionId": "sess-001" }
{ "question": "C'est quoi le coefficient de la POO ?", "sessionId": "sess-001" }
{ "question": "Quand sont les vacances de Noel ?", "sessionId": "sess-002" }
{ "question": "Où est le planning des B3 dev ?", "sessionId": "sess-003" }
{ "question": "Quel est le code wifi du campus ?", "sessionId": "sess-004" }
{ "question": "Puis-je redoubler ?", "sessionId": "sess-001" }
```

---

## 3. Tickets — Demandes pédagogiques

### `GET /api/tickets` 🔒 ADMIN / PEDAGOGUE

```
GET /api/tickets
GET /api/tickets?status=OPEN
GET /api/tickets?status=IN_PROGRESS
GET /api/tickets?status=RESOLVED
```

**Réponse `200 OK` :**
```json
[
  {
    "id": 1,
    "question": "Quel est le code wifi ?",
    "status": "OPEN",
    "createdAt": "2026-03-31T10:00:00Z",
    "updatedAt": "2026-03-31T10:00:00Z",
    "answerFromTeacher": null,
    "answerValidated": false,
    "createdByUserId": null,
    "answeredByUserId": null,
    "answeredAt": null,
    "studentName": "Dupont",
    "studentFirstname": "Lucas",
    "studentClass": "B3 Dev",
    "studentEmail": "lucas@ynov.com"
  }
]
```

---

### `GET /api/tickets/{id}` 🔒 ADMIN / PEDAGOGUE

---

### `POST /api/tickets` 🔒 ADMIN / PEDAGOGUE

Crée un ticket manuellement (usage interne).

```json
{
  "question": "Quelle est la procédure pour justifier une absence ?",
  "createdByUserId": 2
}
```

---

### `POST /api/tickets/fallback` 🔓 PUBLIC

> Utilisé par la webapp/mobile quand l'IA ne sait pas répondre.
> L'étudiant remplit le formulaire (nom, prénom, classe, email).

```json
{
  "question": "Comment fonctionne le rattrapage en alternance ?",
  "studentName": "Dupont",
  "studentFirstname": "Lucas",
  "studentClass": "B3 Dev",
  "studentEmail": "lucas.dupont@ynov.com"
}
```

| Champ | Type | Obligatoire |
|---|---|---|
| `question` | string | ✅ |
| `studentName` | string | ✅ |
| `studentFirstname` | string | ✅ |
| `studentClass` | string | ✅ |
| `studentEmail` | string | ✅ |

**Réponse `201 Created` :** Objet ticket avec `status: "OPEN"` et infos étudiant.

---

### `PUT /api/tickets/{id}` 🔒 ADMIN / PEDAGOGUE

```json
{ "status": "IN_PROGRESS", "answerFromTeacher": null, "answerValidated": false }
```

---

### `PATCH /api/tickets/{id}/resolve` ⭐ 🔒 ADMIN / PEDAGOGUE

> L'ADMIN ou PEDAGOGUE répond. Si `addToKnowledgeBase: true` → **l'IA apprend** + **email envoyé** à l'étudiant.

```json
{
  "answer": "Pour justifier une absence, envoie un email à scolarite@ynov.com dans les 48h...",
  "adminId": 1,
  "addToKnowledgeBase": true
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `answer` | string | ✅ | Réponse du pédagogue |
| `adminId` | number | ✅ | ID de l'ADMIN/PEDAGOGUE (rôle vérifié) |
| `addToKnowledgeBase` | boolean | ✅ | `true` = l'IA mémorise + email confirmation envoyé |

**Réponse `200 OK` :**
```json
{
  "id": 1,
  "status": "RESOLVED",
  "answerFromTeacher": "Pour justifier une absence...",
  "answerValidated": true,
  "answeredByUserId": 1,
  "answeredAt": "2026-03-31T14:30:00Z"
}
```

---

### `DELETE /api/tickets/{id}` 🔒 ADMIN / PEDAGOGUE → `204 No Content`

---

## 4. Documents — Base documentaire

### `GET /api/documents` 🔒 ADMIN / PEDAGOGUE

```
GET /api/documents
GET /api/documents?type=PDF
GET /api/documents?type=TEXT
```

**Réponse `200 OK` :**
```json
[
  {
    "id": 14,
    "title": "Planning B3 DEV - CDA Logique niveau",
    "type": "PDF",
    "urlOrPath": "/uploads/CDA_B3_ Logique niveau.pdf",
    "tags": "planning,b3,dev,cda",
    "createdAt": "2026-03-31T09:00:00Z",
    "originalFilename": "CDA_B3_ Logique niveau.pdf",
    "fileSize": 204800,
    "downloadable": true,
    "downloadUrl": "/api/documents/14/download"
  }
]
```

---

### `GET /api/documents/downloadable` 🔓 PUBLIC

Liste les fichiers proposables par l'IA aux étudiants.

---

### `GET /api/documents/{id}` 🔒 ADMIN / PEDAGOGUE

---

### `GET /api/documents/{id}/download` 🔓 PUBLIC

Télécharge le fichier physique. Réponse : fichier binaire avec `Content-Disposition: attachment`.

---

### `POST /api/documents/upload` ⭐ 🔒 ADMIN / PEDAGOGUE

**Content-Type : `multipart/form-data`**

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `file` | File | ✅ | PDF, image… (max 50 MB) |
| `title` | string | ❌ | Titre (défaut = nom du fichier) |
| `tags` | string | ❌ | `planning,b3,dev` |
| `description` | string | ❌ | Texte utilisé par le RAG pour retrouver ce fichier |
| `downloadable` | boolean | ❌ | `true` = l'IA peut le proposer (défaut: `false`) |

> Après upload, le document est **automatiquement indexé** pour le RAG.

**Exemple Bruno (form-data) :**
```
file         → planning-b3.pdf
title        → Planning B3 DEV 2026
tags         → planning,b3,dev,emploi du temps
description  → Planning officiel de la promotion B3 DEV pour l'année 2026
downloadable → true
```

---

### `POST /api/documents` 🔒 ADMIN / PEDAGOGUE

Crée un document sans fichier (métadonnées uniquement).

```json
{
  "title": "Règlement intérieur",
  "type": "TEXT",
  "urlOrPath": "https://ynov.com/reglement",
  "tags": "reglement,interieur"
}
```

---

### `PUT /api/documents/{id}` 🔒 ADMIN / PEDAGOGUE

Met à jour les métadonnées.

---

### `DELETE /api/documents/{id}` 🔒 ADMIN / PEDAGOGUE → `204 No Content`

Supprime le document et son fichier physique sur disque.

---

## 5. Knowledge — Base de connaissances IA

### `POST /api/knowledge/ingest` ⭐ 🔒 ADMIN / PEDAGOGUE

Injecte du texte brut dans la KB. Disponible immédiatement pour le RAG.

```json
{
  "title": "Procedure rattrapage 2026",
  "type": "TEXT",
  "tags": "rattrapage,examen,session,note",
  "content": "Pour rattraper un examen, la moyenne doit être inférieure à 10/20 après la session principale. Les rattrapages ont lieu en février (S1) et juillet (S2).",
  "sourceUrl": "kb://reglements/rattrapage"
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `title` | string | ✅ | Titre du document |
| `type` | string | ❌ | `TEXT` par défaut |
| `tags` | string | ✅ | Mots-clés séparés par des virgules |
| `content` | string | ✅ | Contenu textuel brut utilisé par le RAG |
| `sourceUrl` | string | ❌ | Source de référence |

**Réponse `201 Created` :**
```json
{
  "documentId": 15,
  "title": "Procedure rattrapage 2026",
  "tags": "rattrapage,examen,session,note",
  "contentLength": 342,
  "createdAt": "2026-03-31T14:00:00Z",
  "message": "Document ingere avec succes dans la base de connaissances Campus Companion."
}
```

---

### `GET /api/knowledge` 🔒 ADMIN / PEDAGOGUE

Liste tous les documents de la KB avec leur taille de contenu.

```json
[
  {
    "documentId": 1,
    "title": "Reglement des examens et rattrapage",
    "tags": "examen,rattrapage,session,note",
    "contentLength": 1250,
    "createdAt": "2026-01-01T00:00:00Z",
    "message": "TEXT"
  }
]
```

---

### `POST /api/knowledge/reindex` ⭐ 🔒 ADMIN / PEDAGOGUE

Force la réindexation de tous les documents sans contenu dans le champ `embedding`.
Utile après l'ajout manuel de fichiers dans le dossier `uploads/`.

**Réponse `200 OK` :**
```json
{
  "message": "3 document(s) reindexe(s) avec succes.",
  "count": 3
}
```

---

### `DELETE /api/knowledge/{id}` 🔒 ADMIN / PEDAGOGUE → `204 No Content`

---

## 6. Interactions — Historique & Feedback

### `GET /api/interactions` 🔒 ADMIN / PEDAGOGUE

```
GET /api/interactions
GET /api/interactions?ticketId=3
GET /api/interactions?sessionId=uuid-abc-123
```

> `?sessionId=` retourne l'historique complet d'une conversation triée par date ASC.
> Utilisé par le **mobile** pour afficher l'historique persisté.

**Réponse `200 OK` :**
```json
[
  {
    "id": 1,
    "userQuestion": "Comment justifier une absence ?",
    "aiAnswer": "Tu dois envoyer un email à scolarite@ynov.com...",
    "createdAt": "2026-03-31T10:15:00Z",
    "ticketId": null,
    "feedback": null,
    "sources": "[\"Procedure de justification des absences\"]",
    "sessionId": "uuid-abc-123"
  }
]
```

---

### `GET /api/interactions/{id}` 🔒 ADMIN / PEDAGOGUE

---

### `POST /api/interactions` 🔒 ADMIN / PEDAGOGUE

Création manuelle (usage test).

```json
{ "userQuestion": "...", "aiAnswer": "...", "ticketId": null }
```

---

### `PATCH /api/interactions/{id}/feedback` ⭐ 🔓 PUBLIC

> Pouce haut / pouce bas sur une réponse IA.
> Si `feedback: DOWN` avec une `correction` → **l'IA apprend automatiquement** la bonne réponse.

**Pouce haut :**
```json
{ "feedback": "UP" }
```

**Pouce bas sans correction :**
```json
{ "feedback": "DOWN" }
```

**Pouce bas avec correction pédagogique (IA apprend) :**
```json
{
  "feedback": "DOWN",
  "correction": "La bonne réponse est : les rattrapages ont lieu en février pour S1, pas en mars."
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `feedback` | string | ✅ | `UP` ou `DOWN` |
| `correction` | string | ❌ | Bonne réponse fournie par le pédagogue — injectée en KB si présente |

**Réponse `200 OK` :** Objet interaction avec `feedback` mis à jour.

---

### `DELETE /api/interactions/{id}` 🔒 ADMIN / PEDAGOGUE → `204 No Content`

---

## 7. Users — Utilisateurs & Push Token

### `GET /api/users` 🔒 ADMIN

```json
[{ "id": 1, "email": "alice.martin@ynov.com", "role": "ADMIN", "createdAt": "..." }]
```

---

### `GET /api/users/{id}` 🔒 ADMIN

---

### `POST /api/users` 🔒 ADMIN

```json
{
  "email": "prof@ynov.com",
  "password": "motdepasse123",
  "role": "PEDAGOGUE"
}
```

---

### `PUT /api/users/{id}` 🔒 ADMIN

---

### `PATCH /api/users/{id}/push-token` ⭐ 🔒 ADMIN

> Enregistre le token FCM/APNs pour les **notifications push mobile**.
> Appelé au démarrage de l'app mobile après l'onboarding.

```json
{
  "pushToken": "fcm-token-ou-apns-token-ici",
  "deviceType": "ANDROID"
}
```

| Valeurs `deviceType` | Description |
|---|---|
| `ANDROID` | Token FCM Firebase |
| `IOS` | Token APNs Apple |
| `WEB` | Web Push |

**Réponse `200 OK` :** Objet `UserDto` mis à jour.

---

### `DELETE /api/users/{id}` 🔒 ADMIN → `204 No Content`

---

## 8. Codes d'erreur

| Code | Signification | Exemple |
|---|---|---|
| `200` | Succès | Réponse normale |
| `201` | Créé avec succès | Ticket, document, user créé |
| `204` | Supprimé | DELETE réussi |
| `400` | Validation échouée | champ manquant, rôle insuffisant |
| `401` | Non authentifié | Token absent ou expiré |
| `403` | Accès refusé | Rôle insuffisant |
| `500` | Erreur interne | Ollama indisponible, BDD KO |

**Format standard des erreurs :**
```json
{
  "error": "Non authentifie. Fournissez un token Bearer valide.",
  "status": 401,
  "timestamp": "2026-03-31T14:30:00+02:00"
}
```

---

## 9. Flux complets

### Flux 1 — Démarrage (à faire une seule fois)

```
1. POST /api/auth/register
   { "email": "admin@ynov.com", "password": "password123", "role": "ADMIN" }

2. POST /api/auth/login
   { "email": "admin@ynov.com", "password": "password123" }
   ← token: "eyJ..."

→ Utiliser Authorization: Bearer eyJ... pour tous les appels protégés
```

---

### Flux 2 — Chat normal avec feedback

```
1. POST /api/chat
   { "question": "Comment justifier une absence ?", "sessionId": "sess-001" }
   ← interactionId: 5, sources: ["Procedure de justification des absences"]

2. PATCH /api/interactions/5/feedback
   { "feedback": "UP" }
   ← feedback enregistré ✅
```

---

### Flux 3 — IA ne sait pas → fallback 2 étapes → ADMIN répond → IA apprend

```
1. POST /api/chat
   { "question": "Quel est le code wifi ?", "sessionId": "sess-002" }
   ← requiresStudentInfo: true → AFFICHER FORMULAIRE FRONT

2. POST /api/chat (avec les infos étudiant)
   { "question": "Quel est le code wifi ?",
     "studentFirstname": "Lucas", "studentName": "Dupont",
     "studentEmail": "lucas@ynov.com", "sessionId": "sess-002" }
   ← ticketCreated: true, ticketId: 8
   ← Email de confirmation envoyé à lucas@ynov.com

3. GET /api/tickets?status=OPEN   [Authorization: Bearer ...]
   ← ticket #8 visible

4. PATCH /api/tickets/8/resolve   [Authorization: Bearer ...]
   { "answer": "Le code wifi est YNOV2026.", "adminId": 1, "addToKnowledgeBase": true }
   ← RESOLVED + IA apprend + email réponse envoyé à lucas@ynov.com

5. POST /api/chat
   { "question": "C'est quoi le wifi ?", "sessionId": "sess-003" }
   ← L'IA répond directement ✅
```

---

### Flux 4 — Feedback DOWN + l'IA corrige

```
1. POST /api/chat
   { "question": "Quand sont les rattrapages S1 ?", "sessionId": "sess-004" }
   ← answer: "Les rattrapages sont en mars..." (faux)
   ← interactionId: 9

2. PATCH /api/interactions/9/feedback   [Authorization: Bearer ...]
   { "feedback": "DOWN",
     "correction": "Les rattrapages S1 ont lieu en février, pas en mars." }
   ← Document Q&A injecté en KB ✅

3. POST /api/chat
   { "question": "Quand sont les rattrapages du premier semestre ?" }
   ← L'IA répond correctement ✅
```

---

### Flux 5 — Upload fichier → IA le propose

```
1. POST /api/documents/upload   [Authorization: Bearer ...]
   file=planning-b3.pdf, title="Planning B3 DEV 2026",
   tags="planning,b3,dev", downloadable=true
   ← documentId: 16, indexé automatiquement

2. POST /api/chat
   { "question": "Où est le planning des B3 ?" }
   ← downloadUrl: /api/documents/16/download

3. GET /api/documents/16/download
   ← Téléchargement PDF ✅
```

---

### Flux 6 — Mobile onboarding + historique

```
1. PATCH /api/users/1/push-token   [Authorization: Bearer ...]
   { "pushToken": "fcm-token-abc", "deviceType": "ANDROID" }

2. POST /api/chat (plusieurs fois avec le même sessionId)
   { "question": "...", "userId": 1, "sessionId": "mobile-sess-xyz" }

3. GET /api/interactions?sessionId=mobile-sess-xyz   [Authorization: Bearer ...]
   ← historique complet de la conversation triée par date

4. PATCH /api/tickets/{id}/resolve (par l'admin)
   ← notification push reçue sur le mobile de l'étudiant
```

---

## 10. Récap des permissions

| Endpoint | Méthode | Accès |
|---|---|---|
| `/api/auth/login` | POST | 🔓 Public |
| `/api/auth/register` | POST | 🔓 Public |
| `/api/chat` | POST | 🔓 Public |
| `/api/tickets/fallback` | POST | 🔓 Public |
| `/api/documents/{id}/download` | GET | 🔓 Public |
| `/api/interactions/{id}/feedback` | PATCH | 🔓 Public |
| `/api/tickets/**` | Tous | 🔒 ADMIN / PEDAGOGUE |
| `/api/knowledge/**` | Tous | 🔒 ADMIN / PEDAGOGUE |
| `/api/documents/upload` | POST | 🔒 ADMIN / PEDAGOGUE |
| `/api/documents` | GET | 🔒 ADMIN / PEDAGOGUE |
| `/api/documents/{id}` | DELETE | 🔒 ADMIN / PEDAGOGUE |
| `/api/interactions/**` | GET / DELETE | 🔒 ADMIN / PEDAGOGUE |
| `/api/users/**` | Tous | 🔒 ADMIN uniquement |

---

## Récap — Total 35 endpoints

| Groupe | Endpoints | Nb |
|---|---|---|
| **Auth** | login, register | 2 |
| **Chat** | chat | 1 |
| **Tickets** | list, get, create, fallback, update, resolve, delete | 7 |
| **Documents** | list, downloadable, get, upload, create, update, download, delete | 8 |
| **Knowledge** | ingest, list, reindex, delete | 4 |
| **Interactions** | list, get, create, feedback, delete | 5 |
| **Users** | list, get, create, update, push-token, delete | 6 |
| | **Total** | **33** |
