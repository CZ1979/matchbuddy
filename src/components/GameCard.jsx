import clsx from "clsx";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  Clock,
  Info,
  MapPin,
  Navigation,
  Share2,
  UsersRound,
} from "lucide-react";
import { buildGoogleMapsRouteUrl } from "../lib/maps";
import { formatDateGerman } from "../utils/date";
import { buildWhatsAppUrl } from "../lib/whatsapp";

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M12 2a10 10 0 0 0-8.94 14.56L2 22l5.62-1.47A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.06 14.9l-.3-.17-3.19.84.86-3.11-.18-.3A8 8 0 0 1 12 4Zm-3.08 4.72c-.18-.4-.35-.4-.51-.41h-.43c-.14 0-.37.05-.55.24s-.72.7-.72 1.69 0 1.64.74 2.51 1 1.24 1.14 1.42 1.03 1.64 2.51 2.22 1.51.36 1.79.34.88-.36 1-.71.13-.64.1-.7-.14-.1-.29-.18-.88-.43-1.01-.48-.24-.07-.34.07-.4.48-.47.58-.18.13-.34.04a7.05 7.05 0 0 1-2.1-1.29 7.61 7.61 0 0 1-1.44-1.79c-.15-.24 0-.37.11-.5.26-.27.35-.44.39-.52s.02-.3-.01-.39-.29-.7-.4-.96Z"
    />
  </svg>
);

const toDistanceLabel = (distanceKm) => {
  if (typeof distanceKm !== "number" || Number.isNaN(distanceKm)) return "";
  if (distanceKm < 1) return "< 1 km entfernt";
  return `~${Math.round(distanceKm)} km entfernt`;
};

const formatAgeGroupLabel = (value) => {
  if (!value) return "";
  const str = value.toString();
  if (/^\d{4}$/.test(str)) {
    return `Jahrgang ${str}`;
  }
  return str;
};

const resolveBadge = (game) => {
  if (!game) return "Gegner gesucht";
  if (typeof game.matchType === "string") {
    if (game.matchType.toLowerCase().includes("freund")) return "Freundschaftsspiel";
  }
  if (game.notes && /freundschaft/i.test(game.notes)) return "Freundschaftsspiel";
  return "Gegner gesucht";
};

const buildContactMessage = (game, profile) => {
  if (!game) return "";
  const date = game.date ? formatDateGerman(game.date) : "";
  const time = game.time ? ` um ${game.time}` : "";
  const location = game.city ? ` in ${game.city}` : "";
  const lines = [];
  const ownerFirstName = game.ownerName ? game.ownerName.split(" ")[0] : "";
  lines.push(`Hallo${ownerFirstName ? ` ${ownerFirstName}` : ""}!`);
  lines.push(
    `wir haben euer Gesuch für ${game.ownerClub || "euer Team"}${location} am ${date}${time} gesehen und hätten Interesse an einem Match.`
  );
  if (profile?.fullName || profile?.club) {
    lines.push("");
    lines.push("Viele Grüße");
    if (profile.fullName) lines.push(profile.fullName);
    if (profile.club) lines.push(profile.club);
  }
  return lines.join("\n");
};

