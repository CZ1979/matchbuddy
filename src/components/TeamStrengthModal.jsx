import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import TeamStrengthLegend from "./TeamStrengthLegend";

// LEGEND MODAL REFACTOR
export default function TeamStrengthModal({ onClose }) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const titleRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setIsVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    // LEGEND MODAL REFACTOR
    setIsVisible(false);
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, closeModal]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, [mounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (typeof document === "undefined" || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center px-4 py-6",
        "transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-strength-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={closeModal}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-3xl">
        <div className="relative flex max-h-[80vh] flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
            aria-label="Modal schließen"
          >
            ×
          </button>

          <div className="space-y-2 pr-4">
            <h2
              id="team-strength-modal-title"
              ref={titleRef}
              tabIndex={-1}
              className="text-2xl font-semibold text-emerald-700 focus:outline-none"
            >
              🏆 Teamstärke-Legende
            </h2>
            <p className="text-sm text-slate-600">
              Hilft dir, euer Niveau realistisch einzuschätzen – damit faire Matches entstehen.
            </p>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-2">
            <TeamStrengthLegend
              showHeading={false}
              className="border-none bg-transparent p-0 shadow-none rounded-none"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
