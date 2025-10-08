import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import logo from "../assets/logo.svg"; // ← Pfad prüfen
import BottomNav from "./BottomNav";
import FeedbackModal from "./FeedbackModal";

export default function Layout() {
  const location = useLocation();
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      {/* HEADER */}
      <header className="navbar bg-base-100 shadow-md sticky top-0 z-40">
        <div className="flex-1 px-4 font-heading text-xl text-primary">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MatchBuddy" className="h-32 cursor-pointer" />
          </Link>
        </div>

        <nav className="hidden sm:flex gap-2 mr-4">
          {[
            { path: "/", label: "Start" },
            { path: "/profil", label: "Profil" },
            { path: "/neues-spiel", label: "Meine Spiele" },
            { path: "/spiele", label: "Spiele" },
          ].map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`btn btn-ghost btn-sm text-sm ${
                location.pathname === path ? "btn-active text-primary font-semibold" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ZENTRALER CONTAINER */}
      <main className="flex-grow pb-16">
        <div className="max-w-6xl mx-auto w-full px-4">
          <Outlet />
        </div>
      </main>

      {/* FOOTER – sitzt bewusst über der fixen BottomNav */}
      <footer className="bg-base-100 border-t border-base-300 py-4 text-center text-sm text-base-content/70 mb-[calc(env(safe-area-inset-bottom)+4rem)] sm:mb-0">
        <p>© {new Date().getFullYear()} MatchBuddy – Entwickelt für Trainerinnen und Trainer 💚</p>
        <div className="flex justify-center gap-4 mt-1">
          <a href="/privacy.html" rel="noopener noreferrer" className="hover:underline">
            Datenschutzerklärung
          </a>
          |
          <a
            href="#feedback"
            onClick={(e) => {
              e.preventDefault();
              setFeedbackOpen(true);
            }}
            className="hover:underline cursor-pointer"
          >
            Feedback
          </a>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}
