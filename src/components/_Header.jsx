import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 bg-white border-b shadow-sm z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Trophy className="text-friendly-600" size={24} />
          <h1 className="font-heading font-semibold text-lg text-friendly-700">
            Friendly Match Finder
          </h1>
        </Link>

        <nav className="hidden sm:flex gap-6 text-sm text-neutral-600">
          <Link
            to="/neues-spiel"
            className="hover:text-friendly-600 transition-colors"
          >
            Neues Spiel
          </Link>
          <Link
            to="/spiele"
            className="hover:text-friendly-600 transition-colors"
          >
            Spiele suchen
          </Link>
          <Link
            to="/profil"
            className="hover:text-friendly-600 transition-colors"
          >
            Profil
          </Link>
        </nav>
      </div>
    </header>
  );
}
