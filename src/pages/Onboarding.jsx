import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import ProfileForm from "../components/forms/ProfileForm";
import { useProfile } from "../hooks/useProfile";
import { toPhoneObject } from "../utils/phone";
import { Info } from "lucide-react";

const toInitialValues = (profile) => {
  const phoneObj = toPhoneObject(
    profile?.phone || {
      countryCode: profile?.phoneCountryCode,
      number: profile?.phoneNumber,
    }
  );

  return {
    name: profile?.fullName || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "",
    club: profile?.club || "",
    city: profile?.city || "",
    email: profile?.email || profile?.id || "",
    phone: phoneObj,
    ageGroups: Array.isArray(profile?.ageGroups) ? profile.ageGroups : [],
  };
};

export default function Onboarding() {
  const { profile, saveProfile, isSaving, profileCompleted } = useProfile();
  const [formValues, setFormValues] = useState(() => toInitialValues(profile));
  const [error, setError] = useState("");
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setFormValues(toInitialValues(profile));
  }, [profile]);

  const handleSubmit = async () => {
    setError("");
    try {
      await saveProfile(formValues, { geocode: true });
      if (!(location.state && location.state.from?.pathname === "/neues-spiel")) {
        navigate("/feed", { replace: true });
      } else {
        navigate(location.state.from.pathname, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError("Profil konnte nicht gespeichert werden. Bitte überprüfe deine Angaben.");
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-emerald-50 px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl bg-white/90 p-8 shadow-xl shadow-emerald-100/80">
          <header className="space-y-5 text-center">
            <div className="flex items-center justify-center gap-3">
              <img src={logo} alt="MatchBuddy" className="mx-auto h-30 w-auto" />
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-500 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label="Mehr Informationen zu Matchbuddy anzeigen"
              >
                <Info className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">Erstell dein Trainerprofil</h1>
            <p className="text-base text-slate-600">
              Damit wir dir passende Spiele in deiner Nähe zeigen können.
            </p>
          </header>

          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Wir speichern deine Daten DSGVO-konform, sicher und einmalig, um passende Spiele zu finden.
          </p>

          {error && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-6">
            <ProfileForm values={formValues} onChange={setFormValues} onSubmit={handleSubmit} isSaving={isSaving} />
          </div>
        </div>
      </div>
      {isInfoModalOpen && <InfoModal onClose={() => setIsInfoModalOpen(false)} />}
    </>
  );
}

function InfoModal({ onClose }) {
  const closeButtonRef = useRef(null);
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!modalRoot) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalRoot, onClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  if (!modalRoot) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="matchbuddy-info-modal-title"
    >
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          aria-label="Modal schließen"
        >
          ×
        </button>

        <div className="space-y-3">
          <h2 id="matchbuddy-info-modal-title" className="text-2xl font-semibold text-emerald-600">
            Die Idee von Matchbuddy
          </h2>
          <p className="text-sm text-slate-600">
            Die meisten suchen ihre Spiele über verschiedene WhatsApp-Gruppen - Das klappt manchmal, ist aber oft ziemlich chaotisch.</p>
          <p className="text-sm text-slate-600">Matchbuddy sorgt für mehr Übersicht und hilft beim Finden.</p>
          <p className="text-sm text-slate-600">
            Alles Weitere läuft dann wie gewohnt persönlich über WhatsApp.
          </p>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
