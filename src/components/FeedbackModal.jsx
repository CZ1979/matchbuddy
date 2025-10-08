import { useCallback, useEffect, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { X } from "lucide-react";
import { db } from "../firebase";

export default function FeedbackModal({ open, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const dialogRef = useRef(null);

  const resetForm = useCallback(() => {
    setName("");
    setEmail("");
    setMessage("");
  }, []);

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      resetForm();
      return undefined;
    }
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector("input, textarea, button");
    focusable?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
      if (event.key === "Tab" && dialog) {
        const focusableElements = dialog.querySelectorAll("input, textarea, button");
        const items = Array.from(focusableElements).filter((el) => !el.hasAttribute("disabled"));
        if (items.length === 0) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open, onClose, resetForm]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !email || !message) return;
    setStatus("loading");
    try {
      await addDoc(collection(db, "feedback"), {
        name,
        email,
        message,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      resetForm();
    } catch (error) {
      console.error("Feedback konnte nicht gespeichert werden:", error);
      setStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-emerald-100"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="feedback-modal-title" className="text-xl font-semibold text-slate-900">
              Feedback geben
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Wir freuen uns über deine Ideen, Wünsche oder Bugs – dein Feedback hilft uns MatchBuddy zu verbessern.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-600"
            aria-label="Feedback schließen"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="feedback-name">
              Name
            </label>
            <input
              id="feedback-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="feedback-email">
              E-Mail
            </label>
            <input
              id="feedback-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="feedback-message">
              Deine Nachricht
            </label>
            <textarea
              id="feedback-message"
              required
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {status === "success" && (
              <p className="text-sm font-medium text-emerald-600">Danke! Dein Feedback wurde gespeichert.</p>
            )}
            {status === "error" && (
              <p className="text-sm font-medium text-red-600">Ups! Bitte versuche es gleich noch einmal.</p>
            )}
            <div className="flex flex-1 justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setStatus("idle");
                  onClose?.();
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? "Senden…" : "Feedback senden"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
