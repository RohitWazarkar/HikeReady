import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { MailIcon, ChatIcon, HelpIcon, SparkleIcon } from "@/components/icons";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the HikeReady team — questions, feedback, or content suggestions.",
};

// TODO: replace these placeholders with your real details.
const CONTACT = {
  email: "hello@hikeready.dev",
  github: "https://github.com/RohitWazarkar/HikeReady",
  responseTime: "We usually reply within 1-2 days.",
};

const FAQ = [
  { q: "Is HikeReady free?", a: "Yes — the core interview questions are free. Some advanced content may be premium later." },
  { q: "Found a wrong answer?", a: "Use the form and pick 'Report a bug' — include the question title." },
  { q: "Can I suggest questions?", a: "Please do! Choose 'Suggest a question / topic' in the form." },
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="text-zinc-700 dark:text-zinc-300">Contact Us</span>
      </nav>

      {/* Header */}
      <header className="animate-in">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Contact Us
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Questions, feedback, or a topic you'd like us to add? Drop us a message.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <section
          className="animate-in rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900"
          style={{ animationDelay: "60ms" }}
        >
          <h2 className="mb-5 text-lg font-semibold text-zinc-900 dark:text-white">
            Send a message
          </h2>
          <ContactForm />
        </section>

        {/* Side cards */}
        <aside className="space-y-6">
          {/* Get in touch */}
          <div
            className="animate-in rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            style={{ animationDelay: "120ms" }}
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Get in touch
            </h3>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-3 flex items-center gap-2.5 text-sm text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              <MailIcon className="h-4 w-4 shrink-0" />
              {CONTACT.email}
            </a>
            <a
              href={CONTACT.github}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-2.5 text-sm text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              <SparkleIcon className="h-4 w-4 shrink-0" />
              GitHub repository
            </a>
            <p className="mt-3 text-xs text-zinc-400">{CONTACT.responseTime}</p>
          </div>

          {/* Before you reach out */}
          <div
            className="animate-in rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            style={{ animationDelay: "200ms" }}
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Before you reach out
            </h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                <ChatIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>Try the AI assistant (bottom-right) for instant answers.</span>
              </div>
              <Link
                href="/practice"
                className="flex items-start gap-2.5 text-sm text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
              >
                <HelpIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>Browse practice questions</span>
              </Link>
            </div>

            <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              FAQ
            </h4>
            <dl className="mt-2 space-y-3">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {f.q}
                  </dt>
                  <dd className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
