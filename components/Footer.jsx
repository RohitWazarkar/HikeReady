import Link from "next/link";
import { MountainIcon, SettingsIcon } from "./icons";
import { getDataSourceStatus } from "@/lib/db";

// Server component: probes the data source so it can show whether the site is
// running on the live database or the JSON offline fallback.
export async function Footer() {
  const year = new Date().getFullYear();
  const source = await getDataSourceStatus(); // "db" | "json"

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <MountainIcon className="h-5 w-5 text-emerald-600" />
            <span className="text-lg font-bold">HikeReady</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Interview prep to level up your career, one question at a time.
          </p>
          {/* Data source status */}
          <DataSourceBadge source={source} />
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">Explore</span>
            <Link href="/" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
              Home
            </Link>
            <Link href="/category/dsa" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
              DSA
            </Link>
            <Link href="/category/javascript" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
              JavaScript
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">More</span>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400 dark:border-zinc-900">
        © {year} HikeReady. Built with Next.js & Tailwind CSS.
      </div>
    </footer>
  );
}

function DataSourceBadge({ source }) {
  const onDb = source === "db";
  return (
    <span
      title={
        onDb
          ? "Serving from the live PostgreSQL database (Supabase)."
          : "Database unavailable — serving from local JSON files (offline mode). The site stays up."
      }
      className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        onDb
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          onDb ? "bg-emerald-500" : "bg-amber-500"
        }`}
        aria-hidden="true"
      />
      {onDb ? "Live database" : "Offline mode (JSON)"}
    </span>
  );
}
