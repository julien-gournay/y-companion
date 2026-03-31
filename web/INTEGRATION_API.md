# 🔌 Intégration API Assistant-UI → LLM

## ✅ Ce qui a été fait

### 1. **Connexion du chatModel à l'API réelle**

Le fichier `App.js` a été modifié pour appeler votre **API réelle** au lieu de simuler les réponses :

```javascript
// Ancien : Mock
async run({ messages }) {
  return { content: [{ type: "text", text: "Réponse fake" }] };
}

// Nouveau : API réelle
const response = await fetch("http://localhost:8080/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: prompt,
    userId: null,
    sessionId: "web-session",
  }),
});
```

### 2. **Gestion des sources**

Les réponses de l'API qui incluent des sources sont maintenant affichées :

```
L'IA répond...

📚 Sources:
• Document 1
• Document 2 [Télécharger](/api/documents/2/download)
```

### 3. **Gestion des tickets (fallback)**

Quand l'API retourne `ticketCreated: true`, le formulaire s'affiche automatiquement pour que l'utilisateur remplisse :
- Nom
- Prénom
- Classe
- Email
- Question

Le formulaire envoie les données à `POST /api/tickets/fallback` avec gestion :
- ✅ Succès
- ❌ Erreur
- ⏳ Chargement

### 4. **Suggestions dynamiques**

Les suggestions retournées par l'API sont maintenant utilisées au lieu de suggestions statiques.

---

## 🚀 Comment tester

### Étape 1 : Démarrer votre API
```bash
# Terminal 1 - API Java/Spring (sur le port 8080)
cd backend
./mvnw spring-boot:run
```

### Étape 2 : Démarrer l'app React
```bash
# Terminal 2 - App React (sur le port 3000)
cd web
npm install  # Si jamais
npm start
```

### Étape 3 : Tester les scénarios

#### Scénario 1 : Réponse simple
1. Ouvrir http://localhost:3000
2. Taper : "Comment justifier une absence ?"
3. **Attendu** : L'API retourne la réponse avec sources

#### Scénario 2 : IA ne sait pas → Formulaire
1. Taper : "Tarif cantine ce mois ?" (ou une question que l'API ne connaît pas)
2. **Attendu** : Le formulaire s'affiche
3. Remplir : Nom, Prénom, Classe, Email
4. Cliquer "Envoyer à la péda"
5. **Attendu** : Message de succès, ticket créé sur l'API

---

## 📋 Flux complet

```
Utilisateur pose question
    ↓
fetch POST /api/chat
    ↓
API retourne { answer, ticketCreated, sources, suggestions }
    ↓
┌─────────────────────────────────────┐
│ ticketCreated = false               │
├─────────────────────────────────────┤
│ Afficher réponse + sources          │
│ Afficher suggestions suivantes      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ ticketCreated = true                │
├─────────────────────────────────────┤
│ Afficher formulaire de fallback      │
│ Utilisateur remplit son nom/email   │
│ POST /api/tickets/fallback          │
│ Confirmation ✅                     │
└─────────────────────────────────────┘
```

---

## 🔧 Configuration

### URL de l'API
- **Actuellement** : `http://localhost:8080`
- **À personnaliser** : Dans `App.js` ligne ~51 et `form.jsx` ligne ~28

### sessionId
- **Actuellement** : `"web-session"` (statique)
- **À améliorer** : Générer un UUID unique par conversation
  ```javascript
  import { v4 as uuidv4 } from 'uuid';
  const sessionId = uuidv4();
  ```

### userId
- **Actuellement** : `null` (anonymous)
- **À améliorer** : Ajouter l'authentification utilisateur

---

## 📊 Formats API attendus

### Request
```json
{
  "question": "Comment justifier une absence ?",
  "userId": null,
  "sessionId": "web-session"
}
```

### Response (succès)
```json
{
  "answer": "Tu dois envoyer un email à scolarite@ynov.com...",
  "ticketCreated": false,
  "ticketId": null,
  "interactionId": 12,
  "sources": [
    {
      "documentId": 1,
      "title": "Procédure de justification",
      "downloadUrl": "/api/documents/1/download"
    }
  ],
  "suggestions": [
    "Horaires des cours",
    "Bibliothèque",
    "Événements"
  ]
}
```

### Response (IA ne sait pas)
```json
{
  "answer": "Je n'ai pas trouvé de réponse...",
  "ticketCreated": true,
  "ticketId": 7,
  "interactionId": 13,
  "sources": [],
  "suggestions": [...]
}
```

---

## 🐛 Dépannage

### "Cannot connect to localhost:8080"
- ✅ Vérifier que l'API Java est en cours d'exécution
- ✅ Vérifier le port : `http://localhost:8080` (pas 8000, pas 3000)

### Formulaire ne s'affiche pas
- ✅ Vérifier que l'API retourne `"ticketCreated": true`
- ✅ Vérifier la console du navigateur pour les erreurs

### Suggestions ne s'affichent pas
- ✅ Vérifier que l'API retourne `"suggestions": [...]` dans les métadonnées
- ✅ Sinon, les suggestions par défaut s'affichent

---

## 🎯 Prochaines étapes (optionnel)

1. **Ajouter l'authentification** : Passer userId réel
2. **Générer sessionId unique** : Pour grouper les conversations
3. **Afficher l'historique** : GET /api/interactions?sessionId=xxx
4. **Ajouter un feedback** : PATCH /api/interactions/{id}/feedback (👍/👎)
5. **Gestion des documents** : Permettre le téléchargement de fichiers
6. **Intégration BDD** : Persister les conversations côté front
7. **Push notifications** : Notifier l'utilisateur quand un ticket est résolu

---

## 📝 Fichiers modifiés

- `src/App.js` - Chat model connecté à l'API
- `src/components/assistant-ui/form.jsx` - Formulaire fallback avec envoi API
- `src/components/assistant-ui/thread.jsx` - Passage de lastQuestion au formulaire

**Date** : 31 Mars 2026

