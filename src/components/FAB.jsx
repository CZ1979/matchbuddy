import { Trophy } from "lucide-react";

export default function FAB({ label = "Meine Spiele", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:bottom-8 sm:right-6"
    >
      <Trophy size={20} />
      {label}
    </button>
  );
}
