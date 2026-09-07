import Link from "next/link";
import { getDataSourceMode } from "@/lib/dataSourceMode";
import { getDataSourceStatus } from "@/lib/db";
import { SettingsToggle } from "@/components/SettingsToggle";
import { SettingsIcon } from "@/components/icons";

export const metadata = {
  title: "Settings",
  description: "Configure HikeReady, including the data source.",
};

export default async function SettingsPage() {
  const [mode, status] = await Promise.all([
    getDataSourceMode(),
    getDataSourceStatus(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="text-zinc-700 dark:text-zinc-300">Settings</span>
      </nav>

      {/* Header */}
      <header className="animate-in flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <SettingsIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage how HikeReady works.
          </p>
        </div>
      </header>

      {/* Data source card */}
      <section
        className="animate-in mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Data source
        </h2>
        <p className="mt-1 mb-5 text-sm text-zinc-600 dark:text-zinc-400">
          Choose where questions and content are loaded from. This is handy when
          the database is unavailable or you want to work fully offline.
        </p>

        <SettingsToggle initialMode={mode} liveStatus={status} />
      </section>

      {/* Info note */}
      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
        Tip: the small status dot in the sidebar and footer always shows the
        source currently in use.
      </p>
    </main>
  );
}
