import { Outlet, Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg"; // ← Pfad prüfen

import ThemeToggle from "./ThemeToggle";
import BottomNav from "./BottomNav";

export default function Layout() {
  const location = useLocation();

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
                location.pathname === path
                  ? "btn-active text-primary font-semibold"
                  : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        
      </header>

      {/* ZENTRALER CONTAINER */}
      <main className="flex-grow pb-20">
        <div className="max-w-6xl mx-auto w-full px-4">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      {/* FOOTER */}
      <footer className="bg-base-100 border-t border-base-300 py-4 text-center text-sm text-base-content/70">
        <p>© {new Date().getFullYear()} MatchBuddy – Entwickelt für Trainerinnen und Trainer 💚</p>
      </footer>
    </div>
  );
}
