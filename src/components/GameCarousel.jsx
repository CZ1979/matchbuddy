// src/components/GameCarousel.jsx
// Horizontal swipe carousel that renders GameCard instances for the home page.

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import GameCard from "./GameCard";

export default function GameCarousel({
  title,
  subtitle,
  games,
  viewerProfile,
  viewerLocation,
  emptyMessage = "Aktuell keine Spiele verfügbar.",
}) {
  const [index, setIndex] = useState(0);
  const slideCount = games.length;
  const maxIndex = Math.max(0, slideCount - 1);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [index, maxIndex]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setIndex((current) => Math.min(current + 1, maxIndex)),
    onSwipedRight: () => setIndex((current) => Math.max(current - 1, 0)),
    trackMouse: true,
  });

  const offset = useMemo(() => `translateX(-${index * 100}%)`, [index]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-base-content/70">{subtitle}</p>}
      </div>

      {slideCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/60">
          {emptyMessage}
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-hidden" {...swipeHandlers}>
            <div
              className="flex w-full flex-nowrap gap-4 transition-transform duration-300 ease-out"
              style={{ transform: offset }}
            >
              {games.map((game) => (
                <div
                  key={game.id}
                  className="min-w-full sm:min-w-[75%] lg:min-w-[50%] xl:min-w-[33.333%]"
                >
                  <GameCard
                    game={game}
                    viewerProfile={viewerProfile}
                    viewerLocation={viewerLocation}
                    variant="carousel"
                    showDetailsButton
                  />
                </div>
              ))}
            </div>
          </div>

          {slideCount > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((current) => Math.max(current - 1, 0))}
                className="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 bg-base-100/90 shadow"
                aria-label="Vorheriges Spiel"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIndex((current) => Math.min(current + 1, maxIndex))}
                className="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 bg-base-100/90 shadow"
                aria-label="Nächstes Spiel"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
