import { SITE, getSiteUrl } from "@/lib/site";
import { FeatureGrid } from "@/components/FeatureGrid";

// Home page: a welcome bar + the main feature cards.
export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.description,
    url: getSiteUrl(),
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Welcome bar */}
      <section className="animate-in rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/30">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Welcome to HikeReady 👋
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          What would you like to do today?
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Practice interview questions, build your resume, take mock tests, and more.
        </p>
      </section>

      {/* Feature cards */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
          Explore
        </h2>
        <FeatureGrid />
      </section>
    </main>
  );
}
