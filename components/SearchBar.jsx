"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, CloseIcon } from "./icons";
import { DifficultyBadge } from "./Badge";

// Header search: debounced live suggestions with full keyboard navigation.
//  - type to fetch matching questions from /api/search
//  - ArrowUp / ArrowDown moves the highlighted suggestion
//  - Enter navigates to the highlighted (or first) result
//  - Escape clears / closes the dropdown
//  - clicking outside closes it
export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // highlighted index
  const [loading, setLoading] = useState(false);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced fetch whenever the query changes.
  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
        setActive(-1);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const goTo = (item) => {
    if (!item?.topicSlug) return;
    setOpen(false);
    setQuery("");
    setResults([]);
    // Navigate to the topic page (questions live in accordions there).
    router.push(`/topic/${item.topicSlug}`);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (results.length) setOpen(true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (results.length) {
        e.preventDefault();
        goTo(results[active >= 0 ? active : 0]);
      }
    } else if (e.key === "Escape") {
      if (query) {
        setQuery("");
        setResults([]);
      }
      setOpen(false);
    }
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-emerald-500">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search questions…"
          aria-label="Search questions"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          autoComplete="off"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-9 text-sm text-zinc-900 shadow-sm transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:shadow-md focus:shadow-emerald-500/10 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-900"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="animate-accordion absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => goTo(r)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === active
                        ? "bg-emerald-50 dark:bg-emerald-950/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className="text-zinc-300 dark:text-zinc-600">
                      <SearchIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900 dark:text-white">
                        {r.title}
                      </span>
                      {r.topicName && (
                        <span className="block truncate text-xs text-zinc-500">
                          {r.topicName}
                        </span>
                      )}
                    </span>
                    <DifficultyBadge difficulty={r.difficulty} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
