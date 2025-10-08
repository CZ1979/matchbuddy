import { useState } from "react";
import clsx from "clsx";
import { PlusCircle, UserRound } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "../../assets/logo.svg";
import FeedbackModal from "../FeedbackModal";

const navItems = [
  { href: "/feed", label: "Feed" },
  { href: "/neues-spiel", label: "Spiel anlegen" },
];

export default function AppLayout() {
  const location = useLocation();
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-emerald-100/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/feed" className="flex items-center gap-2 text-lg font-semibold text-emerald-600">
            <img src={logo} alt="MatchBuddy" className="h-9 w-auto" />
            <span className="hidden text-base text-slate-700 sm:inline">MatchBuddy</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/neues-spiel"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-600 sm:hidden"
              aria-label="Spiel anlegen"
            >
              <PlusCircle size={18} />
            </Link>
            <nav className="hidden items-center gap-2 sm:flex">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                  to={item.href}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-emerald-100 text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                  )}
                >
                  {item.label}
                </Link>
                );
              })}
            </nav>
            <Link
              to="/onboarding?edit=1"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-600"
              aria-label="Profil anpassen"
            >
              <UserRound size={18} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-24 pt-6">
        <Outlet />
      </main>

      <footer className="border-t border-emerald-100 bg-white/80 py-6 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} MatchBuddy · Spiele smarter organisieren</p>
        <p className="mt-1 flex items-center justify-center gap-2">
          <a className="hover:text-emerald-600" href="/privacy.html">
            Datenschutzerklärung
          </a>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="underline-offset-4 transition hover:text-emerald-600 hover:underline"
          >
            Feedback geben
          </button>
        </p>
      </footer>
      <FeedbackModal open={isFeedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
