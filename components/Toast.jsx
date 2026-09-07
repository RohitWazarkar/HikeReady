"use client";

import { createContext, useCallback, useContext, useState } from "react";
import {
  InfoIcon,
  WarnIcon,
  ErrorIcon,
  SuccessIcon,
  CloseIcon,
} from "./icons";

// -----------------------------------------------------------------------------
// Reusable toast notifications.
//
// Usage anywhere in a client component:
//   const toast = useToast();
//   toast.info("Heads up", "Some detail");
//   toast.warn("Careful");
//   toast.error("Something failed");
//   toast.success("Saved!");
//
// Mount <ToastProvider> once near the root (done in app/layout.js).
// -----------------------------------------------------------------------------

const ToastContext = createContext(null);

const VARIANTS = {
  info: {
    Icon: InfoIcon,
    ring: "border-sky-200 dark:border-sky-900",
    iconWrap: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
    bar: "bg-sky-500",
  },
  warn: {
    Icon: WarnIcon,
    ring: "border-amber-200 dark:border-amber-900",
    iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  error: {
    Icon: ErrorIcon,
    ring: "border-rose-200 dark:border-rose-900",
    iconWrap: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    bar: "bg-rose-500",
  },
  success: {
    Icon: SuccessIcon,
    ring: "border-emerald-200 dark:border-emerald-900",
    iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    // Mark as leaving so it can play the exit animation, then remove.
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const show = useCallback(
    (type, title, message, duration = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = {
    info: (title, message, duration) => show("info", title, message, duration),
    warn: (title, message, duration) => show("warn", title, message, duration),
    error: (title, message, duration) => show("error", title, message, duration),
    success: (title, message, duration) => show("success", title, message, duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast viewport: fixed, top-right, stacked. */}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((t) => {
          const v = VARIANTS[t.type] ?? VARIANTS.info;
          const Icon = v.Icon;
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-white shadow-lg dark:bg-zinc-900 ${v.ring} ${
                t.leaving ? "toast-out" : "toast-in"
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${v.iconWrap}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  {t.title && (
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {t.title}
                    </p>
                  )}
                  {t.message && (
                    <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                      {t.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
              {/* Auto-dismiss progress bar */}
              {t.duration > 0 && !t.leaving && (
                <span
                  className={`toast-progress absolute bottom-0 left-0 h-0.5 w-full ${v.bar}`}
                  style={{ animationDuration: `${t.duration}ms` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to trigger toasts. Safe no-op if used outside the provider.
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      info: () => {},
      warn: () => {},
      error: () => {},
      success: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
