"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SidebarContent } from "./Sidebar";
import { MenuIcon, CloseIcon, MountainIcon } from "./icons";
import { SearchBar } from "./SearchBar";
import { NavigationLoader } from "./NavigationLoader";
import { ChatWidget } from "./ChatWidget";

const SIDEBAR_KEY = "hikeready:sidebar-open";

// The interactive app shell: sticky header, a collapsible desktop sidebar, a
// slide-in mobile drawer, and the page content area. Receives the nav tree from
// the server layout so all data access stays on the server.
export function AppShell({ nav, dataSource, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop sidebar open/closed. Defaults to open; remembers the user's choice.
  const [desktopOpen, setDesktopOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_KEY);
      if (saved !== null) setDesktopOpen(saved === "1");
    } catch {
      // ignore
    }
  }, []);

  const toggleDesktop = () => {
    setDesktopOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Route-transition loading overlay */}
      <NavigationLoader />

      {/* Floating chat assistant */}
      <ChatWidget />

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

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            onClick={toggleDesktop}
            aria-label={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={desktopOpen}
            title={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={`hidden rounded-lg p-2 transition-colors active:scale-95 lg:inline-flex ${
              desktopOpen
                ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
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
        {/* Desktop sidebar — width animates for a smooth collapse/expand. */}
        <aside
          aria-hidden={!desktopOpen}
          className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-hidden border-r transition-all duration-300 ease-in-out lg:block ${
            desktopOpen
              ? "w-64 border-zinc-200 dark:border-zinc-800"
              : "w-0 border-transparent"
          }`}
        >
          {/* Fixed-width inner keeps content from reflowing while collapsing. */}
          <div className="h-full w-64 overflow-y-auto p-4">
            <SidebarContent nav={nav} dataSource={dataSource} />
          </div>
        </aside>

        {/* Content — expands to fill space when the sidebar is collapsed. */}
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
              <SidebarContent nav={nav} dataSource={dataSource} onNavigate={closeMobile} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
