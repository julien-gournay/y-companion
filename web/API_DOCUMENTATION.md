# Campus Companion — Documentation API

> **Base URL** : `http://localhost:8080`
> **Format** : `application/json` sauf mention contraire
> **Date** : Mars 2026

---

## Table des matières

1. [Chat — Chatbot étudiant](#1-chat--chatbot-étudiant)
2. [Tickets — Demandes pédagogiques](#2-tickets--demandes-pédagogiques)
3. [Documents — Base documentaire](#3-documents--base-documentaire)
4. [Knowledge — Base de connaissances IA](#4-knowledge--base-de-connaissances-ia)
5. [Interactions — Historique & Feedback](#5-interactions--historique--feedback)
6. [Users — Utilisateurs & Push Token](#6-users--utilisateurs--push-token)
7. [Codes d'erreur](#7-codes-derreur)
8. [Flux complets](#8-flux-complets)

---

## 1. Chat — Chatbot étudiant

### `POST /api/chat`

**Body :**
```json
{
  "question": "Comment je rattrape un examen ?",
  "userId": 1,
  "sessionId": "uuid-session-generee-cote-front"
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `question` | string | ✅ | Question posée par l'étudiant |
| `userId` | number | ❌ | ID de l'étudiant connecté |
| `sessionId` | string | ❌ | UUID généré côté front pour grouper les messages d'une conversation |

**Réponse `200 OK` — IA a répondu :**
```json
{
  "answer": "Pour rattraper un examen, tu dois avoir une moyenne inférieure à 10/20...",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 12,
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

**Réponse `200 OK` — IA incertaine → ticket créé automatiquement :**
```json
{
  "answer": "Je n'ai pas trouve de reponse precise... Un ticket #7 a ete transmis a l'equipe pedagogique.",
  "ticketCreated": true,
  "ticketId": 7,
  "interactionId": 13,
  "sources": []
}
```

**Réponse `200 OK` — Fichier téléchargeable détecté :**
```json
{
  "answer": "Voici le document : **Dossier d'inscription 2025**\n/api/documents/3/download",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 14,
  "sources": [
    {
      "documentId": 3,
      "title": "Dossier d'inscription 2025",
      "tags": "inscription,formulaire",
      "downloadUrl": "/api/documents/3/download"
    }
  ]
}
```

**Questions à tester :**
```json
{ "question": "Comment justifier une absence ?", "userId": 1, "sessionId": "abc-123" }
{ "question": "C'est quoi le coefficient de la POO ?", "userId": 2, "sessionId": "abc-123" }
{ "question": "Quand sont les vacances de Noel ?", "userId": null, "sessionId": "xyz-456" }
{ "question": "Vous avez le dossier d'inscription ?", "userId": 1, "sessionId": "abc-123" }
{ "question": "Puis-je redoubler ?", "userId": 3, "sessionId": "def-789" }
```

---

## 2. Tickets — Demandes pédagogiques

### `GET /api/tickets`

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
    "question": "Comment je rattrape un examen ?",
    "status": "OPEN",
    "createdAt": "2026-03-30T10:00:00Z",
    "updatedAt": "2026-03-30T10:00:00Z",
    "answerFromTeacher": null,
    "answerValidated": false,
    "createdByUserId": 2,
    "answeredByUserId": null,
    "answeredAt": null,
    "studentName": null,
    "studentFirstname": null,
    "studentClass": null,
    "studentEmail": null
  }
]
```

### `GET /api/tickets/{id}`

### `POST /api/tickets`

```json
{ "question": "Quelle est la procédure pour justifier une absence ?", "createdByUserId": 2 }
```

### `POST /api/tickets/fallback` ⭐

> Utilisé par la **webapp/mobile** quand l'IA ne sait pas répondre.  
> L'étudiant remplit le formulaire obligatoire (nom, prénom, classe, email).

```json
{
  "question": "Comment fonctionne le rattrapage pour les étudiants en alternance ?",
  "studentName": "Dupont",
  "studentFirstname": "Lucas",
  "studentClass": "B3 Dev",
  "studentEmail": "lucas.dupont@student.ynov.com"
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `question` | string | ✅ | Question que l'IA n'a pas su répondre |
| `studentName` | string | ✅ | Nom de famille |
| `studentFirstname` | string | ✅ | Prénom |
| `studentClass` | string | ✅ | Classe / promotion (ex: "B3 Dev", "M1 IA") |
| `studentEmail` | string | ✅ | Email pour recevoir la réponse |

**Réponse `201 Created` :** Objet ticket avec `status: "OPEN"` et les infos étudiant.

### `PUT /api/tickets/{id}`

```json
{ "status": "IN_PROGRESS", "answerFromTeacher": null, "answerValidated": false }
```

### `PATCH /api/tickets/{id}/resolve` ⭐

> L'ADMIN ou PEDAGOGUE répond. Si `addToKnowledgeBase: true` → **l'IA apprend** + **notification push** envoyée à l'étudiant.

```json
{
  "answer": "Pour justifier une absence, envoie un email à scolarite@ynov.com dans les 48h...",
  "adminId": 1,
  "addToKnowledgeBase": true
}
```

**Réponse `200 OK` :**
```json
{
  "id": 1,
  "status": "RESOLVED",
  "answerFromTeacher": "Pour justifier une absence...",
  "answerValidated": true,
  "answeredByUserId": 1,
  "answeredAt": "2026-03-30T14:30:00Z"
}
```

### `DELETE /api/tickets/{id}` → `204 No Content`

---

## 3. Documents — Base documentaire

### `GET /api/documents`
```
GET /api/documents
GET /api/documents?type=PDF
```

### `GET /api/documents/downloadable`

Liste les fichiers que l'IA peut proposer en téléchargement.

### `GET /api/documents/{id}`

### `POST /api/documents/upload` ⭐

**Content-Type : `multipart/form-data`**

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `file` | File | ✅ | PDF, image… (max 50 MB) |
| `title` | string | ❌ | Titre (défaut = nom du fichier) |
| `tags` | string | ❌ | `inscription,formulaire,campus` |
| `description` | string | ❌ | Texte utilisé par le RAG pour trouver ce fichier |
| `downloadable` | boolean | ❌ | `true` = l'IA peut le proposer (défaut: `false`) |

```
file         → dossier-inscription.pdf
title        → Dossier d'inscription 2025
tags         → inscription,dossier,formulaire
description  → Formulaire officiel d'inscription au campus Ynov
downloadable → true
```

### `GET /api/documents/{id}/download`

Télécharge le fichier. Réponse : fichier binaire.

### `POST /api/documents` — Métadonnées sans fichier

```json
{ "title": "Règlement intérieur", "type": "TEXT", "urlOrPath": "https://ynov.com/reglement", "tags": "reglement" }
```

### `PUT /api/documents/{id}` — Mise à jour métadonnées
### `DELETE /api/documents/{id}` → `204 No Content`

---

## 4. Knowledge — Base de connaissances IA

### `POST /api/knowledge/ingest` ⭐

Injecte du texte brut dans la KB. Disponible immédiatement pour le RAG.

```json
{
  "title": "Procedure rattrapage 2025",
  "type": "TEXT",
  "tags": "rattrapage,examen,session,note",
  "content": "Pour rattraper un examen, la moyenne doit être inférieure à 10/20...",
  "sourceUrl": "kb://reglements/rattrapage"
}
```

**Réponse `201 Created` :**
```json
{
  "documentId": 15,
  "title": "Procedure rattrapage 2025",
  "tags": "rattrapage,examen,session,note",
  "contentLength": 342,
  "createdAt": "2026-03-30T14:00:00Z",
  "message": "Document ingere avec succes dans la base de connaissances Campus Companion."
}
```

### `GET /api/knowledge` — Liste tous les docs avec taille de contenu
### `DELETE /api/knowledge/{id}` → `204 No Content`

---

## 5. Interactions — Historique & Feedback

### `GET /api/interactions`

```
GET /api/interactions
GET /api/interactions?ticketId=3
GET /api/interactions?sessionId=uuid-abc-123
```

> `?sessionId=` retourne l'historique complet d'une conversation (trié par date ASC).  
> Utilisé par le **mobile** pour afficher l'historique persisté.

**Réponse `200 OK` :**
```json
[
  {
    "id": 1,
    "userQuestion": "Comment justifier une absence ?",
    "aiAnswer": "Tu dois envoyer un email à scolarite@ynov.com...",
    "createdAt": "2026-03-30T10:15:00Z",
    "ticketId": null,
    "feedback": null,
    "sources": "[\"Procedure de justification des absences\"]",
    "sessionId": "uuid-abc-123"
  }
]
```

### `GET /api/interactions/{id}`

### `PATCH /api/interactions/{id}/feedback` ⭐

> Pouce haut / pouce bas sur une réponse IA.

```json
{ "feedback": "UP" }
```
ou
```json
{ "feedback": "DOWN" }
```

**Réponse `200 OK` :** Objet interaction mis à jour avec `feedback: "UP"`.

**Erreur si valeur invalide :**
```json
{ "error": "Feedback invalide : utilisez UP ou DOWN.", "status": 400 }
```

### `POST /api/interactions` — Création manuelle (test)

```json
{ "userQuestion": "...", "aiAnswer": "...", "ticketId": null }
```

### `DELETE /api/interactions/{id}` → `204 No Content`

---

## 6. Users — Utilisateurs & Push Token

### `GET /api/users` — Liste tous les utilisateurs

```json
[{ "id": 1, "email": "alice.martin@ynov.com", "role": "ADMIN", "createdAt": "..." }]
```

### `GET /api/users/{id}`

### `POST /api/users`

```json
{ "email": "etudiant@ynov.com", "password": "motdepasse123", "role": "PEDAGOGUE" }
```

| Valeurs `role` | Description |
|---|---|
| `ADMIN` | Accès complet, peut résoudre les tickets |
| `PEDAGOGUE` | Peut résoudre les tickets |

### `PUT /api/users/{id}` — Mise à jour

### `PATCH /api/users/{id}/push-token` ⭐

> Enregistre le token FCM (Android) ou APNs (iOS) pour les **notifications push**.  
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

### `DELETE /api/users/{id}` → `204 No Content`

---

## 7. Codes d'erreur

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Créé avec succès |
| `204` | Supprimé |
| `400` | Validation échouée |
| `500` | Erreur interne |

```json
{
  "error": "Seuls les ADMIN et PEDAGOGUE peuvent resoudre un ticket.",
  "status": 400,
  "timestamp": "2026-03-30T14:30:00+02:00"
}
```

---

## 8. Flux complets

### Flux 1 — Chat normal avec sources

```
POST /api/chat
  { "question": "Comment justifier une absence ?", "userId": 1, "sessionId": "sess-001" }
→ sources: ["Procedure de justification des absences"]
→ interactionId: 5

PATCH /api/interactions/5/feedback
  { "feedback": "UP" }
→ pouce haut enregistre
```

### Flux 2 — IA ne sait pas → fallback formulaire → ADMIN répond → IA apprend

```
1. POST /api/chat
   { "question": "Tarif cantine ce mois ?", "userId": null, "sessionId": "sess-002" }
   → ticketCreated: true, ticketId: 8

2. POST /api/tickets/fallback
   { "question": "Tarif cantine ce mois ?",
     "studentName": "Dupont", "studentFirstname": "Lucas",
     "studentClass": "B3 Dev", "studentEmail": "lucas@ynov.com" }
   → ticket #9 cree avec infos etudiant

3. GET /api/tickets?status=OPEN
   → equipe peda voit les tickets

4. PATCH /api/tickets/8/resolve
   { "answer": "Le menu coute 4,50 euros...", "adminId": 1, "addToKnowledgeBase": true }
   → RESOLVED + push notification envoyee + IA apprend

5. POST /api/chat
   { "question": "Combien coute la cantine ?", "userId": 5 }
   → IA repond directement
```

### Flux 3 — Upload fichier → IA le propose

```
1. POST /api/documents/upload (multipart)
   file=dossier-inscription.pdf, downloadable=true

2. POST /api/chat
   { "question": "J'ai besoin du dossier d'inscription", "userId": 4 }
   → downloadUrl: /api/documents/1/download

3. GET /api/documents/1/download
   → telechargement PDF
```

### Flux 4 — Mobile onboarding + historique

```
1. PATCH /api/users/3/push-token
   { "pushToken": "fcm-token-abc", "deviceType": "ANDROID" }
   → token enregistre

2. POST /api/chat (plusieurs fois avec le meme sessionId)
   { "question": "...", "userId": 3, "sessionId": "mobile-sess-xyz" }

3. GET /api/interactions?sessionId=mobile-sess-xyz
   → historique complet de la conversation

4. PATCH /api/tickets/{id}/resolve (par l'admin)
   → notification push recue sur le mobile de l'etudiant
```

---

## Recap — Total 32 endpoints

| Groupe | Nb |
|---|---|
| Chat | 1 |
| Tickets | 7 (+ fallback + resolve) |
| Documents | 8 (+ upload + download + downloadable) |
| Knowledge | 3 |
| Interactions | 5 (+ feedback + filtre sessionId) |
| Users | 6 (+ push-token) |
| **Total** | **32** |


> **Base URL** : `http://localhost:8080`  
> **Format** : `application/json` sauf mention contraire  
> **Date** : Mars 2026

---

## Table des matières

1. [Chat — Chatbot étudiant](#1-chat--chatbot-étudiant)
2. [Tickets — Demandes pédagogiques](#2-tickets--demandes-pédagogiques)
3. [Documents — Base documentaire](#3-documents--base-documentaire)
4. [Knowledge — Base de connaissances IA](#4-knowledge--base-de-connaissances-ia)
5. [Interactions — Historique des échanges](#5-interactions--historique-des-échanges)
6. [Users — Utilisateurs](#6-users--utilisateurs)
7. [Codes d'erreur](#7-codes-derreur)

---

## 1. Chat — Chatbot étudiant

> Point d'entrée principal de Campus Companion.  
> L'étudiant pose sa question, l'IA répond en s'appuyant sur la documentation.  
> Si l'IA ne sait pas → un ticket est créé automatiquement.

### `POST /api/chat`

**Body :**
```json
{
  "question": "Comment je rattrape un examen ?",
  "userId": 1
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `question` | string | ✅ | Question posée par l'étudiant |
| `userId` | number | ❌ | ID de l'étudiant (pour rattacher le ticket si créé) |

**Réponse `200 OK` — IA a répondu :**
```json
{
  "answer": "Pour rattraper un examen, tu dois avoir une moyenne inférieure à 10/20. Les sessions de rattrapage ont lieu en février pour le S1 et en juillet pour le S2. (Source: Règlement des examens et rattrapage)",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 12
}
```

**Réponse `200 OK` — IA incertaine → ticket créé :**
```json
{
  "answer": "Je n'ai pas trouvé de réponse précise dans la documentation du campus pour ta question. Un ticket #7 a été transmis automatiquement à l'équipe pédagogique. Tu recevras une réponse dès que possible. En attendant, tu peux consulter l'ENT ou écrire à scolarite@ynov.com.",
  "ticketCreated": true,
  "ticketId": 7,
  "interactionId": 13
}
```

**Réponse `200 OK` — Fichier téléchargeable détecté :**
```json
{
  "answer": "Voici le document que tu cherches : **Dossier d'inscription 2025**\nTu peux le télécharger directement via ce lien : /api/documents/3/download",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 14
}
```

**Exemples de questions à tester :**
```json
{ "question": "Comment justifier une absence ?", "userId": 1 }
{ "question": "C'est quoi le coefficient de la POO ?", "userId": 2 }
{ "question": "Quand sont les vacances de Noël ?", "userId": null }
{ "question": "Comment s'inscrire ? Vous avez le dossier ?", "userId": 1 }
{ "question": "Puis-je redoubler ?", "userId": 3 }
```

---

## 2. Tickets — Demandes pédagogiques

> Les tickets sont créés automatiquement par l'IA quand elle ne sait pas répondre,  
> ou manuellement par un étudiant. L'équipe pédagogique (ADMIN/PEDAGOGUE) les résout.  
> Une réponse validée peut être injectée dans la KB pour que **l'IA apprenne**.

### `GET /api/tickets`

Liste tous les tickets. Filtrable par statut.

**Query params :**

| Paramètre | Valeurs | Description |
|---|---|---|
| `status` | `OPEN`, `IN_PROGRESS`, `RESOLVED` | Filtrer par statut |

**Exemples :**
```
GET /api/tickets
GET /api/tickets?status=OPEN
GET /api/tickets?status=IN_PROGRESS
```

**Réponse `200 OK` :**
```json
[
  {
    "id": 1,
    "question": "Comment je rattrape un examen ?",
    "status": "OPEN",
    "createdAt": "2026-03-30T10:00:00Z",
    "updatedAt": "2026-03-30T10:00:00Z",
    "answerFromTeacher": null,
    "answerValidated": false,
    "createdByUserId": 2,
    "answeredByUserId": null,
    "answeredAt": null
  }
]
```

---

### `GET /api/tickets/{id}`

**Réponse `200 OK` :** Objet ticket complet (même structure que ci-dessus).

---

### `POST /api/tickets`

Crée un ticket manuellement.

**Body :**
```json
{
  "question": "Quelle est la procédure pour justifier une absence ?",
  "createdByUserId": 2
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `question` | string | ✅ | Question ou demande de l'étudiant |
| `createdByUserId` | number | ❌ | ID de l'étudiant à l'origine du ticket |

**Réponse `201 Created`** : Objet ticket avec `status: "OPEN"`.

---

### `PUT /api/tickets/{id}`

Met à jour un ticket (statut, réponse…).

**Body :**
```json
{
  "question": "Comment justifier une absence ?",
  "status": "IN_PROGRESS",
  "answerFromTeacher": null,
  "answerValidated": false
}
```

---

### `PATCH /api/tickets/{id}/resolve` ⭐

> **Action clé** : L'ADMIN ou PEDAGOGUE répond au ticket.  
> Si `addToKnowledgeBase: true` → **l'IA mémorise la réponse** et pourra y répondre seule la prochaine fois.

**Body :**
```json
{
  "answer": "Pour justifier une absence, envoie un email à scolarite@ynov.com dans les 48h avec ton justificatif (certificat médical, convocation...).",
  "adminId": 1,
  "addToKnowledgeBase": true
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `answer` | string | ✅ | Réponse rédigée par le pédagogue |
| `adminId` | number | ✅ | ID de l'ADMIN ou PEDAGOGUE qui répond (rôle vérifié) |
| `addToKnowledgeBase` | boolean | ✅ | `true` = l'IA apprend cette réponse |

**Réponse `200 OK` :**
```json
{
  "id": 1,
  "question": "Comment justifier une absence ?",
  "status": "RESOLVED",
  "answerFromTeacher": "Pour justifier une absence, envoie un email...",
  "answerValidated": true,
  "answeredByUserId": 1,
  "answeredAt": "2026-03-30T14:30:00Z"
}
```

**Erreurs possibles :**
```json
{ "error": "adminId est requis pour resoudre un ticket.", "status": 400 }
{ "error": "Seuls les ADMIN et PEDAGOGUE peuvent resoudre un ticket.", "status": 400 }
```

---

### `DELETE /api/tickets/{id}`

Supprime un ticket. **Réponse `204 No Content`.**

---

## 3. Documents — Base documentaire

> Gestion des fichiers et documents pédagogiques.  
> Les documents `downloadable: true` peuvent être proposés automatiquement par l'IA aux étudiants.

### `GET /api/documents`

Liste tous les documents. Filtrable par type.

**Query params :**

| Paramètre | Valeurs |
|---|---|
| `type` | `PDF`, `IMAGE`, `TEXT`, `VIDEO`, `OTHER` |

```
GET /api/documents
GET /api/documents?type=PDF
```

**Réponse `200 OK` :**
```json
[
  {
    "id": 1,
    "title": "Dossier d'inscription 2025",
    "type": "PDF",
    "urlOrPath": "/uploads/abc123.pdf",
    "tags": "inscription,dossier,formulaire",
    "createdAt": "2026-03-30T09:00:00Z",
    "originalFilename": "dossier-inscription-2025.pdf",
    "fileSize": 204800,
    "downloadable": true,
    "downloadUrl": "/api/documents/1/download"
  }
]
```

---

### `GET /api/documents/downloadable`

Liste uniquement les documents que l'IA peut proposer aux étudiants (`downloadable: true`).

---

### `GET /api/documents/{id}`

Retourne un document par son ID.

---

### `POST /api/documents/upload` ⭐

> Upload un fichier physique (PDF, image…) dans la base de connaissances.

**Content-Type : `multipart/form-data`**

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `file` | File | ✅ | Fichier à uploader (max 50 MB) |
| `title` | string | ❌ | Titre affiché (défaut = nom du fichier) |
| `tags` | string | ❌ | Tags pour le retrieval IA (ex: `inscription,formulaire`) |
| `description` | string | ❌ | Description textuelle utilisée par le RAG |
| `downloadable` | boolean | ❌ | `true` = l'IA peut proposer ce fichier (défaut: `false`) |

**Exemple Bruno (form-data) :**
```
file        → dossier-inscription.pdf
title       → Dossier d'inscription 2025
tags        → inscription,dossier,formulaire,campus
description → Formulaire officiel d'inscription au campus Ynov. Contient les informations personnelles, le choix de filière et les pièces justificatives à fournir.
downloadable → true
```

**Réponse `201 Created` :** Objet `DocumentDto` avec `downloadUrl` renseigné.

---

### `GET /api/documents/{id}/download`

Télécharge le fichier physique associé au document.

**Réponse :** Fichier binaire avec header `Content-Disposition: attachment; filename="..."`

---

### `POST /api/documents`

Crée un document sans fichier physique (métadonnées uniquement).

**Body :**
```json
{
  "title": "Lien vers le règlement intérieur",
  "type": "TEXT",
  "urlOrPath": "https://ynov.com/reglement",
  "tags": "reglement,interieur"
}
```

---

### `PUT /api/documents/{id}`

Met à jour les métadonnées d'un document (titre, tags…).

---

### `DELETE /api/documents/{id}`

Supprime le document et son fichier physique sur le disque. **Réponse `204 No Content`.**

---

## 4. Knowledge — Base de connaissances IA

> API réservée à l'équipe pédagogique pour injecter directement du **contenu textuel** dans la KB.  
> Contrairement à `/documents/upload`, ici on colle du texte brut — pas de fichier physique.

### `POST /api/knowledge/ingest` ⭐

Injecte un document textuel dans la KB. Disponible immédiatement pour le RAG.

**Body :**
```json
{
  "title": "Procédure de rattrapage examen 2025",
  "type": "TEXT",
  "tags": "rattrapage,examen,session,note",
  "content": "Pour rattraper un examen, l'étudiant doit avoir une moyenne inférieure à 10/20 après la session principale. Toutes les matières avec une note inférieure à 10 peuvent être repassées. La meilleure note entre la session principale et le rattrapage est retenue. Les rattrapages ont lieu en février (S1) et juillet (S2).",
  "sourceUrl": "kb://reglements/rattrapage-2025"
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `title` | string | ✅ | Titre du document |
| `type` | string | ❌ | `TEXT`, `PDF`, `IMAGE`… (défaut: `TEXT`) |
| `tags` | string | ✅ | Mots-clés pour le retrieval (séparés par des virgules) |
| `content` | string | ✅ | Contenu textuel brut utilisé par le RAG |
| `sourceUrl` | string | ❌ | Source de référence |

**Réponse `201 Created` :**
```json
{
  "documentId": 15,
  "title": "Procédure de rattrapage examen 2025",
  "tags": "rattrapage,examen,session,note",
  "contentLength": 342,
  "createdAt": "2026-03-30T14:00:00Z",
  "message": "Document ingéré avec succès dans la base de connaissances Campus Companion."
}
```

---

### `GET /api/knowledge`

Liste tous les documents de la KB avec leur taille de contenu.

**Réponse `200 OK` :**
```json
[
  {
    "documentId": 1,
    "title": "Règlement des examens et rattrapage",
    "tags": "examen,rattrapage,session,note",
    "contentLength": 1250,
    "createdAt": "2026-01-01T00:00:00Z",
    "message": "TEXT"
  }
]
```

---

### `DELETE /api/knowledge/{id}`

Supprime un document de la KB. **Réponse `204 No Content`.**

---

## 5. Interactions — Historique des échanges

> Toutes les conversations entre les étudiants et l'IA sont sauvegardées automatiquement.

### `GET /api/interactions`

Liste toutes les interactions. Filtrable par ticket.

```
GET /api/interactions
GET /api/interactions?ticketId=3
```

**Réponse `200 OK` :**
```json
[
  {
    "id": 1,
    "userQuestion": "Comment fonctionne la récursivité en Java ?",
    "aiAnswer": "La récursivité consiste pour une méthode à s'appeler elle-même...",
    "createdAt": "2026-03-30T10:15:00Z",
    "ticketId": null
  }
]
```

---

### `GET /api/interactions/{id}`

Retourne une interaction par son ID.

---

### `POST /api/interactions`

Crée une interaction manuellement (usage interne/test).

**Body :**
```json
{
  "userQuestion": "Comment s'inscrire ?",
  "aiAnswer": "Voici la procédure...",
  "ticketId": null
}
```

---

### `DELETE /api/interactions/{id}`

Supprime une interaction. **Réponse `204 No Content`.**

---

## 6. Users — Utilisateurs

> Gestion des utilisateurs du campus (étudiants, pédagogues, admins).

### `GET /api/users`

Liste tous les utilisateurs.

**Réponse `200 OK` :**
```json
[
  {
    "id": 1,
    "email": "alice.martin@ynov.com",
    "role": "ADMIN",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

---

### `GET /api/users/{id}`

Retourne un utilisateur par son ID.

---

### `POST /api/users`

Crée un utilisateur.

**Body :**
```json
{
  "email": "etudiant.nouveau@ynov.com",
  "password": "motdepasse123",
  "role": "PEDAGOGUE"
}
```

| Champ | Type | Obligatoire | Valeurs |
|---|---|---|---|
| `email` | string | ✅ | Email unique |
| `password` | string | ✅ | Mot de passe (stub — BCrypt à venir) |
| `role` | string | ✅ | `ADMIN`, `PEDAGOGUE` |

**Réponse `201 Created` :** Objet `UserDto` (sans le mot de passe).

---

### `PUT /api/users/{id}`

Met à jour un utilisateur.

---

### `DELETE /api/users/{id}`

Supprime un utilisateur. **Réponse `204 No Content`.**

---

## 7. Codes d'erreur

| Code | Signification | Exemple |
|---|---|---|
| `200` | Succès | Réponse normale |
| `201` | Créé avec succès | Ticket, document, user créé |
| `204` | Supprimé | DELETE réussi |
| `400` | Erreur de validation | `adminId` manquant, rôle insuffisant |
| `500` | Erreur interne | Ollama indisponible, BDD KO |

**Format standard des erreurs :**
```json
{
  "error": "Seuls les ADMIN et PEDAGOGUE peuvent resoudre un ticket.",
  "status": 400,
  "timestamp": "2026-03-30T14:30:00+02:00"
}
```

---

## Flux complets — Scénarios Campus Companion

### Scénario 1 — Étudiant pose une question, l'IA répond

```
POST /api/chat
  { "question": "Comment justifier une absence ?", "userId": 2 }

→ IA cherche dans la KB
→ Trouve le document "Procédure de justification des absences"
→ Répond avec la procédure complète
→ Interaction sauvegardée (id: 5)
```

### Scénario 2 — L'IA ne sait pas → ticket créé → ADMIN répond → IA apprend

```
1. POST /api/chat
   { "question": "Quel est le tarif de la cantine ce mois-ci ?", "userId": 3 }
   → ticketCreated: true, ticketId: 8

2. GET /api/tickets?status=OPEN
   → L'équipe pédagogique voit le ticket #8

3. PATCH /api/tickets/8/resolve
   { "answer": "Le menu de la cantine est affiché chaque lundi sur l'ENT et coûte 4,50€.",
     "adminId": 1,
     "addToKnowledgeBase": true }
   → Ticket RESOLVED + Document créé en KB

4. POST /api/chat
   { "question": "Combien coûte la cantine ?", "userId": 5 }
   → L'IA répond directement grâce à l'apprentissage ✅
```

### Scénario 3 — Upload dossier d'inscription → étudiant demande → IA fournit le lien

```
1. POST /api/documents/upload (multipart)
   file=dossier-inscription.pdf
   title="Dossier d'inscription 2025"
   tags="inscription,dossier,formulaire"
   description="Formulaire officiel d'inscription au campus Ynov"
   downloadable=true

2. POST /api/chat
   { "question": "Comment s'inscrire ? Vous avez le dossier ?", "userId": 4 }
   → "Voici le document : Dossier d'inscription 2025 — /api/documents/1/download"

3. GET /api/documents/1/download
   → Téléchargement du PDF ✅
```

