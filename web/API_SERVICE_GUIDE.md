# 🔌 Utilisation du Service API CampusCompanionAPI

## 📍 Fichier
```
web/src/services/api.js
```

## 📥 Import

```javascript
import CampusCompanionAPI from './services/api';

// Créer une instance
const api = new CampusCompanionAPI();

// Ou avec URL personnalisée
const api = new CampusCompanionAPI('http://api.example.com:8080');
```

---

## 💬 Exemples d'utilisation

### 1️⃣ Chat - Question simple

```javascript
try {
  const response = await api.chat(
    'Comment justifier une absence ?',
    userId,
    'web-session'
  );
  
  console.log(response.answer);           // Réponse IA
  console.log(response.ticketCreated);    // Ticket créé ?
  console.log(response.sources);          // Sources utilisées
  console.log(response.suggestions);      // Suggestions suivantes
} catch (error) {
  console.error('Chat error:', error.message);
}
```

### 2️⃣ Fallback - Formulaire

```javascript
try {
  const ticket = await api.submitTicketFallback(
    'Dupont',           // studentName
    'Lucas',            // studentFirstname
    'B3 Dev',           // studentClass
    'lucas@ynov.com',   // studentEmail
    'Tarif cantine ?'   // question
  );
  
  console.log(`Ticket créé: #${ticket.id}`);
} catch (error) {
  console.error('Fallback error:', error.message);
}
```

### 3️⃣ Historique - Récupérer conversation

```javascript
try {
  const history = await api.getConversationHistory('web-session');
  
  history.forEach(item => {
    console.log('User:', item.userMessage.content);
    console.log('AI:', item.assistantMessage.content);
    console.log('Sources:', item.assistantMessage.sources);
  });
} catch (error) {
  console.error('History error:', error.message);
}
```

### 4️⃣ Feedback - Pouce haut/bas

```javascript
// Utilisateur clique "👍"
try {
  await api.sendFeedback(12, 'UP');
  console.log('Feedback envoyé !');
} catch (error) {
  console.error('Feedback error:', error.message);
}

// Utilisateur clique "👎"
try {
  await api.sendFeedback(12, 'DOWN');
} catch (error) {
  console.error('Feedback error:', error.message);
}
```

### 5️⃣ Tickets - Gestion

```javascript
// Obtenir tous les tickets OPEN
const openTickets = await api.getTickets('OPEN');

// Obtenir un ticket spécifique
const ticket = await api.getTicket(7);

// Résoudre un ticket (ADMIN)
const resolved = await api.resolveTicket(
  7,                                      // ticketId
  'Voici la réponse...',                 // answer
  1,                                      // adminId
  true                                    // addToKnowledgeBase
);

// Supprimer un ticket
await api.deleteTicket(7);
```

### 6️⃣ Documents - Upload et téléchargement

```javascript
// Upload un document
const file = document.querySelector('input[type="file"]').files[0];
const doc = await api.uploadDocument(
  file,
  'Dossier inscription 2025',
  'inscription,formulaire',
  'Formulaire officiel d\'inscription',
  true // downloadable
);
console.log(`Document #${doc.documentId} créé`);

// Télécharger un document
api.downloadDocument(1, 'dossier-inscription.pdf');

// Lister les documents téléchargeables
const downloadable = await api.getDownloadableDocuments();
```

### 7️⃣ Knowledge Base - Injection

```javascript
// Injecter du contenu dans la KB
const kb = await api.ingestKnowledge(
  'Procédure rattrapage 2025',
  'rattrapage,examen,session',
  'Pour rattraper un examen, il faut...',
  'kb://reglements/rattrapage'
);

console.log(`Document #${kb.documentId} ajouté à la KB`);

// Obtenir toute la KB
const allKB = await api.getKnowledge();
console.log(`${allKB.length} documents en KB`);
```

### 8️⃣ Users - Authentification

```javascript
// Créer un utilisateur
const user = await api.createUser(
  'alice@ynov.com',
  'password123',
  'ADMIN'
);

// Enregistrer un push token (mobile)
await api.setPushToken(
  3,
  'fcm-token-firebase-ici',
  'ANDROID'
);

