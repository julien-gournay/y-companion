/**
 * 🔌 Service API pour Campus Companion
 * 
 * Centralise tous les appels API vers le backend
 * Facilite la maintenance et les tests
 * 
 * Usage:
 * const api = new CampusCompanionAPI();
 * const response = await api.chat(question, userId, sessionId);
 */

class CampusCompanionAPI {
  constructor(baseURL = null) {
    this.baseURL = baseURL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    this.timeout = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);
  }

  /**
   * 📡 Utilitaire pour faire des requêtes avec timeout et gestion d'erreur
   */
  async _fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    // Ajouter le body JSON
    if (options.body) {
      defaultOptions.body = JSON.stringify(options.body);
    }

    // Ajouter timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Gérer les erreurs HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout après ${this.timeout}ms`);
      }
      
      if (process.env.REACT_APP_LOG_REQUESTS === 'true') {
        console.error(`API Error [${endpoint}]:`, error);
      }
      
      throw error;
    }
  }

  // ============================================
  // 💬 CHAT - Endpoint principal
  // ============================================

  /**
   * Envoyer une question à l'IA
   * @param {string} question - La question de l'utilisateur
   * @param {number|null} userId - ID utilisateur (optionnel)
   * @param {string} sessionId - ID de session unique
   * @returns {Promise} Réponse formatée de l'IA
   */
  async chat(question, userId = null, sessionId = 'web-session') {
    return this._fetch('/api/chat', {
      method: 'POST',
      body: { question, userId, sessionId },
    });
  }

  // ============================================
  // 🎫 TICKETS
  // ============================================

  /**
   * Obtenir tous les tickets
   * @param {string} status - Filtre optionnel (OPEN, IN_PROGRESS, RESOLVED)
   */
  async getTickets(status = null) {
    const query = status ? `?status=${status}` : '';
    return this._fetch(`/api/tickets${query}`);
  }

  /**
   * Obtenir un ticket spécifique
   */
  async getTicket(ticketId) {
    return this._fetch(`/api/tickets/${ticketId}`);
  }

  /**
   * Créer un nouveau ticket manuellement
   */
  async createTicket(question, createdByUserId = null) {
    return this._fetch('/api/tickets', {
      method: 'POST',
      body: { question, createdByUserId },
    });
  }

  /**
   * Soumettre le formulaire de fallback (IA ne sait pas)
   * @param {string} studentName - Nom de l'étudiant
   * @param {string} studentFirstname - Prénom
   * @param {string} studentClass - Classe/promotion
   * @param {string} studentEmail - Email
   * @param {string} question - Question originale
   */
  async submitTicketFallback(
    studentName,
    studentFirstname,
    studentClass,
    studentEmail,
    question
  ) {
    return this._fetch('/api/tickets/fallback', {
      method: 'POST',
      body: {
        studentName,
        studentFirstname,
        studentClass,
        studentEmail,
        question,
      },
    });
  }

  /**
   * Résoudre un ticket (ADMIN/PEDAGOGUE uniquement)
   */
  async resolveTicket(ticketId, answer, adminId, addToKnowledgeBase = false) {
    return this._fetch(`/api/tickets/${ticketId}/resolve`, {
      method: 'PATCH',
      body: { answer, adminId, addToKnowledgeBase },
    });
  }

  /**
   * Supprimer un ticket
   */
  async deleteTicket(ticketId) {
    return this._fetch(`/api/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // 📄 DOCUMENTS
  // ============================================

  /**
   * Obtenir tous les documents
   * @param {string} type - Filtre optionnel (PDF, IMAGE, TEXT, VIDEO, OTHER)
   */
  async getDocuments(type = null) {
    const query = type ? `?type=${type}` : '';
    return this._fetch(`/api/documents${query}`);
  }

  /**
   * Obtenir uniquement les documents téléchargeables
   */
  async getDownloadableDocuments() {
    return this._fetch('/api/documents/downloadable');
  }

  /**
   * Obtenir un document spécifique
   */
  async getDocument(documentId) {
    return this._fetch(`/api/documents/${documentId}`);
  }

  /**
   * Télécharger un fichier document
   */
  downloadDocument(documentId, filename = null) {
    const url = `${this.baseURL}/api/documents/${documentId}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `document-${documentId}`;
    link.click();
  }

  /**
   * Uploader un document
   * @param {File} file - Fichier à uploader
   * @param {string} title - Titre du document
   * @param {string} tags - Tags (ex: "inscription,formulaire")
   * @param {string} description - Description
   * @param {boolean} downloadable - Peut être téléchargé par l'IA ?
   */
  async uploadDocument(file, title = null, tags = '', description = '', downloadable = false) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (tags) formData.append('tags', tags);
    if (description) formData.append('description', description);
    formData.append('downloadable', downloadable);

    const url = `${this.baseURL}/api/documents/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // ⚠️ Ne pas mettre Content-Type header (multipart/form-data)
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(documentId) {
    return this._fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // 📚 KNOWLEDGE BASE (KB)
  // ============================================

  /**
   * Injecter du contenu textuel dans la KB
   */
  async ingestKnowledge(title, tags, content, sourceUrl = null, type = 'TEXT') {
    return this._fetch('/api/knowledge/ingest', {
      method: 'POST',
      body: { title, type, tags, content, sourceUrl },
    });
  }

  /**
   * Obtenir tous les documents de la KB
   */
  async getKnowledge() {
    return this._fetch('/api/knowledge');
  }

  /**
   * Supprimer un document de la KB
   */
  async deleteKnowledge(knowledgeId) {
    return this._fetch(`/api/knowledge/${knowledgeId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // 💬 INTERACTIONS (Historique)
  // ============================================

  /**
   * Obtenir l'historique des interactions
   * @param {string} sessionId - Filtrer par sessionId pour une conversation
   * @param {number} ticketId - Filtrer par ticketId
   */
  async getInteractions(sessionId = null, ticketId = null) {
    let query = '';
    if (sessionId) query += `?sessionId=${sessionId}`;
    if (ticketId) query += query ? `&ticketId=${ticketId}` : `?ticketId=${ticketId}`;

    return this._fetch(`/api/interactions${query}`);
  }

  /**
   * Obtenir une interaction spécifique
   */
  async getInteraction(interactionId) {
    return this._fetch(`/api/interactions/${interactionId}`);
  }

  /**
   * Envoyer un feedback sur une réponse (👍 ou 👎)
   * @param {number} interactionId - ID de l'interaction
   * @param {string} feedback - "UP" ou "DOWN"
   */
  async sendFeedback(interactionId, feedback) {
    if (!['UP', 'DOWN'].includes(feedback)) {
      throw new Error('Feedback doit être "UP" ou "DOWN"');
    }

    return this._fetch(`/api/interactions/${interactionId}/feedback`, {
      method: 'PATCH',
      body: { feedback },
    });
  }

  /**
   * Créer une interaction manuellement
   */
  async createInteraction(userQuestion, aiAnswer, ticketId = null) {
    return this._fetch('/api/interactions', {
      method: 'POST',
      body: { userQuestion, aiAnswer, ticketId },
    });
  }

  /**
   * Supprimer une interaction
   */
  async deleteInteraction(interactionId) {
    return this._fetch(`/api/interactions/${interactionId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // 👤 USERS
  // ============================================

  /**
   * Obtenir tous les utilisateurs
   */
  async getUsers() {
    return this._fetch('/api/users');
  }

  /**
   * Obtenir un utilisateur
   */
  async getUser(userId) {
    return this._fetch(`/api/users/${userId}`);
  }

  /**
   * Créer un utilisateur
   */
  async createUser(email, password, role = 'PEDAGOGUE') {
    return this._fetch('/api/users', {
      method: 'POST',
      body: { email, password, role },
    });
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId, data) {
    return this._fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * Enregistrer un push token (notifications mobile)
   */
  async setPushToken(userId, pushToken, deviceType = 'ANDROID') {
    return this._fetch(`/api/users/${userId}/push-token`, {
      method: 'PATCH',
      body: { pushToken, deviceType },
    });
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId) {
    return this._fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // 🔍 HELPERS
  // ============================================

  /**
   * Obtenir la conversation complète avec les sources
   */
  async getConversationHistory(sessionId) {
    const interactions = await this.getInteractions(sessionId);
    
    return interactions.map(interaction => ({
      userMessage: {
        role: 'user',
        content: interaction.userQuestion,
      },
      assistantMessage: {
        role: 'assistant',
        content: interaction.aiAnswer,
        sources: interaction.sources ? JSON.parse(interaction.sources) : [],
        feedback: interaction.feedback,
      },
      timestamp: interaction.createdAt,
    }));
  }

  /**
   * Chercher dans la KB par tags
   */
  async searchKnowledge(query) {
    // ⚠️ À ajouter côté backend si besoin
    // return this._fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
    throw new Error('Endpoint /api/knowledge/search non encore implémenté');
  }
}

// Export
export default CampusCompanionAPI;

/**
 * Usage recommandé:
 * 
 * // Créer une instance globale (dans App.js)
 * const api = new CampusCompanionAPI();
 * 
 * // Utiliser partout dans l'app
 * const response = await api.chat(question, userId, sessionId);
 * 
 * // Ou avec destructuring
 * const { answer, ticketCreated, sources } = await api.chat(...);
 * 
 * // Historique
 * const history = await api.getConversationHistory(sessionId);
 * 
 * // Feedback
 * await api.sendFeedback(interactionId, 'UP');
 */

