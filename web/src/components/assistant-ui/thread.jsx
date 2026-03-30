import React from "react";
import { ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import "./thread.css";
import { Form } from "./form";

export function Thread({ initialSuggestions = [], showForm = false }) {
  const topSuggestions =
    Array.isArray(initialSuggestions) && initialSuggestions.length > 0
      ? initialSuggestions
      : [
        "Horaires des cours",
        "Bibliothèque",
        "Restaurants du campus",
        "Événements étudiants",
      ];

  const handleSuggestionClick = (text) => {
    try {
      const nextText = typeof text === "string" ? text.trim() : "";
      if (!nextText) return;

      const input = document.getElementById("cc-composer-input");
      const sendBtn = document.getElementById("cc-composer-send");
      if (!input) return;

      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(input, nextText);
      } else {
        input.value = nextText;
      }

      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();

      requestAnimationFrame(() => {
        const form = input.closest("form");
        if (form && typeof form.requestSubmit === "function") {
          form.requestSubmit();
          return;
        }

        if (sendBtn) sendBtn.click();
      });
    } catch (e) {
      console.error("Suggestion click failed", e);
    }
  };

  return (
    <ThreadPrimitive.Root className="thread-root">
      <ThreadPrimitive.Viewport className="thread-viewport">
        <ThreadPrimitive.Empty className="thread-empty">
          <div className="empty-content">
            <p className="empty-title">Bienvenue sur Campus Companion</p>
            <p className="empty-subtitle">Pose-moi une question pour commencer</p>
          </div>
        </ThreadPrimitive.Empty>

        {/* Affiche les suggestions lues depuis l'adaptateur runtime ou metadata */}
        {topSuggestions && topSuggestions.length > 0 ? (
          <div className="suggestions-top" role="list" aria-label="Suggestions">
            {topSuggestions.map((s, i) => (
              <button key={i} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="suggestions-top suggestions-empty" aria-hidden="true">
            <span className="suggestions-hint">Aucune suggestion pour le moment</span>
          </div>
        )}

        <ThreadPrimitive.Messages>
          {({ message }) => (
            <MessagePrimitive.Root className="message-root">
              <div
                className={`message-bubble ${message.role === "user" ? "message-user" : "message-assistant"
                  }`}
              >
                <MessagePrimitive.Parts />
              </div>
            </MessagePrimitive.Root>
          )}
        </ThreadPrimitive.Messages>

      </ThreadPrimitive.Viewport>

      {showForm && (
        <Form />
      )}

      <div className="thread-composer">
        <ComposerPrimitive.Root className="composer-root">
          <ComposerPrimitive.Input
            id="cc-composer-input"
            className="composer-input"
            placeholder="Écris un message..."
            rows={1}
          />
          <ComposerPrimitive.Send id="cc-composer-send" className="composer-send">
            Envoyer
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}

