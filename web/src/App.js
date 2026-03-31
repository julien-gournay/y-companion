import { useState, useMemo, useRef } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { Thread } from "./components/assistant-ui/thread";
import { Form } from "./components/assistant-ui/form";
import { Header } from "./components/assistant-ui/header";
import "./App.css";

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

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [lastUserQuestion, setLastUserQuestion] = useState("");

  // Refs toujours à jour — accessibles depuis la closure figée du chatModel
  const showFormRef = useRef(setShowForm);
  const lastUserQuestionRef = useRef(setLastUserQuestion);
  showFormRef.current = setShowForm;
  lastUserQuestionRef.current = setLastUserQuestion;

  // chatModel est stable (useMemo []) mais utilise les refs pour les setters
  const chatModel = useMemo(() => ({
    async run({ messages }) {
      try {
        const prompt = extractLastUserText(messages);

        if (!prompt) {
          return {
            content: [{ type: "text", text: "Bonjour ! 👋 Je suis Campus Companion. Pose-moi ta question !" }],
          };
        }

        // Via ref → toujours la version fraîche de setState
        lastUserQuestionRef.current(prompt);

        const conversationHistory = messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => ({
            role: msg.role,
            content: msg.content
              .filter((part) => typeof part === "object" && part.type === "text")
              .map((part) => part.text || "")
              .join("\n"),
          }))
          .filter((msg) => msg.content.trim() !== "");

        const response = await fetch("http://localhost:8080/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: prompt,
            userId: null,
            sessionId: "web-session",
            conversationHistory,
          }),
        });

        if (!response.ok) {
          console.error("API error:", response.status);
          showFormRef.current(false);
          return {
            content: [{ type: "text", text: "Je suis désolé, j'ai eu une erreur en contactant le serveur. Peux-tu réessayer ?" }],
          };
        }

        const data = await response.json();

        console.log("[Campus Companion] ticketCreated:", data.ticketCreated, "| answer:", data.answer);

        // ticketCreated peut être false même si l'IA n'a pas trouvé de réponse (bug backend)
        // On détecte aussi via le texte de réponse
        const noAnswerInText = /(pas trouv[eé]|pas de r[eé]ponse pr[eé]cise|[eé]quipe p[eé]dagogique|renseigner.*pr[eé]nom)/i.test(data.answer || "");
        const shouldShowForm = !!data.ticketCreated || noAnswerInText;

        showFormRef.current(shouldShowForm);

        return {
          content: [{ type: "text", text: data.answer || "Pas de réponse" }],
          metadata: {
            custom: {
              ticketCreated: !!data.ticketCreated,
              suggestions: data.suggestions || [
                "Horaires des cours",
                "Bibliothèque",
                "Restaurants du campus",
                "Événements étudiants",
              ],
              ticketId: data.ticketId,
              interactionId: data.interactionId,
              sources: data.sources || [],
            },
          },
        };
      } catch (error) {
        console.error("Chat model error:", error);
        showFormRef.current(false);
        return {
          content: [{ type: "text", text: "Je suis désolé, j'ai eu une erreur. Peux-tu réessayer ?" }],
        };
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const initialMessagesList = [
    {
      role: "assistant",
      content: "Salut ! 👋 Je suis Campus Companion, ton assistant pour la vie sur le campus. Comment puis-je t'aider ?",
      metadata: {
        custom: {
          suggestions: [
            "Infos pratiques",
            "Horaire du campus",
            "Planning B3 Dev",
            "Contacter l'école",
          ],
        },
      },
    },
  ];

  const suggestionAdapter = useMemo(() => ({
    generate: async (input) => {
      try {
        let lastMessage = null;
        if (!input) {
          lastMessage = null;
        } else if (Array.isArray(input)) {
          lastMessage = input.length ? input[input.length - 1] : null;
        } else if (input.messages && Array.isArray(input.messages)) {
          lastMessage = input.messages.length ? input.messages[input.messages.length - 1] : null;
        } else {
          lastMessage = input;
        }
        const suggestions = lastMessage?.metadata?.custom?.suggestions || [];
        if (Array.isArray(suggestions) && suggestions.length > 0) return suggestions;
        return ["Horaires des cours", "Bibliothèque", "Restaurants du campus", "Événements étudiants"];
      } catch (error) {
        console.error("Error generating suggestions adapter:", error);
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
        return [];
      }
    },
  }), []);

  const runtime = useLocalRuntime(chatModel, {
    initialMessages: initialMessagesList,
    adapters: { suggestion: suggestionAdapter },
  });

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