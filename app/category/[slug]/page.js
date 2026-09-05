import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/queries";
import { LinkCard } from "@/components/Card";

// In this version of Next.js, `params` is a Promise and must be awaited.
export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="text-zinc-700 dark:text-zinc-300">{category.name}</span>
      </nav>

      {/* Header */}
      <header className="animate-in rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-8 dark:border-zinc-800 dark:from-emerald-950/30 dark:to-zinc-900">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {category.description}
          </p>
        ) : null}
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {category.topics.length} {category.topics.length === 1 ? "topic" : "topics"}
        </p>
      </header>

      {/* Topics */}
      <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-white">
        Topics
      </h2>

      {category.topics.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
          No topics in this category yet.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {category.topics.map((t, i) => (
            <LinkCard
              key={t.id}
              index={i}
              href={`/topic/${t.slug}`}
              title={t.name}
              meta={`${t.questionCount} ${
                t.questionCount === 1 ? "question" : "questions"
              }`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
