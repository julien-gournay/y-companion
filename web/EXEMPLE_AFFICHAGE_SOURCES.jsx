/**
 * 🎯 Exemple - Comment afficher les sources si besoin
 * 
 * Les sources sont gardées dans metadata.custom.sources
 * Vous pouvez les afficher avec un bouton "Afficher les sources" ou un composant dédié
 */

// ============================================
// Option 1 : Bouton "Afficher les sources"
// ============================================

import React, { useState } from "react";

export function MessageWithSourcesToggle({ message }) {
  const [showSources, setShowSources] = useState(false);
  const sources = message.metadata?.custom?.sources || [];

  return (
    <div className="message-container">
      {/* Réponse principale */}
      <div className="message-text">
        {message.content.map((part, idx) =>
          part.type === "text" ? (
            <p key={idx}>{part.text}</p>
          ) : null
        )}
      </div>

      {/* Bouton "Afficher les sources" si sources disponibles */}
      {sources && sources.length > 0 && (
        <button
          className="sources-toggle"
          onClick={() => setShowSources(!showSources)}
        >
          {showSources ? "🔽 Masquer les sources" : "📚 Afficher les sources"}
        </button>
      )}

      {/* Sources affichées conditionnellement */}
      {showSources && sources.length > 0 && (
        <div className="sources-panel">
          <h4>📚 Sources utilisées :</h4>
          <ul>
            {sources.map((source, idx) => (
              <li key={idx}>
                <strong>{source.title}</strong>
                {source.tags && <span className="tags"> ({source.tags})</span>}
                {source.downloadUrl && (
                  <a
                    href={source.downloadUrl}
                    className="download-link"
                    download
                  >
                    ⬇️ Télécharger
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================
// Option 2 : Composant Sources Collapsible
// ============================================

export function SourcesPanel({ sources }) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <details className="sources-collapsible">
      <summary>📚 Sources utilisées ({sources.length})</summary>
      <ul className="sources-list">
        {sources.map((source, idx) => (
          <li key={idx} className="source-item">
            <div className="source-title">{source.title}</div>
            {source.tags && (
              <div className="source-tags">
                {source.tags.split(",").map((tag, i) => (
                  <span key={i} className="tag">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            {source.downloadUrl && (
              <a href={source.downloadUrl} className="source-download" download>
                ⬇️ Télécharger
              </a>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

// ============================================
// Option 3 : Intégration dans Thread.jsx
// ============================================

/**
 * Dans src/components/assistant-ui/thread.jsx
 * 
 * Remplacer le rendu du message par :
 */

function ThreadWithSources({ initialSuggestions = [], showForm = false }) {
  return (
    <ThreadPrimitive.Root className="thread-root">
      <ThreadPrimitive.Viewport className="thread-viewport">
        <ThreadPrimitive.Messages>
          {({ message }) => (
            <MessagePrimitive.Root className="message-root">
              <div
                className={`message-bubble ${
                  message.role === "user" ? "message-user" : "message-assistant"
                }`}
              >
                <MessagePrimitive.Parts />
                
                {/* Afficher les sources si c'est une réponse IA */}
                {message.role === "assistant" && (
                  <SourcesPanel 
                    sources={message.metadata?.custom?.sources} 
                  />
                )}
              </div>
            </MessagePrimitive.Root>
          )}
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

// ============================================
// CSS pour les sources
// ============================================

/*
.sources-panel {
  margin-top: 12px;
  padding: 12px;
  background-color: rgba(35, 178, 164, 0.1);
  border-left: 3px solid rgb(35, 178, 164);
  border-radius: 4px;
  font-size: 12px;
}

.sources-panel h4 {
  margin: 0 0 8px 0;
  color: rgb(35, 178, 164);
  font-weight: 600;
}

.sources-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sources-panel li {
  padding: 6px 0;
  color: rgba(255, 255, 255, 0.8);
}

.download-link {
  display: inline-block;
  margin-left: 8px;
  color: rgb(35, 178, 164);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.download-link:hover {
  opacity: 0.7;
}

.sources-toggle {
  display: block;
  margin-top: 12px;
  padding: 8px 12px;
  background-color: rgba(35, 178, 164, 0.2);
  border: 1px solid rgba(35, 178, 164, 0.5);
  border-radius: 4px;
  color: rgb(35, 178, 164);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.sources-toggle:hover {
  background-color: rgba(35, 178, 164, 0.3);
}

.sources-collapsible {
  margin-top: 12px;
  padding: 12px;
  background-color: rgba(35, 178, 164, 0.1);
  border-radius: 4px;
  cursor: pointer;
}

.sources-collapsible summary {
  color: rgb(35, 178, 164);
  font-weight: 600;
  user-select: none;
}

.sources-list {
  list-style: none;
  padding: 12px 0 0 0;
  margin: 0;
}

.source-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(35, 178, 164, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.source-item:last-child {
  border-bottom: none;
}

.source-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  background-color: rgba(35, 178, 164, 0.3);
  border-radius: 3px;
  font-size: 10px;
}

.source-download {
  display: inline-block;
  margin-top: 4px;
  color: rgb(35, 178, 164);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.source-download:hover {
  opacity: 0.7;
}
*/

// ============================================
// Résumé
// ============================================

/**
 * Les sources sont actuellement MASQUÉES dans l'affichage
 * mais disponibles dans : message.metadata?.custom?.sources
 * 
 * Pour les afficher :
 * 1. Option 1 : Bouton toggle "Afficher les sources"
 * 2. Option 2 : <details> collapsible
 * 3. Option 3 : Intégration directe dans le composant Message
 * 
 * À adapter selon votre design et vos préférences UI/UX
 */

