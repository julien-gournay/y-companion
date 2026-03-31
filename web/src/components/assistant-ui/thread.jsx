import React from "react";
import { ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import "./thread.css";
import { Form } from "./form";
import { FeedbackButtons } from "./feedback-buttons";
import { ArrowUpIcon } from "lucide-react";

export function Thread({ initialSuggestions = [], showForm = false, lastUserQuestion = "" }) {
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

  // Base URL backend Java — jamais window.location.origin pour éviter de récupérer index.html
  const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

  const toAbsoluteUrl = (value) => {
    if (!value || typeof value !== "string") return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
    return `${API_BASE_URL}/${value}`;
  };

  // Télécharge le fichier via fetch+blob pour forcer le vrai binaire PDF
  const handlePdfDownload = async (href, fileName = "document.pdf") => {
    try {
      const response = await fetch(href);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        console.error("Le serveur a renvoyé du HTML au lieu d'un PDF :", href);
        alert("Erreur : le serveur a renvoyé une page HTML. Vérifiez REACT_APP_API_BASE_URL.");
        return;
      }

      // Récupère le nom depuis Content-Disposition si présent
      const disposition = response.headers.get("content-disposition") || "";
      const nameFromHeader =
        disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
          ? decodeURIComponent(disposition.match(/filename\*=UTF-8''([^;]+)/i)[1])
          : disposition.match(/filename="?([^";]+)"?/i)?.[1] || null;

      const finalName = nameFromHeader || fileName;
      const cleanName = finalName.toLowerCase().endsWith(".pdf") ? finalName : `${finalName}.pdf`;

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error("Échec du téléchargement PDF", e);
      alert("Impossible de télécharger le PDF pour le moment.");
    }
  };

  // Extrait le lien de téléchargement depuis le texte du message assistant
  // Priorité : sources[].downloadUrl (injecté par App.js) > regex /api/documents/{id}/download
  const extractDocLink = (text) => {
    if (typeof text !== "string") return null;

    // Cas : lien téléchargeable détecté dans le texte brut
    const apiMatch = text.match(/(\/api\/documents\/\d+\/download)/i);
    if (apiMatch?.[1]) {
      return { href: toAbsoluteUrl(apiMatch[1]), fileName: "document.pdf" };
    }

    return null;
  };

  // Rendu du texte : remplace le chemin /api/... par un bouton "Télécharger le PDF"
  const renderTextWithLinks = (text) => {
    if (typeof text !== "string" || !text.trim()) return text;

    // Découpe le texte autour des chemins /api/documents/{id}/download
    const apiRegex = /(\/api\/documents\/\d+\/download)/gi;

    if (!apiRegex.test(text)) {
      // Pas de lien API : rendu texte normal avec liens http(s) cliquables
      const httpRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(httpRegex);
      return parts.map((part, index) => {
        if (!part) return null;
        if (/^https?:\/\//.test(part)) {
          return (
            <a key={index} href={part} target="_blank" rel="noreferrer"
              style={{ textDecoration: "underline" }}>
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      });
    }

    // Remplace chaque chemin /api/documents/{id}/download par un bouton PDF
    const parts = text.split(/(\/api\/documents\/\d+\/download)/gi);
    return parts.map((part, index) => {
      if (!part) return null;
      if (/^\/api\/documents\/\d+\/download$/i.test(part)) {
        const href = toAbsoluteUrl(part);
        return (
          <button
            key={index}
            type="button"
            onClick={() => handlePdfDownload(href, "document.pdf")}
            style={{
              textDecoration: "underline",
              fontWeight: 600,
              background: "none",
              border: "none",
              padding: "0 2px",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            📄 Télécharger le PDF
          </button>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <ThreadPrimitive.Root className="thread-root">
      <ThreadPrimitive.Viewport className="thread-viewport">
        <h1 className="text-lg font-semibold text-center text-white">Campus Companion</h1>
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
            <>
              <MessagePrimitive.Root className="message-root">
                <div
                  className={`message-bubble ${
                    message.role === "user" ? "message-user" : "message-assistant"
                  }`}
                >
                  <MessagePrimitive.Content
                    components={{
                      Text: ({ text }) => <>{renderTextWithLinks(text)}</>,
                    }}
                  />
                </div>
              </MessagePrimitive.Root>

              {/* Boutons de feedback pour les messages de l'assistant */}
              {message.role === "assistant" && (
                <div className="message-feedback-container">
                  <FeedbackButtons
                    interactionId={message.metadata?.custom?.interactionId}
                  />
                </div>
              )}
            </>

          )}
        </ThreadPrimitive.Messages>

        {/* Formulaire affiché quand l'IA n'a pas trouvé de réponse (ticketCreated=true) */}
        {showForm && (
          <div className="message-root">
            <div className="message-bubble message-assistant" style={{ padding: 0, background: "none", border: "none" }}>
              <Form lastQuestion={lastUserQuestion} />
            </div>
          </div>
        )}

      </ThreadPrimitive.Viewport>


      <div className="thread-composer">
        <ComposerPrimitive.Root className="flex w-full flex-col rounded-3xl border bg-muted">
          <ComposerPrimitive.Input
              placeholder="Écris un message..."
              id="cc-composer-input"
              className="min-h-10 w-full resize-none bg-transparent px-5 pt-4 pb-3 text-sm focus:outline-none"
              rows={1}
          />
          <div className="flex items-center justify-end px-3 pb-3">
            <ComposerPrimitive.Send className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground bg-[#23b2a4] disabled:opacity-30">
              <ArrowUpIcon className="size-4" />
            </ComposerPrimitive.Send>
          </div>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}

