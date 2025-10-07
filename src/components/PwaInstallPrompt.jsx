import { Fragment, useEffect, useMemo, useState } from "react";

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
  const [isManualGuideOpen, setManualGuideOpen] = useState(false);

  const isDismissWindowActive = useMemo(() => Date.now() < dismissedUntil, [dismissedUntil]);

  const manifestUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URL("/manifest.json", window.location.origin).href;
  }, []);

  const platformGuide = useMemo(() => {
    if (typeof navigator === "undefined") {
      return { title: "MatchBuddy installieren", steps: [] };
    }

    const userAgent = navigator.userAgent || "";
    const isAndroid = /Android/i.test(userAgent);
    const isIos = /iPhone|iPad|iPod/i.test(userAgent);
    const isStandaloneWebApp = isStandalone;

    if (isStandaloneWebApp) {
      return {
        title: "MatchBuddy ist installiert",
        steps: [
          "Öffne MatchBuddy direkt vom Startbildschirm, um schneller loszulegen.",
          "Lege optional ein Widget oder eine Verknüpfung in deinen Favoriten an.",
        ],
      };
    }

    if (isAndroid) {
      return {
        title: "Android: Auf Startbildschirm ablegen",
        steps: [
          "Tippe auf \"Installieren\" und bestätige den Chrome-Dialog.",
          "Nach wenigen Sekunden findest du das MatchBuddy-Symbol in deinem App Drawer.",
          "Ziehe das Symbol bei Bedarf manuell auf den Startbildschirm.",
        ],
      };
    }

    if (isIos) {
      return {
        title: "iOS: Zum Home-Bildschirm hinzufügen",
        steps: [
          "Öffne MatchBuddy in Safari.",
          "Tippe auf das Teilen-Symbol und wähle \"Zum Home-Bildschirm\".",
          "Bestätige mit \"Hinzufügen\" – das MatchBuddy-Icon erscheint auf deinem Homescreen.",
        ],
      };
    }

    return {
      title: "Desktop: App installieren",
      steps: [
        "Klicke auf \"Installieren\" und bestätige die Browser-Abfrage.",
        "Auf macOS findest du MatchBuddy anschließend im Programme-Ordner und im Launchpad.",
        "Auf Windows kannst du die App über das Startmenü anheften.",
      ],
    };
  }, [isStandalone]);

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
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      typeof navigator.getInstalledRelatedApps !== "function" ||
      hasInstalled
    ) {
      return undefined;
    }

    let cancelled = false;

    const checkRelatedApps = async () => {
      try {
        const apps = await navigator.getInstalledRelatedApps();
        if (cancelled) {
          return;
        }

        if (Array.isArray(apps) && apps.some((app) => app.platform === "webapp" && app.url === manifestUrl)) {
          setHasInstalled(true);
          writeLocalStorage(INSTALL_FLAG_KEY, "true");
          clearLocalStorage(DISMISS_UNTIL_KEY);
        }
      } catch (error) {
        console.warn("PWA related apps lookup failed", error);
      }
    };

    checkRelatedApps();

    const intervalId = window.setInterval(checkRelatedApps, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [hasInstalled, manifestUrl]);

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
      setManualGuideOpen(true);
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
        setManualGuideOpen(true);
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

  const canPromptInstall = Boolean(deferredPrompt);

  return (
    <Fragment>
      {isStandalone || hasInstalled || !isVisible || isDismissWindowActive ? null : (
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
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setManualGuideOpen(true)}>
              Anleitung
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleInstall}
              disabled={!canPromptInstall}
            >
              Installieren
            </button>
          </div>
        </div>
      )}

      {isManualGuideOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="card w-full max-w-lg bg-base-100 shadow-2xl">
            <div className="card-body gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="card-title text-lg">{platformGuide.title}</h2>
                  <p className="text-sm opacity-80">
                    Betriebssysteme verlangen eine ausdrückliche Zustimmung, bevor eine Web-App auf dem Startbildschirm landet.
                    Folge den Schritten, damit MatchBuddy dauerhaft verfügbar ist.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  aria-label="Anleitung schließen"
                  onClick={() => setManualGuideOpen(false)}
                >
                  ✕
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-2 text-sm">
                {platformGuide.steps.map((step, index) => (
                  <li key={index} className="leading-snug">
                    {step}
                  </li>
                ))}
              </ol>

              <div className="alert alert-warning text-sm">
                <span>
                  Hinweis: Ohne deine Bestätigung dürfen Browser keine App automatisch installieren. Sobald du den Dialog
                  bestätigt hast, erscheint das MatchBuddy-Symbol auf deinem Gerät.
                </span>
              </div>

              <div className="card-actions justify-end gap-2">
                {!isStandalone && !hasInstalled && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleInstall}
                    disabled={!canPromptInstall}
                  >
                    Installationsdialog öffnen
                  </button>
                )}
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setManualGuideOpen(false)}>
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Fragment>
  );
}
