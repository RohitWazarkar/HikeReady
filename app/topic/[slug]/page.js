import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicBySlug } from "@/lib/queries";
import { QuestionAccordion } from "@/components/QuestionAccordion";
import { SITE } from "@/lib/site";

// Turn Markdown-ish answer text into a plain, trimmed snippet for SEO/JSON-LD.
function toPlainText(md, max = 500) {
  const text = (md || "")
    .replace(/```[\s\S]*?```/g, " ") // drop code blocks
    .replace(/[#>*_`|-]/g, " ") // drop md symbols
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links -> text
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Per-page SEO for each topic.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return { title: "Topic not found" };

  const catName = topic.category?.name ? `${topic.category.name} · ` : "";
  const title = `${topic.name} Questions`;
  const description = `${catName}${topic.questions.length} ${topic.name} interview questions with answers on ${SITE.name}.`;
  const url = `/topic/${topic.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} — ${SITE.name}`, description, url },
    twitter: { title: `${title} — ${SITE.name}`, description },
  };
}

// In this version of Next.js, `params` is a Promise and must be awaited.
export default async function TopicPage({ params }) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) notFound();

  // JSON-LD FAQ structured data — helps Google show these as Q&A rich results.
  const faqLd =
    topic.questions.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: topic.questions.slice(0, 50).map((q) => ({
            "@type": "Question",
            name: q.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: toPlainText(q.answerMd),
            },
          })),
        }
      : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
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
