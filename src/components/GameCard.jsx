// src/components/GameCard.jsx
// Reusable presentation card for games used on the games list and home carousel.

import clsx from "clsx";
import { Mail, MapPin, MessageCircle, Navigation, Info } from "lucide-react";
import { formatDateGerman } from "../utils/date";
import { calculateDistanceKm } from "../utils/distance";
import { normalizeAgeGroup } from "../utils/ageGroups";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildRouteHref = (game) => {
  const destination = [game.address, game.zip, game.city].filter(Boolean).join(", ");
  if (destination) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }
  const lat = toNumber(game.lat);
  const lng = toNumber(game.lng);
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return null;
};

const computeDistance = (game, viewerLocation) => {
  if (typeof game.distanceKm === "number") return game.distanceKm;
  if (!viewerLocation) return null;
  const lat = toNumber(game.lat);
  const lng = toNumber(game.lng);
  if (lat == null || lng == null) return null;
  return calculateDistanceKm(viewerLocation.lat, viewerLocation.lng, lat, lng);
};

const formatPhone = (value) => {
  if (!value) return { display: "", whatsapp: "" };
  let phone = value.trim();
  if (phone.startsWith("0049")) phone = "+" + phone.slice(2);
  else if (phone.startsWith("0") && !phone.startsWith("+49")) phone = "+49" + phone.slice(1);
  else if (!phone.startsWith("+")) phone = "+" + phone;
  return {
    display: phone,
    whatsapp: encodeURIComponent(phone),
  };
};

const buildWhatsappMessage = (game, viewerProfile = {}) => {
  const date = formatDateGerman(game.date);
  let message = `Hallo! Sucht ihr noch einen Gegner für euer Spiel am ${date}? Wir hätten Interesse!`;
  const first = viewerProfile.firstName || "";
  const last = viewerProfile.lastName || "";
  const club = viewerProfile.club || "";
  const name = [first, last].filter(Boolean).join(" ");

  if (name || club) {
    message += "\n\nViele Grüße";
    if (name) message += `,\n${name}`;
    if (club) message += `\n${club}`;
  }

  return encodeURIComponent(message);
};

export default function GameCard({
  game,
  viewerProfile,
  viewerLocation,
  variant = "list",
  anchorId,
  isHighlighted = false,
  className,
  showDetailsButton = true,
}) {
  const dateText = formatDateGerman(game.date);
  const normalizedGroup = normalizeAgeGroup(game.ageGroup);
  const distance = computeDistance(game, viewerLocation);
  const distanceText =
    typeof distance === "number" ? `~${Math.round(distance)} km entfernt` : "";

  const routeHref = buildRouteHref(game);
  const { display: phoneDisplay, whatsapp: phoneWhatsapp } = formatPhone(
    game.contactPhone
  );

  const detailHref = game.id ? `/spiele?highlight=${encodeURIComponent(game.id)}` : "/spiele";

  const containerClass = clsx(
    "rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm transition",
    "flex flex-col gap-3",
    variant === "carousel" && "h-full",
    isHighlighted && "border-primary shadow-lg ring-1 ring-primary/40",
    className
  );

  return (
    <div id={anchorId} className={containerClass}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span>{dateText}</span>
          {game.time && <span>• {game.time}</span>}
          {normalizedGroup && <span>• {normalizedGroup}</span>}
          {game.strength && (
            <span className="text-primary">💪 Stärke: {game.strength}</span>
          )}
        </div>

        {(game.ownerClub || game.ownerName) && (
          <div className="text-sm text-base-content/80">
            {game.ownerClub && <span>{game.ownerClub}</span>}
            {game.ownerName && <span> — {game.ownerName}</span>}
          </div>
        )}

        {(game.address || game.city || game.zip) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-primary" />
              {[game.address, game.zip, game.city].filter(Boolean).join(", ")}
            </span>
            {distanceText && <span className="text-neutral-500">📍 {distanceText}</span>}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {game.contactEmail && (
          <a href={`mailto:${game.contactEmail}`} className="btn btn-sm btn-primary">
            <Mail size={16} />
          </a>
        )}
        {phoneDisplay && (
          <a
            href={`https://wa.me/${phoneWhatsapp}?text=${buildWhatsappMessage(game, viewerProfile)}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-success"
            title={`WhatsApp öffnen (${phoneDisplay})`}
          >
            <MessageCircle size={16} />
          </a>
        )}
        {routeHref && (
          <a href={routeHref} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
            <Navigation size={16} />
          </a>
        )}
        {showDetailsButton && (
          <a href={detailHref} className="btn btn-sm btn-outline">
            <Info size={16} /> Details
          </a>
        )}
      </div>
    </div>
  );
}
