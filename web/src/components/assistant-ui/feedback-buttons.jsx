import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import "./feedback-buttons.css";

export function FeedbackButtons({ interactionId, onFeedbackSent }) {
  const [loading, setLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(null); // "UP" ou "DOWN"
  const [error, setError] = useState(null);

  const handleFeedback = async (feedback) => {
    if (feedbackSent) {
      // Si déjà voté, on ignore
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8080/api/interactions/${interactionId}/feedback`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedback }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de l'envoi du feedback"
        );
      }

      setFeedbackSent(feedback);
      setLoading(false);

      // Callback optionnel pour notifier le parent
      if (onFeedbackSent) {
        onFeedbackSent(feedback);
      }

      // Masquer les boutons après 2 secondes
      setTimeout(() => {
        setFeedbackSent(null);
      }, 2000);
    } catch (err) {
      console.error("Feedback error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (!interactionId) {
    return null; // Ne pas afficher si pas d'interactionId
  }

  return (
    <div className="feedback-buttons-container">
      {/* Message de confirmation */}
      {feedbackSent && (
        <div className="feedback-success">
          {feedbackSent === "UP"
            ? "✅ Merci pour ton avis positif !"
            : "✅ Merci pour ton retour !"}
        </div>
      )}

      {/* Message d'erreur */}
      {error && <div className="feedback-error">❌ {error}</div>}

      {/* Boutons feedback */}
      {!feedbackSent && !error && (
        <div className="feedback-buttons">
          <span className="feedback-label">Était-ce utile ?</span>
          <button
            className="feedback-btn feedback-up"
            onClick={() => handleFeedback("UP")}
            disabled={loading}
            title="Oui, cette réponse a été utile"
          >
            <ThumbsUp size={16} />
            Utile
          </button>
          <button
            className="feedback-btn feedback-down"
            onClick={() => handleFeedback("DOWN")}
            disabled={loading}
            title="Non, cette réponse n'était pas utile"
          >
            <ThumbsDown size={16} />
            Non utile
          </button>
        </div>
      )}
    </div>
  );
}

