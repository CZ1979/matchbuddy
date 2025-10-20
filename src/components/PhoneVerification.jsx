import { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";
import { Check, Loader2 } from "lucide-react";

export default function PhoneVerification({ phoneNumber, onVerified, onSkip }) {
  const [step, setStep] = useState("send"); // send | verify | success
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    if (!recaptchaVerifierRef.current && recaptchaRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: "invisible",
          callback: () => {
            // reCAPTCHA gelöst
          },
          "expired-callback": () => {
            setError("reCAPTCHA abgelaufen. Bitte versuche es erneut.");
          },
        });
      } catch (err) {
        console.error("RecaptchaVerifier-Fehler:", err);
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          if (typeof recaptchaVerifierRef.current.clear === "function") {
            recaptchaVerifierRef.current.clear();
          }
        } catch (err) {
          console.error("Fehler beim Bereinigen von RecaptchaVerifier:", err);
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleSendCode = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (!phoneNumber || !phoneNumber.countryCode || !phoneNumber.number) {
        throw new Error("Bitte gib eine gültige Telefonnummer ein.");
      }

      const fullNumber = `${phoneNumber.countryCode}${phoneNumber.number}`;
      
      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA nicht initialisiert. Bitte lade die Seite neu.");
      }

      const confirmation = await signInWithPhoneNumber(auth, fullNumber, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setStep("verify");
    } catch (err) {
      console.error("Fehler beim Senden des Codes:", err);
      
      if (err.code === "auth/invalid-phone-number") {
        setError("Ungültige Telefonnummer. Bitte überprüfe deine Eingabe.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Zu viele Versuche. Bitte versuche es später erneut.");
      } else if (err.code === "auth/quota-exceeded") {
        setError("SMS-Limit erreicht. Bitte versuche es später erneut oder kontaktiere den Support.");
      } else {
        setError(err.message || "Fehler beim Senden des Codes. Bitte versuche es erneut.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Bitte gib den 6-stelligen Code ein.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (!confirmationResult) {
        throw new Error("Keine Bestätigung gefunden. Bitte sende den Code erneut.");
      }

      await confirmationResult.confirm(code);
      setStep("success");
      
      // Kurze Verzögerung für visuelle Rückmeldung
      setTimeout(() => {
        onVerified?.();
      }, 1500);
    } catch (err) {
      console.error("Fehler bei der Code-Verifizierung:", err);
      
      if (err.code === "auth/invalid-verification-code") {
        setError("Ungültiger Code. Bitte überprüfe deine Eingabe.");
      } else if (err.code === "auth/code-expired") {
        setError("Code abgelaufen. Bitte fordere einen neuen Code an.");
        setStep("send");
      } else {
        setError(err.message || "Fehler bei der Verifizierung. Bitte versuche es erneut.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setCode("");
    setError("");
    setConfirmationResult(null);
    setStep("send");
  };

  if (step === "success") {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-emerald-900">Verifizierung erfolgreich!</h3>
          <p className="mt-1 text-sm text-emerald-700">
            Deine Telefonnummer wurde erfolgreich verifiziert.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Telefonnummer verifizieren</h3>
        <p className="text-sm text-slate-600">
          {step === "send"
            ? "Um dein Profil zu vervollständigen, musst du deine Telefonnummer verifizieren."
            : "Gib den 6-stelligen Code ein, den wir dir per SMS gesendet haben."}
        </p>
      </div>

      {step === "send" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-4">
            <p className="text-sm text-slate-700">
              <span className="font-medium">Telefonnummer:</span>{" "}
              {phoneNumber?.countryCode} {phoneNumber?.number}
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Wird gesendet…" : "Code per SMS senden"}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={isLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
            )}
          </div>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bestätigungscode
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setCode(value);
                setError("");
              }}
              placeholder="123456"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-lg tracking-widest focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Wird verifiziert…" : "Code bestätigen"}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Neuen Code anfordern
            </button>
          </div>
        </div>
      )}

      <div ref={recaptchaRef} />
    </div>
  );
}
