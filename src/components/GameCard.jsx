import clsx from "clsx";
import { CalendarDays, Clock, MapPin, UserRound, Users } from "lucide-react";
import OverflowMenu from "./OverflowMenu";
import { normalizeAgeGroup } from "../utils/ageGroups";
import { formatDateGerman } from "../utils/date";
import { buildWhatsAppUrl } from "../lib/whatsapp";

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

export default function GameCard({ game, viewerProfile, onDetails, onAction, isSaved = false }) {
  const badgeLabel = resolveBadge(game);
  const normalizedAgeGroup = normalizeAgeGroup(game.ageGroup);
  const dateLabel = game.date ? formatDateGerman(game.date) : "Datum folgt";
  const distanceLabel = toDistanceLabel(game.distanceKm);
  const whatsappUrl = buildWhatsAppUrl({
    phone: game.contactPhone,
    message: buildContactMessage(game, viewerProfile),
  });
  const hasContact = Boolean(whatsappUrl);

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
    normalizedAgeGroup
      ? {
          label: normalizedAgeGroup,
          icon: <Users size={14} />,
        }
      : null,
    game.ownerName
      ? {
          label: game.ownerName,
          icon: <UserRound size={14} />,
        }
      : null,
  ].filter(Boolean);

  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-3xl bg-white p-5 shadow-lg shadow-emerald-100/70 ring-1 ring-emerald-100",
        isSaved && "ring-2 ring-emerald-400 shadow-emerald-200/80"
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

      {game.notes && (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {game.notes}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={hasContact ? whatsappUrl : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!hasContact}
          tabIndex={hasContact ? undefined : -1}
          className={clsx(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
            hasContact
              ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          )}
        >
          Kontakt aufnehmen
        </a>
        <button
          type="button"
          onClick={() => onDetails?.(game)}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
        >
          Mehr Details
        </button>
      </div>
    </article>
  );
}
