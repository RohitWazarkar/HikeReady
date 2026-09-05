"use client";

import { useState } from "react";
import Link from "next/link";
import { SidebarContent } from "./Sidebar";
import { MenuIcon, CloseIcon, MountainIcon } from "./icons";
import { SearchBar } from "./SearchBar";

// The interactive app shell: sticky header, a desktop sidebar, a slide-in
// mobile drawer, and the page content area. Receives the nav tree from the
// server layout so all data access stays on the server.
export function AppShell({ nav, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MenuIcon />
          </button>

          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <MountainIcon className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-zinc-900 sm:inline dark:text-white">
              HikeReady
            </span>
          </Link>

          {/* Center: search */}
          <div className="flex flex-1 justify-center px-2">
            <SearchBar />
          </div>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:inline-block dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Interview prep
            </span>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-zinc-200 p-4 lg:block dark:border-zinc-800">
          <SidebarContent nav={nav} />
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeMobile}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-xl dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" onClick={closeMobile} className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <MountainIcon className="h-4 w-4" />
                </span>
                <span className="font-bold text-zinc-900 dark:text-white">HikeReady</span>
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent nav={nav} onNavigate={closeMobile} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
