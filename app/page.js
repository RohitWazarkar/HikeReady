import Link from "next/link";
import { getCategoriesWithCounts } from "@/lib/queries";
import { LinkCard } from "@/components/Card";

// Server component: data is fetched on the server before the page is sent.
export default async function Home() {
  const categories = await getCategoriesWithCounts();
  const totalTopics = categories.reduce((sum, c) => sum + c.topicCount, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-20 dark:border-zinc-800 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/30">
        {/* Floating decorative blobs */}
        <div
          className="animate-float pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20"
          aria-hidden="true"
        />
        <div
          className="animate-float pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-700/20"
          style={{ animationDelay: "3s" }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="animate-in mb-5 inline-block rounded-full border border-emerald-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-emerald-700 backdrop-blur dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            Interview prep, made simple
          </span>
          <h1
            className="animate-in text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl dark:text-white"
            style={{ animationDelay: "80ms" }}
          >
            Get{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              HikeReady
            </span>
          </h1>
          <p
            className="animate-in mx-auto mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400"
            style={{ animationDelay: "160ms" }}
          >
            Curated questions across DSA, DBMS, and JavaScript with clean answers,
            code samples, and difficulty levels to guide your prep.
          </p>
          <div
            className="animate-in mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/category/dsa"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
            >
              Start with DSA
            </Link>
            <Link
              href="#categories"
              className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Browse all
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl justify-around text-center">
          <Stat label="Categories" value={categories.length} index={0} />
          <Stat label="Topics" value={totalTopics} index={1} />
          <Stat label="Free & Premium" value="Mix" index={2} />
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Browse categories
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Pick a category to explore its topics and questions.
        </p>

        {categories.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
            No categories yet. Run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
              npm run seed
            </code>{" "}
            to add sample data.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <LinkCard
                key={c.id}
                index={i}
                href={`/category/${c.slug}`}
                title={c.name}
                subtitle={c.description}
                meta={`${c.topicCount} ${c.topicCount === 1 ? "topic" : "topics"}`}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, index = 0 }) {
  return (
    <div
      className="animate-in"
      style={{ animationDelay: `${320 + index * 80}ms` }}
    >
      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
        {value}
      </p>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  );
}
