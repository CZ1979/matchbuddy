import { useEffect, useMemo, useState } from "react";

const INSTALL_FLAG_KEY = "matchbuddy:pwa-installed";
const DISMISS_UNTIL_KEY = "matchbuddy:pwa-dismissed-until";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 3; // 3 Tage Ruhe nach "Später"

function checkStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const mediaQuery = window.matchMedia?.("(display-mode: standalone)");

  return Boolean(mediaQuery?.matches || window.navigator.standalone === true);
}

function readBooleanFlag(key) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === "true";
  } catch (error) {
    console.warn("PWA localStorage access failed", error);
    return false;
  }
}

function readNumber(key) {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(key);
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch (error) {
    console.warn("PWA localStorage access failed", error);
    return 0;
  }
}

function writeLocalStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("PWA localStorage write failed", error);
  }
}

function clearLocalStorage(key) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("PWA localStorage clear failed", error);
  }
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => checkStandalone());
  const [hasInstalled, setHasInstalled] = useState(() => readBooleanFlag(INSTALL_FLAG_KEY));
  const [dismissedUntil, setDismissedUntil] = useState(() => readNumber(DISMISS_UNTIL_KEY));

  const isDismissWindowActive = useMemo(() => Date.now() < dismissedUntil, [dismissedUntil]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");

    const updateStandalone = () => {
      const standalone = checkStandalone();
      setIsStandalone(standalone);
      if (standalone) {
        setHasInstalled(true);
        writeLocalStorage(INSTALL_FLAG_KEY, "true");
        clearLocalStorage(DISMISS_UNTIL_KEY);
      }
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
    if (typeof window === "undefined" || isStandalone || hasInstalled) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      if (isDismissWindowActive) {
        return;
      }

      event.preventDefault();
      setDeferredPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      setHasInstalled(true);
      writeLocalStorage(INSTALL_FLAG_KEY, "true");
      clearLocalStorage(DISMISS_UNTIL_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [hasInstalled, isStandalone, isDismissWindowActive]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setHasInstalled(true);
        writeLocalStorage(INSTALL_FLAG_KEY, "true");
        clearLocalStorage(DISMISS_UNTIL_KEY);
      } else {
        const nextAllowed = Date.now() + DISMISS_DURATION_MS;
        setDismissedUntil(nextAllowed);
        writeLocalStorage(DISMISS_UNTIL_KEY, String(nextAllowed));
      }
    } catch (error) {
      console.warn("PWA install prompt failed", error);
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    const nextAllowed = Date.now() + DISMISS_DURATION_MS;
    setDismissedUntil(nextAllowed);
    writeLocalStorage(DISMISS_UNTIL_KEY, String(nextAllowed));
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (isStandalone || hasInstalled || !isVisible || isDismissWindowActive) {
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
