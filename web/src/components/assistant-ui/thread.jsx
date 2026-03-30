import { ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import "./thread.css";

export function Thread() {
  return (
    <ThreadPrimitive.Root className="thread-root">
      <ThreadPrimitive.Viewport className="thread-viewport">
        <ThreadPrimitive.Empty className="thread-empty">
          <p>Commence la conversation</p>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages>
          {({ message }) => (
            <MessagePrimitive.Root className="message-root">
              <div
                className={`message-bubble ${
                  message.role === "user" ? "message-user" : "message-assistant"
                }`}
              >
                <MessagePrimitive.Parts />
              </div>
            </MessagePrimitive.Root>
          )}
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <div className="thread-composer">
        <ComposerPrimitive.Root className="composer-root">
          <ComposerPrimitive.Input
            className="composer-input"
            placeholder="Écris un message..."
            rows={1}
          />
          <ComposerPrimitive.Send className="composer-send">
            Envoyer
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}



