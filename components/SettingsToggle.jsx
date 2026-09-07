"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  {
    value: "online",
    label: "Online",
    desc: "Read from the live database (Supabase). Falls back to offline data if the DB is unreachable.",
    dot: "bg-emerald-500",
  },
  {
    value: "auto",
    label: "Auto",
    desc: "Recommended. Uses the database when available and switches to offline data automatically if it fails.",
    dot: "bg-sky-500",
  },
  {
    value: "offline",
    label: "Offline",
    desc: "Read only from local JSON files. The database is never contacted.",
    dot: "bg-amber-500",
  },
];

export function SettingsToggle({ initialMode = "auto", liveStatus = "db" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function choose(next) {
    if (next === mode || pending) return;
    setMode(next);
    setSaved(false);
    try {
      await fetch("/api/settings/data-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      // Refresh server components so they re-fetch from the new source.
      startTransition(() => router.refresh());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore; UI stays on the attempted mode
    }
  }

  const active = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[1];
  const onDb = liveStatus === "db";

  return (
    <div>
      {/* Segmented control */}
      <div
        role="radiogroup"
        aria-label="Data source mode"
        className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800"
      >
        {OPTIONS.map((o) => {
          const isActive = o.value === mode;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => choose(o.value)}
              disabled={pending}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${o.dot}`} aria-hidden="true" />
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Description of the selected mode */}
      <p className="mt-3 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {active.desc}
      </p>

      {/* Live status + saved feedback */}
      <div className="mt-4 flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
            onDb
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${onDb ? "bg-emerald-500" : "bg-amber-500"}`} />
          Currently serving: {onDb ? "Live database" : "Offline (JSON)"}
        </span>
        {pending && <span className="text-xs text-zinc-400">Switching…</span>}
        {saved && !pending && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved ✓</span>
        )}
      </div>
    </div>
  );
}
