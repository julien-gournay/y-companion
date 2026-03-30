import React from "react";
import "./form.css";

export function Form() {
    return (
        <div className="form-root">
            <h2>⚠ Je ne trouve pas de réponse fiable</h2>

            <form method="POST" className="no-response-form">
                <input type="text" placeholder="Nom" />
                <input type="text" placeholder="Prénom" />
                <input type="text" placeholder="Classe" />
                <input type="text" placeholder="Email" />
                <button type="submit">Envoyer à la péda</button>
            </form>
        </div>
    );
}