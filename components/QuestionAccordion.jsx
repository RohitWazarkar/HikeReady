"use client";

import { useEffect, useState } from "react";
import { DifficultyBadge, PremiumBadge } from "./Badge";
import { Markdown } from "./Markdown";
import {
  ChevronIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  HeartIcon,
  ExpandAllIcon,
  CollapseAllIcon,
} from "./icons";

const STORAGE_KEY = "hikeready:reactions";

// Read/write the reactions map from localStorage.
// Shape: { [questionId]: { vote: "up" | "down" | null, fav: boolean } }
function loadReactions() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveReactions(map) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore write failures (private mode, quota, etc.)
  }
}

// A single accordion item. Controlled by the parent via `open` + `onToggle`
// so a single "expand/collapse all" button can drive every item.
function QuestionItem({ question, reaction, onReact, open, onToggle, index }) {
  const vote = reaction?.vote ?? null;
  const fav = reaction?.fav ?? false;

  return (
    <li
      className="animate-in overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      {/* Header (click to toggle) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors ${
          open
            ? "bg-emerald-50/60 dark:bg-emerald-950/20"
            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 ${
            open
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
          }`}
        >
          <ChevronIcon open={open} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-zinc-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
            {question.title}
          </span>
          {question.tags?.length > 0 && (
            <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-500">
              {question.tags.join(" · ")}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <DifficultyBadge difficulty={question.difficulty} />
          {question.isPremium && <PremiumBadge />}
        </span>
      </button>

      {/* Expanded answer — always mounted; height animates via the grid trick. */}
      <div className={`collapsible ${open ? "open" : ""}`}>
        <div className="collapsible-inner">
          <div className="border-t border-zinc-100 bg-zinc-50/40 px-5 pt-3 pb-5 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className={open ? "animate-accordion" : ""}>
              <Markdown>{question.answerMd || "_No answer provided yet._"}</Markdown>

              {/* Action bar */}
              <div className="mt-4 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <ActionButton
                  active={vote === "up"}
                  activeClass="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  onClick={() => onReact(question.id, "vote", vote === "up" ? null : "up")}
                  label="Helpful"
                >
                  <ThumbsUpIcon filled={vote === "up"} />
                  <span>Like</span>
                </ActionButton>

                <ActionButton
                  active={vote === "down"}
                  activeClass="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  onClick={() => onReact(question.id, "vote", vote === "down" ? null : "down")}
                  label="Not helpful"
                >
                  <ThumbsDownIcon filled={vote === "down"} />
                  <span>Dislike</span>
                </ActionButton>

                <ActionButton
                  active={fav}
                  activeClass="border-pink-300 bg-pink-50 text-pink-600 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-300"
                  onClick={() => onReact(question.id, "fav", !fav)}
                  label="Favorite"
                >
                  <HeartIcon filled={fav} />
                  <span>{fav ? "Saved" : "Favorite"}</span>
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function ActionButton({ active, activeClass, onClick, label, children }) {
  // Pop the icon when the button toggles ON.
  const [pop, setPop] = useState(false);
  const handleClick = () => {
    if (!active) {
      setPop(true);
      setTimeout(() => setPop(false), 300);
    }
    onClick();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
        active
          ? activeClass
          : "border-zinc-200 bg-white text-zinc-600 hover:-translate-y-0.5 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      <span className={pop ? "animate-pop inline-flex" : "inline-flex"}>
        {children[0]}
      </span>
      {children[1]}
    </button>
  );
}

// The list of accordion items. Reactions are loaded once on mount and kept in
// state so the whole list stays in sync. Open/closed state lives here so the
// "expand/collapse all" button can control every item at once.
export function QuestionAccordion({ questions }) {
  const [reactions, setReactions] = useState({});
  const [openIds, setOpenIds] = useState(() => new Set());

  useEffect(() => {
    setReactions(loadReactions());
  }, []);

  const allOpen = questions.length > 0 && openIds.size === questions.length;

  const toggleAll = () => {
    setOpenIds(allOpen ? new Set() : new Set(questions.map((q) => q.id)));
  };

  const toggleOne = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleReact = (id, key, value) => {
    setReactions((prev) => {
      const next = { ...prev, [id]: { ...prev[id], [key]: value } };
      saveReactions(next);
      return next;
    });
  };

  return (
    <div className="mt-6">
      {/* Toolbar: expand/collapse all */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {openIds.size} of {questions.length} open
        </p>
        <button
          type="button"
          onClick={toggleAll}
          aria-pressed={allOpen}
          className="group inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm active:scale-95 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
        >
          <span className="transition-transform duration-300 group-hover:scale-110">
            {allOpen ? <CollapseAllIcon /> : <ExpandAllIcon />}
          </span>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <ul className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {questions.map((q, index) => (
          <QuestionItem
            key={q.id}
            question={q}
            reaction={reactions[q.id]}
            onReact={handleReact}
            open={openIds.has(q.id)}
            onToggle={() => toggleOne(q.id)}
            index={index}
          />
        ))}
      </ul>
    </div>
  );
}
