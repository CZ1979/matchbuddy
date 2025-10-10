import { createPortal } from "react-dom";
import { useEffect, useId, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function BottomSheet({ open, onClose, title, children, footer }) {
  const overlayRef = useRef(null);
  const sheetRef = useRef(null);
  const lastActiveRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    lastActiveRef.current = document.activeElement;
    const sheet = sheetRef.current;
    const focusSheet = () => {
      if (!sheet) return;
      if (typeof sheet.focus === "function") {
        sheet.focus({ preventScroll: true });
      }
    };
    const timeout = window.setTimeout(focusSheet, 20);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = sheet.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const handleFocus = (event) => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      if (!sheet.contains(event.target)) {
        event.stopPropagation();
        if (typeof sheet.focus === "function") {
          sheet.focus({ preventScroll: true });
        }
      }
    };
    document.addEventListener("focus", handleFocus, true);
    return () => document.removeEventListener("focus", handleFocus, true);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const originalOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) return undefined;
    const lastActive = lastActiveRef.current;
    if (lastActive && typeof lastActive.focus === "function") {
      lastActive.focus();
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="presentation"
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === overlayRef.current) {
          onClose?.();
        }
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={typeof title === "string" ? titleId : undefined}
        className="relative w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl focus:outline-none"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title && typeof title !== "string" ? title : null}
        {typeof title === "string" && (
          <header className="mb-4">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
          </header>
        )}
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
