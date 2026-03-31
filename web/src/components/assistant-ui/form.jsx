import React, { useState } from "react";
import "./form.css";

export function Form({ lastQuestion = "" }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.target);
        const payload = {
            studentName: formData.get("last_name"),
            studentFirstname: formData.get("first_name"),
            studentClass: formData.get("class"),
            studentEmail: formData.get("email"),
            question: formData.get("question") || lastQuestion,
        };

        try {
            const response = await fetch("http://localhost:8080/api/tickets/fallback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || "Erreur lors de l'envoi du formulaire");
                setLoading(false);
                return;
            }

            setSuccess(true);
            e.target.reset();
            setLoading(false);
            
            // Fermer le formulaire après 3 secondes
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            console.error("Form submission error:", err);
            setError("Erreur de connexion au serveur");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="form-root">
                <h2>✅ Formulaire envoyé avec succès !</h2>
                <p style={{ color: "rgba(35, 178, 164, 1)", marginTop: "10px" }}>
                    L'équipe pédagogique va traiter ta demande. Tu recevras une réponse par email prochainement.
                </p>
            </div>
        );
    }

    return (
        <div className="form-root">
            <h2>⚠ Je ne trouve pas de réponse fiable</h2>
            <p style={{ color: "rgba(255, 153, 0, 0.8)", fontSize: "12px", marginTop: "8px" }}>
                Merci de remplir ce formulaire pour contacter l'équipe pédagogique.
            </p>

            <form onSubmit={handleSubmit} className="no-response-form">
                <input 
                    type="text" 
                    placeholder="Nom" 
                    name="last_name" 
                    required 
                    disabled={loading}
                />
                <input 
                    type="text" 
                    placeholder="Prénom" 
                    name="first_name" 
                    required 
                    disabled={loading}
                />
                <input 
                    type="text" 
                    placeholder="Classe (ex: B3 Dev)" 
                    name="class" 
                    required 
                    disabled={loading}
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    name="email" 
                    required 
                    disabled={loading}
                />
                <input 
                    type="text" 
                    placeholder="Ta question" 
                    name="question" 
                    defaultValue={lastQuestion}
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Envoi en cours..." : "Envoyer à la péda"}
                </button>
                {error && (
                    <div style={{
                        gridColumn: "1 / -1",
                        color: "#ff6b6b",
                        padding: "8px",
                        backgroundColor: "rgba(255, 107, 107, 0.1)",
                        borderRadius: "5px",
                        fontSize: "12px"
                    }}>
                        ❌ {error}
                    </div>
                )}
            </form>
        </div>
    );
}