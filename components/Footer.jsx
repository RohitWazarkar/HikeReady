import Link from "next/link";
import { MountainIcon } from "./icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <MountainIcon className="h-5 w-5 text-emerald-600" />
            <span className="text-lg font-bold">HikeReady</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Interview prep to level up your career, one question at a time.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">Explore</span>
            <Link href="/" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
              Home
            </Link>
            <Link href="/category/dsa" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
              DSA
            </Link>
            <Link href="/category/javascript" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
              JavaScript
            </Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400 dark:border-zinc-900">
        © {year} HikeReady. Built with Next.js & Tailwind CSS.
      </div>
    </footer>
  );
}
