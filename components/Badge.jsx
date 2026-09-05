// Presentational badge components. No client-side state, so these render on the
// server as part of the page.

const DIFFICULTY_STYLES = {
  Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Hard: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function DifficultyBadge({ difficulty }) {
  const style = DIFFICULTY_STYLES[difficulty] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {difficulty}
    </span>
  );
}

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
      <span aria-hidden="true">★</span> Premium
    </span>
  );
}
