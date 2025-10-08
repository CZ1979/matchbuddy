// src/components/ProfileSaveFlow.js
// Small confirmation panel displayed after saving the trainer profile (no JSX to keep .js extension compatible).

import React from "react";
import { Link } from "react-router-dom";

export default function ProfileSaveFlow({ onBackToProfile }) {
  const actionButtons = React.createElement(
    "div",
    { className: "grid w-full gap-3 sm:grid-cols-2" },
    React.createElement(
      Link,
      { to: "/neues-spiel", className: "btn btn-primary w-full" },
      "👉 Jetzt neues Spiel anlegen"
    ),
    React.createElement(
      Link,
      { to: "/spiele", className: "btn btn-outline w-full" },
      "🔍 Oder Spiel suchen"
    )
  );

  const backButton = onBackToProfile
    ? React.createElement(
        "button",
        {
          type: "button",
          onClick: onBackToProfile,
          className: "btn btn-ghost btn-sm",
        },
        "Profil weiter bearbeiten"
      )
    : null;

  return React.createElement(
    "div",
    { className: "mx-auto max-w-xl pt-10" },
    React.createElement(
      "div",
      { className: "card bg-base-100 shadow-xl" },
      React.createElement(
        "div",
        { className: "card-body items-center space-y-4 text-center" },
        React.createElement("span", { className: "text-4xl" }, "✅"),
        React.createElement(
          "h2",
          { className: "card-title text-2xl text-primary" },
          "Profil gespeichert!"
        ),
        React.createElement(
          "p",
          { className: "text-base-content/70" },
          "Super! Wähle jetzt deinen nächsten Schritt aus und lege direkt los."
        ),
        actionButtons,
        backButton
      )
    )
  );
}
