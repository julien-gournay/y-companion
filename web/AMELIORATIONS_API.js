// Configuration pour améliorer l'intégration API

/**
 * AMÉLIORATION 1: Générer sessionId unique par conversation
 * 
 * Installation: npm install uuid
 * 
 * Utilisation dans App.js:
 */
import { v4 as uuidv4 } from 'uuid';

const generateSessionId = () => uuidv4();
// Résultat: "550e8400-e29b-41d4-a716-446655440000"

/**
 * AMÉLIORATION 2: Gérer l'authentification utilisateur
 * 
 * À ajouter dans App.js ou créer un contexte:
 */
const [currentUser, setCurrentUser] = useState({
  userId: null,
  email: null,
  isAuthenticated: false,
});

// Puis dans le chatModel:
const response = await fetch("http://localhost:8080/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: prompt,
    userId: currentUser.userId, // ← À utiliser
    sessionId: currentSessionId,
  }),
});

/**
 * AMÉLIORATION 3: Gérer les variables d'environnement
 * 
 * Créer .env:
 */
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_SESSION_ID=web-session

// Puis utiliser:
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const response = await fetch(`${API_BASE_URL}/api/chat`, {
  // ...
});

/**
 * AMÉLIORATION 4: Ajouter un feedback system (👍 / 👎)
 * 
 * Dans le composant Message:
 */
const handleFeedback = async (interactionId, feedback) => {
  await fetch(`${API_BASE_URL}/api/interactions/${interactionId}/feedback`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback }), // "UP" ou "DOWN"
  });
};

/**
 * AMÉLIORATION 5: Afficher l'historique des conversations
 * 
 * GET /api/interactions?sessionId=web-session
 */
const loadConversationHistory = async (sessionId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/interactions?sessionId=${sessionId}`
  );
  const interactions = await response.json();
  
  // Retourner les messages au format assistant-ui
  return interactions.map(interaction => ({
    role: 'user',
    content: interaction.userQuestion,
  }, {
    role: 'assistant',
    content: interaction.aiAnswer,
  }));
};

/**
 * AMÉLIORATION 6: Télécharger les documents
 * 
 * Depuis les sources retournées par l'API:
 */
const downloadDocument = (downloadUrl) => {
  const link = document.createElement('a');
  link.href = `${API_BASE_URL}${downloadUrl}`;
  link.download = true;
  link.click();
};

/**
 * AMÉLIORATION 7: Gérer les erreurs API avec retry
 */
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status >= 500) throw new Error('Server error');
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

/**
 * AMÉLIORATION 8: Créer un service API réutilisable
 * 
 * Créer src/services/api.js:
 */
export class CampusCompanionAPI {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = baseURL;
  }

  async chat(question, userId, sessionId) {
    return this.fetch('/api/chat', {
      method: 'POST',
      body: { question, userId, sessionId },
    });
  }

  async submitTicketFallback(studentName, studentFirstname, studentClass, studentEmail, question) {
    return this.fetch('/api/tickets/fallback', {
      method: 'POST',
      body: { studentName, studentFirstname, studentClass, studentEmail, question },
    });
  }

  async getInteractions(sessionId) {
    return this.fetch(`/api/interactions?sessionId=${sessionId}`);
  }

  async sendFeedback(interactionId, feedback) {
    return this.fetch(`/api/interactions/${interactionId}/feedback`, {
      method: 'PATCH',
      body: { feedback },
    });
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }
}

// Utilisation:
const api = new CampusCompanionAPI();
const response = await api.chat('Ma question', userId, sessionId);

export default CampusCompanionAPI;

