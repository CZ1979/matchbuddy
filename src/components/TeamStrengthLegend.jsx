import clsx from "clsx";
import { TEAM_STRENGTH_LEVELS } from "../data/teamStrengthLevels";
import { getStrengthPalette } from "../utils/strengthPalette";

// LEGEND MODAL REFACTOR
function TeamStrengthLegend({ className, showHeading = true }) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      {showHeading && (
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-emerald-700">🏆 Teamstärke-Legende</h2>
          <p className="text-sm text-slate-600">
            Hilft dir, euer Niveau realistisch einzuschätzen – damit faire Matches entstehen.
          </p>
        </div>
      )}

      <div className={clsx(showHeading ? "mt-4" : "mt-3", "grid gap-3 sm:grid-cols-2")}>
        {TEAM_STRENGTH_LEVELS.map((level) => {
          const palette = getStrengthPalette(level.value);

          return (
            <article
              key={level.value}
              className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                      palette?.className
                    )}
                  >
                    Stärke {level.value}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">{level.label}</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600">{level.short}</p>

              {/* Beschreibung immer sichtbar — kompakter Abstand & Padding */}
              <p className="mt-2 rounded-md bg-white/80 px-2 py-2 text-sm text-slate-600">
                {level.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default TeamStrengthLegend;
