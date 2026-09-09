import Link from "next/link";
import { getSectionBySlug, getDomainsForSection } from "@/lib/queries";
import { ArrowRightIcon, LayersIcon } from "@/components/icons";

export const metadata = {
  title: "Interview Questions",
  description: "Choose a domain: IT or Medical Coding.",
};

const DOMAIN_BANNERS = {
  it: "from-emerald-500 to-teal-500",
  "medical-coding": "from-sky-500 to-indigo-500",
};

// Domain slug -> banner image in /public (falls back to a gradient).
const DOMAIN_IMAGES = {
  it: "/it_domain.jpg",
  "medical-coding": "/medical_coding_hd_card_image_for_website.jpg",
};

export default async function InterviewPage() {
  const section = await getSectionBySlug("interview");
  const domains = section ? await getDomainsForSection(section.id) : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="text-zinc-700 dark:text-zinc-300">Interview Questions</span>
      </nav>

      <header className="animate-in">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Interview Questions
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Choose a domain to explore its subjects.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {domains.map((d, i) => (
          <Link
            key={d.id}
            href={`/interview/${d.slug}`}
            style={{ animationDelay: `${i * 80}ms` }}
            className="animate-in group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
          >
            <div className={`relative flex h-36 items-center justify-center overflow-hidden ${DOMAIN_IMAGES[d.slug] ? "" : `bg-gradient-to-br ${DOMAIN_BANNERS[d.slug] ?? "from-zinc-500 to-zinc-600"}`}`}>
              {DOMAIN_IMAGES[d.slug] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DOMAIN_IMAGES[d.slug]}
                    alt={d.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-lg font-bold text-white drop-shadow">
                    {d.name}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-black tracking-tight text-white/90 drop-shadow-sm">
                  {d.name}
                </span>
              )}
              <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur">
                <LayersIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                  {d.name}
                </h2>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-zinc-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-zinc-600" />
              </div>
              {d.description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {d.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