export default function GameCard({
  game,
  viewerProfile,
  onDetails,
  isSaved = false,
  onToggleFavorite,
  isFavorite = false,
  onShare,
}) {
  const badgeLabel = resolveBadge(game);
  const dateLabel = game.date ? formatDateGerman(game.date) : "Datum folgt";
  const distanceLabel = toDistanceLabel(game.distanceKm);
  const ageGroupLabel = formatAgeGroupLabel(game.displayAgeGroup || game.originalAgeGroup || game.ageGroup);
  const strengthLabel = game.strength ? `Stärke ${game.strength}` : "";
  const whatsappUrl = buildWhatsAppUrl({
    phone: game.contactPhone,
    message: buildContactMessage(game, viewerProfile),
  });
  const hasWhatsapp = Boolean(whatsappUrl);
  const mapsUrl = buildGoogleMapsRouteUrl({ address: game.address, zip: game.zip, city: game.city });
  const isInactive = game.status && game.status !== "active";
  const statusLabel =
    game.status === "cancelled"
      ? "Spiel abgesagt"
      : game.status === "matched"
      ? "Matchpartner gefunden"
      : "";

  const infoChips = [
    {
      label: dateLabel,
      icon: <CalendarDays size={14} />,
      highlight: true,
    },
    game.time
      ? {
          label: game.time,
          icon: <Clock size={14} />,
        }
      : null,
    ageGroupLabel
      ? {
          label: ageGroupLabel,
          icon: <UsersRound size={14} />,
        }
      : null,
    strengthLabel
      ? {
          label: strengthLabel,
          icon: <BarChart3 size={14} />,
        }
      : null,
  ].filter(Boolean);

  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-3xl p-5 shadow-lg shadow-emerald-100/70 ring-1 ring-emerald-100 transition-colors duration-200",
        isSaved ? "bg-emerald-50/80 ring-2 ring-emerald-400 shadow-emerald-200/80" : "bg-white hover:bg-emerald-50/60",
        isInactive && "opacity-60"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            {badgeLabel}
          </span>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">
            {game.ownerClub || "Unbekannter Verein"}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={16} className="text-emerald-500" />
            {[game.city, game.zip].filter(Boolean).join(" ")}
            {distanceLabel && (
              <span className="ml-2 text-xs font-medium text-emerald-600">{distanceLabel}</span>
            )}
          </p>
        </div>
        {/* FEATURE 6: Share Button + Favorites */}
        <button
          type="button"
          onClick={() => onToggleFavorite?.(game)}
          className={clsx(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
            isFavorite
              ? "border-emerald-300 bg-emerald-50 text-emerald-600"
              : "border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600"
          )}
          title={isFavorite ? "Gemerkt" : "Merken"}
          aria-pressed={isFavorite}
        >
          <Bookmark size={18} className={clsx(isFavorite && "fill-current text-emerald-500")} />
          <span className="sr-only">Favorisieren</span>
        </button>
      </div>

      {/* FEATURE 4: Game Status + Undo */}
      {isInactive && statusLabel && (
        <div className="mt-4 inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {statusLabel}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {infoChips.map((chip, index) => (
          <span
            key={`${chip.label}-${index}`}
            className={clsx(
              "inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1",
              chip.highlight && "bg-emerald-50 text-emerald-700"
            )}
          >
            {chip.icon}
            <span>{chip.label}</span>
          </span>
        ))}
      </div>

      {/* FEATURE 6: Share Button + Favorites */}
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <a
            href={hasWhatsapp ? whatsappUrl : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!hasWhatsapp}
            aria-label="Per WhatsApp kontaktieren"
            tabIndex={hasWhatsapp ? undefined : -1}
            className={clsx(
              "inline-flex h-12 items-center justify-center gap-1 rounded-2xl text-sm font-semibold transition",
              "flex-col sm:flex-row",
              hasWhatsapp
                ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            )}
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <a
            href={mapsUrl || undefined}
            target="_blank"
            rel="noreferrer"
            aria-label="Route öffnen"
            tabIndex={mapsUrl ? undefined : -1}
            className={clsx(
              "inline-flex h-12 items-center justify-center gap-1 rounded-2xl border text-sm font-medium transition",
              "flex-col sm:flex-row",
              mapsUrl
                ? "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
            )}
          >
            <Navigation size={16} />
            <span className="hidden sm:inline">Route</span>
          </a>
          <button
            type="button"
            onClick={() => onDetails?.(game)}
            aria-label="Details anzeigen"
            className="inline-flex h-12 items-center justify-center gap-1 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 flex-col sm:flex-row"
          >
            <Info size={16} />
            <span className="hidden sm:inline">Details</span>
          </button>
          <button
            type="button"
            onClick={() => onShare?.(game)}
            aria-label="Spiel teilen"
            className="inline-flex h-12 items-center justify-center gap-1 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 flex-col sm:flex-row"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">Teilen</span>
          </button>
        </div>
      </div>
    </article>
  );
}
