import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function VerificationBanner({ phoneVerified }) {
  const [dismissed, setDismissed] = useState(false);

  if (phoneVerified || dismissed) {
    return null;
  }

  return (
    <div className="sticky top-16 z-20 border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            Deine Telefonnummer ist noch nicht verifiziert
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Bitte verifiziere deine Telefonnummer, um dein Profil zu vervollständigen und die volle App-Funktionalität zu nutzen.
          </p>
          <Link
            to="/onboarding?edit=1&verify=1"
            className="mt-2 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Jetzt verifizieren
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-amber-600 hover:text-amber-800"
          aria-label="Banner schließen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
