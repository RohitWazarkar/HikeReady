"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronIcon,
  BookIcon,
  SettingsIcon,
  HomeIcon,
  MailIcon,
  UserIcon,
  InfoIcon,
  LayersIcon,
} from "./icons";

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

// A flat link row for the general / domain menus.
function MenuLink({ href, icon: Icon, label, active, onNavigate }) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

// The sidebar content adapts to WHERE you are:
//   - Home                         -> general menu (Contact / About / Settings / Sign up)
//   - /interview (domain picker)   -> domain menu (IT / Medical Coding)
//   - inside a domain/category/topic -> the browse tree (subjects + topics)
export function SidebarContent({ nav, domains = [], onNavigate }) {
  const pathname = usePathname();

  // Decide the sidebar "mode" from the path.
  const isHome = pathname === "/";
  const isDomainPicker = pathname === "/interview";
  const isBrowse =
    pathname.startsWith("/interview/") ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/topic/") ||
    pathname.startsWith("/section/") ||
    pathname === "/practice";

  // --- Home: general menu ---------------------------------------------------
  if (isHome || (!isDomainPicker && !isBrowse)) {
    return (
      <nav className="flex h-full flex-col">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Menu
        </p>
        <ul className="space-y-1">
          <MenuLink href="/" icon={HomeIcon} label="Home" active={pathname === "/"} onNavigate={onNavigate} />
          <MenuLink href="/interview" icon={LayersIcon} label="Interview Questions" active={false} onNavigate={onNavigate} />
          <MenuLink href="/about" icon={InfoIcon} label="About Us" active={pathname === "/about"} onNavigate={onNavigate} />
          <MenuLink href="/contact" icon={MailIcon} label="Contact Us" active={pathname === "/contact"} onNavigate={onNavigate} />
          <MenuLink href="/signup" icon={UserIcon} label="Sign Up" active={pathname === "/signup"} onNavigate={onNavigate} />
        </ul>
        <div className="mt-auto pt-3">
          <MenuLink href="/settings" icon={SettingsIcon} label="Settings" active={pathname === "/settings"} onNavigate={onNavigate} />
        </div>
      </nav>
    );
  }

  // --- Interview domain picker: list domains --------------------------------
  if (isDomainPicker) {
    return (
      <nav className="flex h-full flex-col">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Domains
        </p>
        <ul className="space-y-1">
          {domains.map((d) => (
            <MenuLink
              key={d.id}
              href={`/interview/${d.slug}`}
              icon={LayersIcon}
              label={d.name}
              active={pathname === `/interview/${d.slug}`}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
        <div className="mt-auto pt-3">
          <MenuLink href="/settings" icon={SettingsIcon} label="Settings" active={false} onNavigate={onNavigate} />
        </div>
      </nav>
    );
  }

  // --- Browse: the subjects/topics tree -------------------------------------
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
        <p className="px-3 text-sm text-zinc-500">No subjects here yet.</p>
      )}

      <div className="mt-auto pt-3">
        <MenuLink href="/settings" icon={SettingsIcon} label="Settings" active={pathname === "/settings"} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
