import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../firebase";
import ProfileSaveFlow from "../components/ProfileSaveFlow";

export default function Profile() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    club: "",
    phone: "",
    email: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFlowVisible = searchParams.get("saved") === "1";

  // 🔁 Profil aus LocalStorage laden
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("trainerProfile") || "{}");
      if (stored && Object.keys(stored).length > 0) {
        setProfile((prev) => ({ ...prev, ...stored }));
      }
    } catch (error) {
      console.warn("Profil konnte nicht geladen werden:", error);
    }
  }, []);

  // 💾 Speichern (LocalStorage + Firestore)
  const saveProfile = async () => {
    if (!profile.email) {
      toast.error("Bitte eine E-Mail-Adresse angeben.");
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

      toast.success("✅ Profil erfolgreich gespeichert!");
      navigate("/profil?saved=1", { replace: true });
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      toast.error("Profil konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFlowVisible) {
    return (
      <div className="p-4">
        <ProfileSaveFlow onBackToProfile={() => navigate("/profil", { replace: true })} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-primary">Mein Profil</h2>
          <p className="text-sm text-base-content/70 mb-3">
            Gib deine Kontaktdaten ein, damit andere Trainer dich erreichen können.
            Deine E-Mail-Adresse wird zur Zuordnung deiner Spiele verwendet.
          </p>

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
