import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // 🔹 nutzt deine bestehende Firebase-Initialisierung

export default function FeedbackModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // "", "sending", "success", "error"

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      await addDoc(collection(db, "feedback"), {
        name,
        email,
        message,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Fehler beim Speichern des Feedbacks:", error);
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-xl shadow-lg p-6 w-11/12 max-w-md relative">
        {/* Schließen-Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
          aria-label="Schließen"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4 text-center text-primary">
          Dein Feedback 💬
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Dein Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            required
          />

          <input
            type="email"
            placeholder="Deine E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full"
            required
          />

          <textarea
            placeholder="Dein Feedback..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="textarea textarea-bordered w-full h-32"
            required
          ></textarea>

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={status === "sending"}
            >
              Abbrechen
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Senden..." : "Abschicken"}
            </button>
          </div>
        </form>

        {/* Statusmeldungen */}
        {status === "success" && (
          <p className="text-green-600 text-center text-sm mt-3">
            Danke für dein Feedback! 🙌
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600 text-center text-sm mt-3">
            Es ist ein Fehler aufgetreten. Bitte versuche es erneut 😕
          </p>
        )}
      </div>
    </div>
  );
}
