import Link from "next/link";
import { ArrowRightIcon, SparkleIcon } from "@/components/icons";

export const metadata = {
  title: "Coming soon",
  description: "This feature is under development.",
};

export default function DevelopmentPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="animate-float flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        <SparkleIcon className="h-8 w-8" />
      </span>

      <h1 className="animate-in mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Development in progress
      </h1>
      <p
        className="animate-in mt-3 max-w-md text-zinc-600 dark:text-zinc-400"
        style={{ animationDelay: "80ms" }}
      >
        We&apos;re building this feature. It&apos;s not ready just yet — check
        back soon. In the meantime, explore the interview questions.
      </p>

      <Link
        href="/practice"
        className="animate-in mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
        style={{ animationDelay: "160ms" }}
      >
        Start practicing <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </main>
  );
}
