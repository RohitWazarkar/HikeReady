import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicBySlug } from "@/lib/queries";
import { QuestionAccordion } from "@/components/QuestionAccordion";

// In this version of Next.js, `params` is a Promise and must be awaited.
export default async function TopicPage({ params }) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        {topic.category ? (
          <>
            <Link
              href={`/category/${topic.category.slug}`}
              className="hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {topic.category.name}
            </Link>{" "}
            <span aria-hidden="true">/</span>{" "}
          </>
        ) : null}
        <span className="text-zinc-700 dark:text-zinc-300">{topic.name}</span>
      </nav>

      {/* Header */}
      <header className="animate-in">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {topic.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {topic.questions.length}{" "}
          {topic.questions.length === 1 ? "question" : "questions"}
        </p>
      </header>

      {/* Questions list */}
      {topic.questions.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
          No published questions in this topic yet.
        </p>
      ) : (
        <QuestionAccordion questions={topic.questions} />
      )}
    </main>
  );
}
