import { useEffect, useState } from "react";

function checkStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const mediaQuery = window.matchMedia?.("(display-mode: standalone)");

  return Boolean(mediaQuery?.matches || window.navigator.standalone === true);
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => checkStandalone());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");

    const updateStandalone = () => {
      setIsStandalone(checkStandalone());
    };

    updateStandalone();

    if (mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", updateStandalone);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(updateStandalone);
      }
    }

    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", updateStandalone);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(updateStandalone);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <div className="alert alert-info shadow-lg fixed bottom-24 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96 sm:bottom-6">
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-base">MatchBuddy installieren</span>
        <span className="text-sm opacity-80">
          Füge MatchBuddy deinem Startbildschirm hinzu, um jederzeit schnell loszulegen.
        </span>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleDismiss}>
          Später
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleInstall}>
          Installieren
        </button>
      </div>
    </div>
  );
}
