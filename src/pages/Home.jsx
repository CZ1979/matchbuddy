import { User, Trophy, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className="p-4 max-w-6xl mx-auto w-full space-y-6">
      <section className="bg-base-100 rounded-2xl shadow p-8 text-center">
        <h1 className="text-4xl font-heading text-primary">
          Find your Match!
        </h1>
        <p className="py-4 text-base-content/70">
          Du suchst nach Gegnern für Freundschaftsspiele - ohne WhatsApp-Chaos?<br></br>
          Hier bist Du richtig!
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <a
          href="/profil"
          className="bg-base-100 rounded-2xl shadow hover:shadow-xl border border-base-200 p-6 text-center transition hover:-translate-y-0.5"
        >
          <User className="text-primary mx-auto" size={40} />
          <h2 className="text-lg font-semibold mt-3">Mein Profil</h2>
          <p className="text-base-content/70 mb-3">Trainerprofil mit Verein & Kontakt</p>
          <button className="btn btn-primary">Öffnen</button>
        </a>

        <a
          href="/neues-spiel"
          className="bg-base-100 rounded-2xl shadow hover:shadow-xl border border-base-200 p-6 text-center transition hover:-translate-y-0.5"
        >
          <Trophy className="text-primary mx-auto" size={40} />
          <h2 className="text-lg font-semibold mt-3">Meine Spiele</h2>
          <p className="text-base-content/70 mb-3">Spiele anlegen und verwalten</p>
          <button className="btn btn-primary">Öffnen</button>
        </a>

        <a
          href="/spiele"
          className="bg-base-100 rounded-2xl shadow hover:shadow-xl border border-base-200 p-6 text-center transition hover:-translate-y-0.5"
        >
          <MapPin className="text-primary mx-auto" size={40} />
          <h2 className="text-lg font-semibold mt-3">Spiele suchen</h2>
          <p className="text-base-content/70 mb-3">Finde Spiele im Umkreis</p>
          <button className="btn btn-primary">Suchen</button>
        </a>
      </section>
    </div>
  );
}
