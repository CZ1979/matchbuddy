import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import ProfileForm from "../components/forms/ProfileForm";
import { useProfile } from "../hooks/useProfile";
import { toPhoneObject } from "../utils/phone";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-emerald-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white/90 p-8 shadow-xl shadow-emerald-100/80">
        <header className="space-y-5 text-center">
          <img src={logo} alt="MatchBuddy" className="mx-auto h-30 w-auto" />
          <h1 className="text-3xl font-semibold text-slate-900">Erstell dein Trainerprofil</h1>
          <p className="text-base text-slate-600">
            Damit wir dir passende Spiele in deiner Nähe zeigen können.
          </p>
        </header>

        <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Wir speichern deine Daten DSGVO-konform, sicher und einmalig, um passende Spiele zu finden.
        </p>

        {profileCompleted && (
          <p className="mt-4 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-600">
            Du kannst deine Angaben jederzeit aktualisieren. Änderungen wirken sich sofort auf Empfehlungen aus.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6">
          <ProfileForm values={formValues} onChange={setFormValues} onSubmit={handleSubmit} isSaving={isSaving} />
        </div>
      </div>
    </div>
  );
}
