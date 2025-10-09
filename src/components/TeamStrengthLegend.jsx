import clsx from "clsx";
import { TEAM_STRENGTH_LEVELS } from "../data/teamStrengthLevels";

// LEGEND MODAL REFACTOR
function TeamStrengthLegend({ className, showHeading = true }) {
  return (
    <section
      className={clsx(
        "rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-md shadow-emerald-100/70",
        "backdrop-blur",
        className
      )}
    >
      {showHeading && (
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-semibold text-emerald-700">🏆 Teamstärke-Legende</h2>
          <p className="text-sm text-slate-600">
            Hilft dir, euer Niveau realistisch einzuschätzen – damit faire Matches entstehen.
          </p>
        </div>
      )}

      <div className={clsx(showHeading ? "mt-6" : "mt-4", "grid gap-4 sm:grid-cols-2")}>
        {TEAM_STRENGTH_LEVELS.map((level) => (
          <article
            key={level.value}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left shadow-sm transition hover:border-emerald-200 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Stärke {level.value}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">{level.label}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-600">{level.short}</p>
            <details className="group/details mt-auto text-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700">
                <span>Mehr erfahren</span>
                <svg
                  className="h-4 w-4 transition group-open/details:rotate-180"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>
              <p className="mt-3 rounded-xl bg-white/80 p-3 text-slate-600 shadow-inner">{level.description}</p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TeamStrengthLegend;
