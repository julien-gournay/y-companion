/**
 * 📌 EXEMPLE D'INTÉGRATION COMPLÈTE
 * 
 * Fichier: src/App_AVEC_SERVICE.js
 * 
 * ⚠️ C'est un exemple optionnel montrant comment utiliser le service API
 * Vous pouvez soit:
 * 1. Refactoriser graduellement App.js
 * 2. Créer un nouveau fichier App_v2.js
 * 3. Rester avec l'intégration actuelle (App.js)
 */

import { useState, useMemo } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import CampusCompanionAPI from "./services/api";
import { Thread } from "./components/assistant-ui/thread";
import { Form } from "./components/assistant-ui/form";
import { Header } from "./components/assistant-ui/header";
import "./App.css";

// ============================================
// 🔌 Initialiser le service API
// ============================================
const api = new CampusCompanionAPI(
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
);

// ============================================
// 🛠️ Utilitaires
// ============================================

function extractLastUserText(messages) {
  try {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage) return "";

    return lastUserMessage.content
      .filter((part) => typeof part === "object" && part.type === "text")
      .map((part) => part.text || "")
      .join("\n")
      .trim();
  } catch (error) {
    console.error("Error extracting user text:", error);
    return "";
  }
}

// ============================================
// 📱 Composant principal
// ============================================

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [lastUserQuestion, setLastUserQuestion] = useState("");
  const [sessionId] = useState(() => {
    // Générer un sessionId unique (optionnel - voir AMELIORATIONS_API.js)
    return "web-session"; // À remplacer par uuidv4()
  });

  // ============================================
  // 🤖 Chat Model - Utilise le service API
  // ============================================

  const chatModel = useMemo(
    () => ({
      async run({ messages }) {
        try {
          const prompt = extractLastUserText(messages);

          if (!prompt) {
            return {
              content: [
                {
                  type: "text",
                  text: "Bonjour ! 👋 Je suis Campus Companion. Pose-moi ta question !",
                },
              ],
            };
          }

          // 📍 Sauvegarder la question
          setLastUserQuestion(prompt);

          // 📍 APPEL API VIA LE SERVICE
          const response = await api.chat(prompt, null, sessionId);

          // 📍 Gérer les tickets
          if (response.ticketCreated) {
            setShowForm(true);
          } else {
            setShowForm(false);
          }

          // 📍 Formater la réponse avec sources
          let fullAnswer = response.answer || "Pas de réponse";

          if (response.sources && response.sources.length > 0) {
            fullAnswer += "\n\n📚 Sources:";
            response.sources.forEach((source) => {
              fullAnswer += `\n• ${source.title}`;
              if (source.downloadUrl) {
                fullAnswer += ` [Télécharger](${source.downloadUrl})`;
              }
            });
          }

          return {
            content: [{ type: "text", text: fullAnswer }],
            metadata: {
              custom: {
                suggestions: response.suggestions || [
                  "Horaires des cours",
                  "Bibliothèque",
                  "Restaurants du campus",
                  "Événements étudiants",
                ],
                ticketId: response.ticketId,
                interactionId: response.interactionId,
              },
            },
          };
        } catch (error) {
          console.error("Chat error:", error);
          setShowForm(false);

          return {
            content: [
              {
                type: "text",
                text: `Je suis désolé, j'ai eu une erreur: ${error.message}`,
              },
            ],
          };
        }
      },
    }),
    [sessionId]
  );

  // ============================================
  // 💡 Suggestion Adapter
  // ============================================

  const initialMessagesList = [
    {
      role: "assistant",
      content:
        "Salut ! 👋 Je suis Campus Companion, ton assistant pour la vie sur le campus. Comment puis-je t'aider ?",
      metadata: {
        custom: {
          suggestions: [
            "Infos pratiques",
            "Services campus",
            "Questions fréquentes",
            "Contact support",
          ],
        },
      },
    },
  ];

  const suggestionAdapter = useMemo(
    () => ({
      generate: async (input) => {
        try {
          let lastMessage = null;

          if (!input) {
            lastMessage = null;
          } else if (Array.isArray(input)) {
            if (input.length === 0 && Array.isArray(initialMessagesList) && initialMessagesList.length > 0) {
              lastMessage = initialMessagesList[initialMessagesList.length - 1];
            } else {
              lastMessage = input.length ? input[input.length - 1] : null;
            }
          } else if (input.messages && Array.isArray(input.messages)) {
            lastMessage = input.messages.length ? input.messages[input.messages.length - 1] : null;
          } else {
            lastMessage = input;
          }

          const suggestions = lastMessage?.metadata?.custom?.suggestions || [];

          if (Array.isArray(suggestions) && suggestions.length > 0) return suggestions;

          const runtimeInitial = (input && input.initialMessages) || initialMessagesList || null;
          if (Array.isArray(runtimeInitial) && runtimeInitial.length > 0) {
            const lastA = [...runtimeInitial].reverse().find((m) => m.role === 'assistant');
            const list = lastA?.metadata?.custom?.suggestions || [];
            if (list.length) return list;
          }

          return [
            'Horaires des cours',
            'Bibliothèque',
            'Restaurants du campus',
            'Événements étudiants',
          ];
        } catch (error) {
          console.error('Error generating suggestions adapter:', error);
          return [];
        }
      },
      getSuggestions: async (maybeMessages) => {
        try {
          if (Array.isArray(maybeMessages)) {
            const last = maybeMessages.length ? maybeMessages[maybeMessages.length - 1] : null;
            return last?.metadata?.custom?.suggestions || [];
          }
          return [];
        } catch (e) {
          console.error('getSuggestions adapter error', e);
          return [];
        }
      },
    }),
    [initialMessagesList]
  );

  // ============================================
  // 🚀 Runtime
  // ============================================

  const runtime = useLocalRuntime(chatModel, {
    initialMessages: initialMessagesList,
    adapters: {
      suggestion: suggestionAdapter,
    },
  });

  // ============================================
  // 🎨 Render
  // ============================================

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="app-root">
        <Thread
          initialSuggestions={initialMessagesList[0].metadata.custom.suggestions}
          showForm={showForm}
          lastUserQuestion={lastUserQuestion}
        />
      </div>
    </AssistantRuntimeProvider>
  );
}

// ============================================
// 📚 FONCTIONS UTILITAIRES SUPPLÉMENTAIRES
// ============================================

/**
 * Récupérer l'historique de la conversation
 */
export async function loadConversationHistory(sessionId) {
  try {
    const history = await api.getConversationHistory(sessionId);
    console.log('Historique chargé:', history);
    return history;
  } catch (error) {
    console.error('Erreur chargement historique:', error);
    return [];
  }
}

/**
 * Envoyer un feedback sur une réponse
 */
export async function submitFeedback(interactionId, isPositive) {
  try {
    await api.sendFeedback(interactionId, isPositive ? 'UP' : 'DOWN');
    console.log('Feedback envoyé !');
  } catch (error) {
    console.error('Erreur feedback:', error);
  }
}

/**
 * Uploader un document
 */
export async function uploadNewDocument(file, title, tags) {
  try {
    const result = await api.uploadDocument(file, title, tags, '', true);
    console.log('Document uploadé:', result);
    return result;
  } catch (error) {
    console.error('Erreur upload:', error);
  }
}

/**
 * Injecter du contenu dans la KB
 */
export async function addToKnowledgeBase(title, tags, content) {
  try {
    const result = await api.ingestKnowledge(title, tags, content);
    console.log('KB mise à jour:', result);
    return result;
  } catch (error) {
    console.error('Erreur KB:', error);
  }
}

export { api }; // Exporter pour utiliser dans d'autres composants

