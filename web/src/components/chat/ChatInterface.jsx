import { useMemo } from 'react';
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react';
import './ChatInterface.css';

function extractLastUserText(messages) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');

  if (!lastUserMessage) return '';

  return lastUserMessage.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function DemoMessage({ role }) {
  const bubbleClassName =
    role === 'user' ? 'cc-bubble cc-bubble-user' : 'cc-bubble cc-bubble-assistant';

  return (
    <MessagePrimitive.Root className="cc-message-row">
      <div className={bubbleClassName}>
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

export function ChatInterface() {
  const chatModel = useMemo(
    () => ({
      async run({ messages }) {
        const prompt = extractLastUserText(messages);

        const reply = prompt
          ? `J'ai bien recu: "${prompt}".\n\nJe suis ton assistant campus (mode demo local assistant-ui).`
          : 'Bonjour. Je suis ton assistant campus. Pose-moi ta question !';

        return {
          content: [{ type: 'text', text: reply }],
        };
      },
    }),
    []
  );

  const runtime = useLocalRuntime(chatModel, {
    initialMessages: [
      {
        role: 'assistant',
        content: 'Salut ! Je suis pret a t\'aider pour la vie sur le campus. Que veux-tu savoir ?',
      },
    ],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <section className="cc-shell" aria-label="Chatbot campus">
        <header className="cc-header">Campus Companion</header>

        <ThreadPrimitive.Root className="cc-thread">
          <ThreadPrimitive.Viewport className="cc-viewport">
            <ThreadPrimitive.If empty>
              <div className="cc-empty">Commence la conversation en bas de page.</div>
            </ThreadPrimitive.If>

            <ThreadPrimitive.Messages>
              {({ message }) => <DemoMessage role={message.role} />}
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>

          <ComposerPrimitive.Root className="cc-composer">
            <ComposerPrimitive.Input
              className="cc-input"
              placeholder="Ecris un message..."
              rows={1}
            />
            <ComposerPrimitive.Send className="cc-send">Envoyer</ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>
      </section>
    </AssistantRuntimeProvider>
  );
}
