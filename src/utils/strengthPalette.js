const STRENGTH_PALETTE = [
  {
    from: 1,
    to: 2,
    className: "border border-sky-300/60 bg-sky-200/80 text-sky-700",
    iconClassName: "text-sky-700",
  },
  {
    from: 3,
    to: 4,
    className: "border border-cyan-300/60 bg-cyan-200/80 text-cyan-700",
    iconClassName: "text-cyan-700",
  },
  {
    from: 5,
    to: 6,
    className: "border border-teal-300/60 bg-teal-200/80 text-teal-700",
    iconClassName: "text-teal-700",
  },
  {
    from: 7,
    to: 8,
    className: "border border-amber-300/60 bg-amber-200/80 text-amber-700",
    iconClassName: "text-amber-700",
  },
  {
    from: 9,
    to: 10,
    className: "border border-rose-300/60 bg-rose-200/80 text-rose-700",
    iconClassName: "text-rose-700",
  },
];

export function getStrengthPalette(strength) {
  const numericStrength = Number(strength);
  if (!Number.isFinite(numericStrength)) {
    return null;
  }

  const clamped = Math.min(Math.max(Math.round(numericStrength), 1), 10);
  const match =
    STRENGTH_PALETTE.find((range) => clamped >= range.from && clamped <= range.to) ||
    STRENGTH_PALETTE[STRENGTH_PALETTE.length - 1];

  return {
    ...match,
    value: clamped,
  };
}

export { STRENGTH_PALETTE };
