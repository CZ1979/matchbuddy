import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useProfile } from "../hooks/useProfile";

export default function Feedback() {
  const { profile } = useProfile();
  const [values, setValues] = useState({
    name: profile?.fullName || "",
    email: profile?.email || "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      name: prev.name || profile?.fullName || "",
      email: prev.email || profile?.email || "",
    }));
  }, [profile?.email, profile?.fullName]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = values.message.trim();
    if (!trimmedMessage) {
      setError("Bitte gib uns ein kurzes Feedback.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        name: values.name.trim(),
        email: values.email.trim(),
        message: trimmedMessage,
        profileId: profile?.id || null,
        createdAt: serverTimestamp(),
      });
      setSuccess("Vielen Dank für dein Feedback! Wir melden uns bei Rückfragen.");
      setValues((prev) => ({ ...prev, message: "" }));
    } catch (err) {
      console.error("Feedback konnte nicht gespeichert werden:", err);
      setError("Leider hat das Speichern nicht geklappt. Bitte versuche es später noch einmal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Dein Feedback</h1>
        <p className="text-sm text-slate-600">
          Erzähl uns, was gut läuft oder wo wir MatchBuddy noch besser machen können.
        </p>
      </header>

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100/60"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Name (optional)</span>
            <input
              type="text"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Max Mustermann"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>E-Mail (falls Rückfrage)</span>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="trainer@verein.de"
            />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Deine Nachricht</span>
          <textarea
            value={values.message}
            onChange={(event) => updateField("message", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            rows={6}
            placeholder="Was sollen wir verbessern? Welche Funktionen fehlen?"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Wird gesendet…" : "Feedback abschicken"}
        </button>
      </form>
    </div>
  );
}
