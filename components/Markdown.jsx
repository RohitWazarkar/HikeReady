"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Renders a Markdown string with GitHub-flavored features (tables, etc.) and
// syntax-highlighted code blocks. Elements are styled directly with Tailwind so
// we don't need the typography plugin.
export function Markdown({ children }) {
  return (
    <div className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: (p) => <h1 className="mt-6 mb-3 text-2xl font-bold text-zinc-900 dark:text-white" {...p} />,
          h2: (p) => <h2 className="mt-6 mb-3 text-xl font-bold text-zinc-900 dark:text-white" {...p} />,
          h3: (p) => <h3 className="mt-5 mb-2 text-lg font-semibold text-zinc-900 dark:text-white" {...p} />,
          p: (p) => <p className="my-3" {...p} />,
          ul: (p) => <ul className="my-3 list-disc space-y-1 pl-6" {...p} />,
          ol: (p) => <ol className="my-3 list-decimal space-y-1 pl-6" {...p} />,
          li: (p) => <li className="marker:text-zinc-400" {...p} />,
          strong: (p) => <strong className="font-semibold text-zinc-900 dark:text-white" {...p} />,
          em: (p) => <em className="italic" {...p} />,
          a: (p) => <a className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700 dark:text-emerald-400" {...p} />,
          blockquote: (p) => (
            <blockquote
              className="my-4 border-l-4 border-emerald-300 bg-emerald-50/50 py-2 pl-4 text-zinc-600 italic dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-zinc-400"
              {...p}
            />
          ),
          // react-markdown v10 removed the `inline` prop, so we detect it:
          // fenced code blocks get a `language-*` className (added for the
          // block) and are wrapped in <pre>; inline code has neither.
          code({ className, children, ...props }) {
            const isBlock = /language-/.test(className || "");
            if (!isBlock) {
              return (
                <code
                  className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] text-rose-600 dark:bg-zinc-800 dark:text-rose-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={`hljs font-mono text-[13px] ${className ?? ""}`} {...props}>
                {children}
              </code>
            );
          },
          pre: (p) => (
            <pre
              className="my-4 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              {...p}
            />
          ),
          table: (p) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          thead: (p) => <thead className="bg-zinc-100 dark:bg-zinc-800" {...p} />,
          th: (p) => <th className="border border-zinc-200 px-3 py-2 text-left font-semibold dark:border-zinc-700" {...p} />,
          td: (p) => <td className="border border-zinc-200 px-3 py-2 align-top dark:border-zinc-800" {...p} />,
          hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-800" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
