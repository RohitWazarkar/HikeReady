"use client";

import { useState } from "react";
import { useToast } from "./Toast";
import { SendIcon } from "./icons";

const SUBJECTS = [
  { value: "General", label: "General question" },
  { value: "Bug", label: "Report a bug" },
  { value: "Feedback", label: "Feedback" },
  { value: "Content", label: "Suggest a question / topic" },
  { value: "Partnership", label: "Partnership" },
];

export function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General",
    message: "",
  });
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;

    // Light client-side validation (server validates too).
    if (form.name.trim().length < 2) return toast.warn("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return toast.warn("Please enter a valid email.");
    if (form.message.trim().length < 10)
      return toast.warn("Message should be at least 10 characters.");

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Message sent!", "Thanks — we'll get back to you soon.");
        setForm({ name: "", email: "", subject: "General", message: "" });
      } else {
        toast.error("Couldn't send", data.error || "Please try again.");
      }
    } catch {
      toast.error("Network error", "Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-white";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={update("name")}
            placeholder="Your name"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Subject
        </label>
        <select value={form.subject} onChange={update("subject")} className={inputCls}>
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Message
        </label>
        <textarea
          rows={5}
          value={form.message}
          onChange={update("message")}
          placeholder="How can we help?"
          className={`${inputCls} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SendIcon className="h-4 w-4" />
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
