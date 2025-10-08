import { Plus } from "lucide-react";

export default function FAB({ label = "Spiel anlegen", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
    >
      <Plus size={20} />
      {label}
    </button>
  );
}
