import { useMemo } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { Thread } from "./components/assistant-ui/thread";
import { Form } from "./components/assistant-ui/form";
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
  const chatModel = useMemo(
    () => ({
      async run({ messages }) {
        try {
          const prompt = extractLastUserText(messages);

          const reply = prompt
            ? `J'ai reçu: "${prompt}"\n\nJe suis ton assistant campus. Comment puis-je t'aider ?`
            : "Bonjour ! 👋 Je suis Campus Companion. Pose-moi ta question !";

          // Simule un délai réseau
          await new Promise((resolve) => setTimeout(resolve, 500));

          return {
            content: [{ type: "text", text: reply }],
            metadata: {
              custom: {
                suggestions: [
                  "Horaires des cours",
                  "Bibliothèque",
                  "Restaurants du campus",
                  "Événements étudiants",
                ],
              },
            },
          };
        } catch (error) {
          console.error("Chat model error:", error);
          return {
            content: [
              {
                type: "text",
                text: "Je suis désolé, j'ai eu une erreur. Peux-tu réessayer ?",
              },
            ],
          };
        }
      },
    }),
    []
  );

  // expose initial messages list so adapters can fallback to it if needed
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
          // Normalize input: can be a single message, an array of messages, or an object with messages
          let lastMessage = null;

          if (!input) {
            lastMessage = null;
          } else if (Array.isArray(input)) {
            // if messages array is empty, fallback to initialMessagesList
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

          // No suggestions found -> try to fallback to initial runtime messages if provided
          const runtimeInitial = (input && input.initialMessages) || initialMessagesList || null;
          if (Array.isArray(runtimeInitial) && runtimeInitial.length > 0) {
            const lastA = [...runtimeInitial].reverse().find((m) => m.role === 'assistant');
            const list = lastA?.metadata?.custom?.suggestions || [];
            if (list.length) return list;
          }

          // Final fallback
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

  const runtime = useLocalRuntime(chatModel, {
    initialMessages: initialMessagesList,
    adapters: {
      suggestion: suggestionAdapter,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="app-root">
        <Thread initialSuggestions={initialMessagesList[0].metadata.custom.suggestions} />
      </div>

    </AssistantRuntimeProvider>
  );
}