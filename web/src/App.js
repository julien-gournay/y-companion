import { useMemo } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { Thread } from "./components/assistant-ui/thread";
import "./App.css";

function extractLastUserText(messages) {
  try {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage) return "";

    const textContent = lastUserMessage.content
      .filter((part) => typeof part === "object" && part.type === "text")
      .map((part) => part.text || "")
      .join("\n")
      .trim();

    return textContent;
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

  const runtime = useLocalRuntime(chatModel, {
    initialMessages: [
      {
        role: "assistant",
        content:
          "Salut ! 👋 Je suis Campus Companion, ton assistant pour la vie sur le campus. Comment puis-je t'aider ?",
      },
    ],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="app-root">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}