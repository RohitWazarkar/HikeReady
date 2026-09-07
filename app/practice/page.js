import Link from "next/link";
import { getPracticeCategories } from "@/lib/queries";
import { ListIcon, HelpIcon, ArrowRightIcon, LayersIcon } from "@/components/icons";

export const metadata = {
  title: "Practice",
  description: "Browse all HikeReady categories and start practicing interview questions.",
};

// A set of distinct gradients used as a fallback banner when a category has no
// image yet.
const BANNERS = [
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-indigo-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

// Category slug -> banner image in /public. Categories not listed here fall
// back to a gradient banner. Add new entries as you add images.
const CATEGORY_IMAGES = {
  dotnet: "/DotNet.png",
  dbms: "/DBMS.jpg",
  javascript: "/JS.jpg",
  "react-node": "/ReactNode.jpg",
  dsa: "/DSA.webp",
};

export default async function PracticePage() {
  const categories = await getPracticeCategories();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="text-zinc-700 dark:text-zinc-300">Practice</span>
      </nav>

      {/* Header */}
      <header className="animate-in">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Choose a category
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Pick an area to practice. Each category has topics with questions across
          Easy, Medium, and Hard difficulty.
        </p>
      </header>

      {/* Category cards */}
      {categories.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          No categories yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <PracticeCard
              key={c.id}
              category={c}
              banner={BANNERS[i % BANNERS.length]}
              image={CATEGORY_IMAGES[c.slug] ?? null}
              index={i}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function PracticeCard({ category, banner, image, index }) {
  const total = Math.max(category.questionCount, 1);
  const d = category.difficulty;

  return (
    <Link
      href={`/category/${category.slug}`}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-in group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
    >
      {/* Banner: real image if available, otherwise a gradient fallback. */}
      <div className={`relative flex h-32 items-center justify-center overflow-hidden ${image ? "" : `bg-gradient-to-br ${banner}`}`}>
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* subtle dark gradient so the name chip stays readable */}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow">
              {category.name}
            </span>
          </>
        ) : (
          <span className="text-5xl font-black tracking-tight text-white/90 drop-shadow-sm">
            {category.name.charAt(0)}
          </span>
        )}
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur">
          <LayersIcon className="h-4 w-4" />
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
            {category.name}
          </h2>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-zinc-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-zinc-600" />
        </div>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {category.description}
          </p>
        )}

        {/* Counts */}
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

        {/* Difficulty spread bar */}
        <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <span className="bg-emerald-500" style={{ width: `${(d.Easy / total) * 100}%` }} />
          <span className="bg-amber-500" style={{ width: `${(d.Medium / total) * 100}%` }} />
          <span className="bg-rose-500" style={{ width: `${(d.Hard / total) * 100}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> {d.Easy} Easy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> {d.Medium} Medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> {d.Hard} Hard
          </span>
        </div>
      </div>
    </Link>
  );
}
