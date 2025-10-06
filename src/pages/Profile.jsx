import React, { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function Profile() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    club: "",
    phone: "",
    email: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // 🔁 Profil aus LocalStorage laden
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("trainerProfile") || "{}");
    if (stored.email) setProfile(stored);
  }, []);

  // 💾 Speichern (LocalStorage + Firestore)
  const saveProfile = async () => {
    if (!profile.email) {
      alert("Bitte eine E-Mail-Adresse angeben.");
      return;
    }

    setIsSaving(true);
    try {
      // LocalStorage sichern
      localStorage.setItem("trainerProfile", JSON.stringify(profile));
      localStorage.setItem("trainerEmail", profile.email);

      // Optional Firestore speichern
      const ref = doc(db, "profiles", profile.email);
      await setDoc(ref, {
        ...profile,
        updatedAt: serverTimestamp(),
      });

      setSavedMsg("Profil erfolgreich gespeichert!");
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Profil konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-primary">Mein Profil</h2>
          <p className="text-sm text-base-content/70 mb-3">
            Gib deine Kontaktdaten ein, damit andere Trainer dich erreichen können.
            Deine E-Mail-Adresse wird zur Zuordnung deiner Spiele verwendet.
          </p>

          {savedMsg && (
            <div className="alert alert-success text-sm py-2 mb-3">
              {savedMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              placeholder="Vorname"
              className="input input-bordered w-full"
              value={profile.firstName}
              onChange={(e) =>
                setProfile((s) => ({ ...s, firstName: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="Nachname"
              className="input input-bordered w-full"
              value={profile.lastName}
              onChange={(e) =>
                setProfile((s) => ({ ...s, lastName: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="Verein"
              className="input input-bordered w-full"
              value={profile.club}
              onChange={(e) => setProfile((s) => ({ ...s, club: e.target.value }))}
            />
           <input
              type="tel"
              placeholder="Telefon (z. B. +49 176 1234567)"
              className="input input-bordered w-full"
              value={profile.phone}
              onChange={(e) => {
                let val = e.target.value.trim();
                // Einheitlich +49
                if (val.startsWith("0049")) val = "+" + val.slice(2);
                if (val.startsWith("0") && !val.startsWith("+49")) val = "+49" + val.slice(1);
                setProfile((s) => ({ ...s, phone: val }));
              }}
            />

            <input
              type="email"
              placeholder="E-Mail-Adresse"
              className="input input-bordered w-full"
              value={profile.email}
              onChange={(e) => setProfile((s) => ({ ...s, email: e.target.value }))}
            />

            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="btn btn-primary w-full mt-4"
            >
              {isSaving ? "Speichern..." : "Profil speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
