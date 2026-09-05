"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { ChatIcon, CloseIcon, SendIcon, SparkleIcon } from "./icons";

const SUGGESTIONS = [
  "Explain ACID properties",
  "What is a closure in JavaScript?",
  "Difference between clustered and non-clustered index",
];

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm your HikeReady prep assistant. Ask me about DSA, DBMS, .NET, or JavaScript interview topics.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    const userMsg = { role: "user", content };
    // History sent to the server (exclude the welcome banner).
    const history = messages.filter((m) => m !== WELCOME).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      // Non-streaming JSON error (e.g. no API key configured).
      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.message || "Something went wrong. Please try again in a moment.";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: msg };
          return next;
        });
        return;
      }

      // Stream the reply, appending chunks to the last assistant message.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Network error — please try again.",
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Is the last assistant message still empty (waiting for the first token)?
  const last = messages[messages.length - 1];
  const showTyping = busy && last?.role === "assistant" && !last.content;

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
          className="chat-bubble fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-110 active:scale-95"
        >
          <ChatIcon className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="chat-panel fixed bottom-5 right-5 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">HikeReady Assistant</p>
              <p className="text-xs text-white/80">Interview prep helper</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/20"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-msg flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "rounded-br-md bg-emerald-600 text-white"
                      : "rounded-bl-md border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  {m.role === "user" ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : m.content ? (
                    <div className="chat-markdown">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {showTyping && (
              <div className="chat-msg flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 text-emerald-500 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            {/* Suggestion chips (only before the first user message) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about an interview topic…"
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-zinc-400">
              AI can make mistakes. Verify important answers.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