// Obtenir tous les utilisateurs
const users = await api.getUsers();
```

---

## 🎯 Intégration dans App.js

Au lieu d'utiliser fetch directement, utiliser le service :

### ❌ Ancien (non recommandé)
```javascript
const response = await fetch("http://localhost:8080/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question, userId, sessionId }),
});
```

### ✅ Nouveau (recommandé)
```javascript
import CampusCompanionAPI from './services/api';

const api = new CampusCompanionAPI();

const response = await api.chat(question, userId, sessionId);
```

---

## 🔧 Configuration

### Via .env
```
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_API_TIMEOUT=30000
REACT_APP_LOG_REQUESTS=true
```

### Via constructor
```javascript
const api = new CampusCompanionAPI(
  process.env.REACT_APP_API_BASE_URL
);
```

---

## ⚠️ Gestion des erreurs

### Cas 1 : Erreur HTTP
```javascript
try {
  await api.chat(...);
} catch (error) {
  console.error(error.status);  // 400, 500, etc.
  console.error(error.data);    // { error: "...", status: ... }
  console.error(error.message); // Message d'erreur
}
```

### Cas 2 : Timeout
```javascript
try {
  await api.chat(...);
} catch (error) {
  if (error.message.includes('Timeout')) {
    console.error('Réponse trop lente !');
  }
}
```

### Cas 3 : Erreur réseau
```javascript
try {
  await api.chat(...);
} catch (error) {
  if (!navigator.onLine) {
    console.error('Pas de connexion internet');
  }
}
```

---

## 📊 Structure des réponses

### Chat response
```javascript
{
  answer: "Réponse IA...",
  ticketCreated: false,
  ticketId: null,
  interactionId: 12,
  sources: [
    { title: "Doc 1", downloadUrl: "/api/documents/1/download" }
  ],
  suggestions: ["Option 1", "Option 2"]
}
```

### Ticket fallback response
```javascript
{
  id: 7,
  question: "Question ?",
  status: "OPEN",
  createdAt: "2026-03-31T14:30:00Z",
  studentName: "Dupont",
  studentFirstname: "Lucas",
  studentClass: "B3 Dev",
  studentEmail: "lucas@ynov.com"
}
```

### Interaction response
```javascript
{
  id: 1,
  userQuestion: "...",
  aiAnswer: "...",
  createdAt: "2026-03-31T10:15:00Z",
  ticketId: null,
  feedback: null,  // "UP" ou "DOWN"
  sources: "[...]"
}
```

---

## 🔍 Tous les endpoints disponibles

| Méthode | Endpoint | Fonction |
|---|---|---|
| `chat()` | POST /api/chat | Poser question |
| `getTickets()` | GET /api/tickets | Lister tickets |
| `submitTicketFallback()` | POST /api/tickets/fallback | Créer ticket fallback |
| `resolveTicket()` | PATCH /api/tickets/{id}/resolve | Résoudre ticket |
| `getDocuments()` | GET /api/documents | Lister docs |
| `uploadDocument()` | POST /api/documents/upload | Uploader doc |
| `getInteractions()` | GET /api/interactions | Historique |
| `sendFeedback()` | PATCH /api/interactions/{id}/feedback | Feedback 👍/👎 |
| `ingestKnowledge()` | POST /api/knowledge/ingest | Injecter KB |
| `getUsers()` | GET /api/users | Lister users |
| `setPushToken()` | PATCH /api/users/{id}/push-token | Notifications |

---

## ✅ Checklist d'implémentation

- [ ] Importer `CampusCompanionAPI` dans `App.js`
- [ ] Créer instance `const api = new CampusCompanionAPI()`
- [ ] Remplacer `fetch()` par `api.chat()`
- [ ] Remplacer `fetch()` par `api.submitTicketFallback()`
- [ ] Tester le chat en live
- [ ] Tester le formulaire fallback
- [ ] Ajouter gestion feedback (optionnel)
- [ ] Ajouter historique (optionnel)

---

**Service API prêt à utiliser !** 🚀

---

*Campus Companion - 31 Mars 2026*

