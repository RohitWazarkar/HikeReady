import Link from "next/link";

// A clickable card that links somewhere. Used for categories and topics.
// Pass `index` to get a staggered entrance animation.
export function LinkCard({ href, title, subtitle, meta, index = 0 }) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${Math.min(index, 12) * 70}ms` }}
      className="animate-in group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
    >
      {/* Accent bar */}
      <span
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
          {title}
        </h3>
        <span className="text-zinc-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-zinc-600">
          →
        </span>
      </div>
      {subtitle ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      ) : null}
      {meta ? (
        <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-500">
          {meta}
        </p>
      ) : null}
    </Link>
  );
}
