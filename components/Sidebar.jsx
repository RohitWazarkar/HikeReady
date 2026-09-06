"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronIcon, BookIcon } from "./icons";

// A single collapsible category group with its topics nested underneath.
function CategoryGroup({ category, pathname, onNavigate }) {
  const categoryHref = `/category/${category.slug}`;
  const isActiveCategory = pathname === categoryHref;
  const hasActiveTopic = category.topics.some(
    (t) => pathname === `/topic/${t.slug}`
  );
  // Open by default if we're somewhere inside this category.
  const [open, setOpen] = useState(isActiveCategory || hasActiveTopic);

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={categoryHref}
          onClick={onNavigate}
          className={`flex-1 truncate rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            isActiveCategory
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {category.name}
        </Link>
        {category.topics.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse" : "Expand"}
            className="ml-1 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <ChevronIcon open={open} />
          </button>
        )}
      </div>

      {open && category.topics.length > 0 && (
        <ul className="mt-1 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
          {category.topics.map((t) => {
            const topicHref = `/topic/${t.slug}`;
            const active = pathname === topicHref;
            return (
              <li key={t.id}>
                <Link
                  href={topicHref}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 truncate rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <BookIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{t.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function SidebarContent({ nav, dataSource, onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Browse
      </p>
      <ul className="space-y-1">
        {nav.map((c) => (
          <CategoryGroup
            key={c.id}
            category={c}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
      {nav.length === 0 && (
        <p className="px-3 text-sm text-zinc-500">
          No categories yet. Run <code>npm run seed</code>.
        </p>
      )}

      {/* Data source status, pinned to the bottom. */}
      {dataSource && <SidebarStatus source={dataSource} />}
    </nav>
  );
}

// Tiny status flag showing whether the site is on the live DB or JSON fallback.
function SidebarStatus({ source }) {
  const onDb = source === "db";
  return (
    <div
      title={
        onDb
          ? "Serving from the live database (Supabase)."
          : "Database unavailable — serving from local JSON (offline mode)."
      }
      className="mt-auto flex items-center gap-1.5 border-t border-zinc-200 px-3 pt-3 text-[10px] font-medium text-zinc-400 dark:border-zinc-800"
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          onDb ? "bg-emerald-500" : "bg-amber-500"
        }`}
        aria-hidden="true"
      />
      <span>{onDb ? "Live database" : "Offline (JSON)"}</span>
    </div>
  );
}
