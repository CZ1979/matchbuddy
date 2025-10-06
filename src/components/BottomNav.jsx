import { Home, MapPin, User, Plus } from "lucide-react";

export default function BottomNav() {
  return (
    <div className="btm-nav bg-base-100 border-t border-base-300 sm:hidden z-50">
      <a href="/" className="text-primary flex flex-col items-center">
        <Home size={22} />
        <span className="text-[11px]">Start</span>
      </a>
       <a href="/profil" className="text-primary flex flex-col items-center">
        <User size={22} />
        <span className="text-[11px]">Profil</span>
      </a>
      <a href="/neues-spiel" className="text-primary flex flex-col items-center">
        <Plus size={22} />
        <span className="text-[11px]">Meine Spiele</span>
      </a>
     <a href="/spiele" className="text-primary flex flex-col items-center">
        <MapPin size={22} />
        <span className="text-[11px]">Spiel suchen</span>
      </a>
    </div>
  );
}
