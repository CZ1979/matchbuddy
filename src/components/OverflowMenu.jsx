import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

const actions = [
  { key: "save", label: "Merken" },
  { key: "share", label: "Teilen" },
];

export default function OverflowMenu({ onAction }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} />
        <span className="sr-only">Aktionen</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
              onClick={() => {
                setOpen(false);
                onAction?.(action.key);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
