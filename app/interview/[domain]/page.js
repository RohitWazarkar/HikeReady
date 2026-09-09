import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomainBySlug, getCategoriesForDomain } from "@/lib/queries";
import { ListIcon, HelpIcon, ArrowRightIcon, LayersIcon, SparkleIcon } from "@/components/icons";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const d = await getDomainBySlug(domain);
  if (!d) return { title: "Domain not found" };
  return { title: `${d.name} — Interview Questions`, description: d.description };
}

const BANNERS = [
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-indigo-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

const SUBJECT_IMAGES = {
  dotnet: "/DotNet.png",
  dbms: "/DBMS.jpg",
  javascript: "/JS.jpg",
  "react-node": "/ReactNode.jpg",
  dsa: "/DSA.webp",
};

export default async function DomainPage({ params }) {
  const { domain } = await params;
  const d = await getDomainBySlug(domain);
  if (!d) notFound();

  const subjects = await getCategoriesForDomain(d.id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <Link href="/interview" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Interview Questions
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="text-zinc-700 dark:text-zinc-300">{d.name}</span>
      </nav>

      <header className="animate-in">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {d.name}
        </h1>
        {d.description && (
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{d.description}</p>
        )}
      </header>

      {subjects.length === 0 ? (
        <div className="animate-in mt-10 flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <SparkleIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Coming soon
          </h2>
          <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            We&apos;re preparing {d.name} content. Check back shortly.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((c, i) => (
            <SubjectCard
              key={c.id}
              subject={c}
              banner={BANNERS[i % BANNERS.length]}
              image={SUBJECT_IMAGES[c.slug] ?? null}
              index={i}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function SubjectCard({ subject, banner, image, index }) {
  const total = Math.max(subject.questionCount, 1);
  const d = subject.difficulty;

  return (
    <Link
      href={`/category/${subject.slug}`}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-in group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
    >
      <div className={`relative flex h-32 items-center justify-center overflow-hidden ${image ? "" : `bg-gradient-to-br ${banner}`}`}>
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={subject.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow">
              {subject.name}
            </span>
          </>
        ) : (
          <span className="text-5xl font-black tracking-tight text-white/90 drop-shadow-sm">
            {subject.name.charAt(0)}
          </span>
        )}
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur">
          <LayersIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
            {subject.name}
          </h2>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-zinc-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-zinc-600" />
        </div>
        {subject.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {subject.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <ListIcon className="h-3.5 w-3.5" />
            {subject.topicCount} topics
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HelpIcon className="h-3.5 w-3.5" />
            {subject.questionCount} questions
          </span>
        </div>

        <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <span className="bg-emerald-500" style={{ width: `${(d.Easy / total) * 100}%` }} />
          <span className="bg-amber-500" style={{ width: `${(d.Medium / total) * 100}%` }} />
          <span className="bg-rose-500" style={{ width: `${(d.Hard / total) * 100}%` }} />
        </div>
      </div>
    </Link>
  );
}
