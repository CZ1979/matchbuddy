import clsx from "clsx";
import {
  CalendarDays,
  Clock,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Trophy,
  Users,
} from "lucide-react";
import OverflowMenu from "./OverflowMenu";
import { buildGoogleMapsRouteUrl } from "../lib/maps";
import { formatDateGerman } from "../utils/date";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { normalizeAgeGroup } from "../utils/ageGroups";

const toDistanceLabel = (distanceKm) => {
  if (typeof distanceKm !== "number" || Number.isNaN(distanceKm)) return "";
  if (distanceKm < 1) return "< 1 km entfernt";
  return `~${Math.round(distanceKm)} km entfernt`;
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

const buildEmailLink = (game, profile) => {
  if (!game?.contactEmail) return "";
  const params = new URLSearchParams({
    subject: `MatchBuddy Anfrage: ${game.ownerClub || "Spiel"}`,
  });
  const body = buildContactMessage(game, profile);
  if (body) {
    params.set("body", body);
  }
  return `mailto:${game.contactEmail}?${params.toString()}`;
};

const resolveStrengthLabel = (value) => {
  if (value == null) return "";
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return `Stärke ${value}`;
  }
  return `Stärke ${numeric}/5`;
};

export default function GameCard({ game, viewerProfile, onDetails, onAction, isSaved = false }) {
  const badgeLabel = resolveBadge(game);
  const dateLabel = game.date ? formatDateGerman(game.date) : "Datum folgt";
  const distanceLabel = toDistanceLabel(game.distanceKm);
  const whatsappUrl = buildWhatsAppUrl({
    phone: game.contactPhone,
    message: buildContactMessage(game, viewerProfile),
  });
  const hasContact = Boolean(whatsappUrl);
  const emailUrl = buildEmailLink(game, viewerProfile);
  const mapsUrl = buildGoogleMapsRouteUrl({ address: game.address, zip: game.zip, city: game.city });
  const ageGroupLabel = game.ageGroup ? normalizeAgeGroup(game.ageGroup) : "";
  const strengthLabel = resolveStrengthLabel(game.strength);

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
          icon: <Users size={14} />,
        }
      : null,
    strengthLabel
      ? {
          label: strengthLabel,
          icon: <Trophy size={14} />,
        }
      : null,
  ].filter(Boolean);

  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-3xl p-5 shadow-lg shadow-emerald-100/70 ring-1 ring-emerald-100 transition",
        isSaved
          ? "bg-emerald-50/80 ring-2 ring-emerald-400 shadow-emerald-200"
          : "bg-white hover:shadow-xl hover:shadow-emerald-100/90"
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
        <OverflowMenu
          onAction={(action) => {
            onAction?.(action, game);
          }}
        />
      </div>

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

      <div className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
        <a
          href={hasContact ? whatsappUrl : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!hasContact}
          tabIndex={hasContact ? undefined : -1}
          className={clsx(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 font-semibold transition",
            hasContact
              ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          )}
        >
          <MessageCircle size={16} /> WhatsApp
        </a>
        {emailUrl && (
          <a
            href={emailUrl}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
          >
            <Mail size={16} /> E-Mail
          </a>
        )}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
          >
            <Navigation size={16} /> Route
          </a>
        )}
        <button
          type="button"
          onClick={() => onDetails?.(game)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
        >
          <Info size={16} /> Mehr Details
        </button>
      </div>
    </article>
  );
}
