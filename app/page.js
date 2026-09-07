import Link from "next/link";
import { getHomeStats } from "@/lib/queries";
import { SITE, getSiteUrl } from "@/lib/site";
import { DifficultyBadge, PremiumBadge } from "@/components/Badge";
import {
  LayersIcon,
  ListIcon,
  HelpIcon,
  SparkleIcon,
  ArrowRightIcon,
} from "@/components/icons";

// Dashboard-style home page (inspired by the provided mockup): a welcome bar,
// metric cards, a main category grid, and a side panel with breakdowns.
export default async function Home() {
  const { totals, difficulty, categoryStats, recent } = await getHomeStats();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.description,
    url: getSiteUrl(),
  };

  const totalForBar = Math.max(totals.questions, 1);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Welcome bar */}
      <section className="animate-in flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/30">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Welcome back 👋
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Your interview prep dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {totals.questions} questions across {totals.categories} categories.
            Pick up where you left off.
          </p>
        </div>
        <Link
          href="/practice"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 sm:self-auto"
        >
          Start practicing <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </section>

      {/* Metric cards */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard index={0} icon={<LayersIcon />} label="Categories" value={totals.categories} tone="emerald" />
        <MetricCard index={1} icon={<ListIcon />} label="Topics" value={totals.topics} tone="sky" />
        <MetricCard index={2} icon={<HelpIcon />} label="Questions" value={totals.questions} tone="violet" />
        <MetricCard index={3} icon={<SparkleIcon />} label="Premium" value={totals.premium} tone="amber" />
      </section>

      {/* Main grid: categories (left) + side panel (right) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Categories */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Categories
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categoryStats.map((c, i) => (
              <CategoryCard key={c.id} category={c} index={i} />
            ))}
            {categoryStats.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
                No categories yet.
              </p>
            )}
          </div>
        </section>

        {/* Side panel */}
        <aside className="space-y-6">
          {/* Difficulty breakdown */}
          <div
            className="animate-in rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            style={{ animationDelay: "120ms" }}
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Difficulty breakdown
            </h3>
            <div className="mt-4 space-y-3">
              <DifficultyBar label="Easy" value={difficulty.Easy} total={totalForBar} color="bg-emerald-500" />
              <DifficultyBar label="Medium" value={difficulty.Medium} total={totalForBar} color="bg-amber-500" />
              <DifficultyBar label="Hard" value={difficulty.Hard} total={totalForBar} color="bg-rose-500" />
            </div>
          </div>

          {/* Recently added */}
          <div
            className="animate-in rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            style={{ animationDelay: "200ms" }}
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Recently added
            </h3>
            <ul className="mt-3 space-y-1">
              {recent.map((q) => (
                <li key={q.id}>
                  <Link
                    href={q.topicSlug ? `/topic/${q.topicSlug}` : "#"}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-800 group-hover:text-emerald-700 dark:text-zinc-200 dark:group-hover:text-emerald-300">
                        {q.title}
                      </span>
                      {q.categoryName && (
                        <span className="block truncate text-xs text-zinc-400">
                          {q.categoryName}
                        </span>
                      )}
                    </span>
                    <DifficultyBadge difficulty={q.difficulty} />
                  </Link>
                </li>
              ))}
              {recent.length === 0 && (
                <li className="px-2 py-2 text-sm text-zinc-500">Nothing yet.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

// --- Sub-components ---------------------------------------------------------

const TONES = {
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

function MetricCard({ icon, label, value, tone, index }) {
  return (
    <div
      className="animate-in flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONES[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-zinc-900 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function CategoryCard({ category, index }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-in group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
          {category.name}
        </h3>
        <ArrowRightIcon className="h-4 w-4 text-zinc-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-zinc-600" />
      </div>
      {category.description && (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {category.description}
        </p>
      )}
      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <ListIcon className="h-3.5 w-3.5" />
          {category.topicCount} topics
        </span>
        <span className="inline-flex items-center gap-1.5">
          <HelpIcon className="h-3.5 w-3.5" />
          {category.questionCount} questions
        </span>
      </div>
    </Link>
  );
}

function DifficultyBar({ label, value, total, color }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="text-zinc-400">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
