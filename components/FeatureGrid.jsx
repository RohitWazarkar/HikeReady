"use client";

import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import {
  HelpIcon,
  FileTextIcon,
  CheckSquareIcon,
  GaugeIcon,
  PlayCircleIcon,
  ArrowRightIcon,
} from "./icons";

// The main home features. Card #1 navigates to /practice; the rest are "coming
// soon" and show a development-in-progress alert on click.
const FEATURES = [
  {
    key: "interview",
    title: "Interview Questions",
    description: "Curated questions across DSA, DBMS, .NET, JavaScript, and more.",
    icon: FileTextIcon,
    tone: "emerald",
    image: "/interview_Questionsimage_for_card_option_in_website.jpg",
    href: "/interview",
    ready: true,
  },
  {
    key: "mcq",
    title: "MCQ Mock Tests",
    description: "Timed multiple-choice tests to check your readiness.",
    icon: CheckSquareIcon,
    tone: "violet",
    image: "/mcq_mock_test_card_image_for_website.jpg",
    href: "/section/mcq",
    ready: true,
    soon: true,
  },
  {
    key: "resume",
    title: "AI Resume Builder",
    description: "Generate a polished, ATS-friendly resume with AI assistance.",
    icon: FileTextIcon,
    tone: "sky",
    image: "/Resume_Builder_By_AI.jpg",
    href: "/section/resume",
    ready: true,
    soon: true,
  },
  {
    key: "score",
    title: "Resume Eligibility Score",
    description: "Upload a resume and get an instant eligibility score.",
    icon: GaugeIcon,
    tone: "amber",
    image: "/Resume_eligibility_score_card_image_for_website.jpg",
    ready: false,
  },
  {
    key: "tutorials",
    title: "From-Scratch Tutorials",
    description: "Step-by-step tutorials to learn concepts from the ground up.",
    icon: PlayCircleIcon,
    tone: "rose",
    image: "/tutorials_from_the_scratch_learning.jpg",
    href: "/section/tutorials",
    ready: true,
    soon: true,
  },
];

const TONES = {
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
};

export function FeatureGrid() {
  const router = useRouter();
  const toast = useToast();

  const handleClick = (feature) => {
    if (feature.ready) {
      router.push(feature.href);
    } else {
      // Card is not built yet — show a friendly toast instead of a browser alert.
      toast.info(
        `${feature.title} — coming soon`,
        "This feature is under development. Check back shortly!"
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, i) => {
        const Icon = f.icon;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => handleClick(f)}
            style={{ animationDelay: `${i * 70}ms` }}
            className="animate-in group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
          >
            {/* "Soon" ribbon for features whose content is still in progress */}
            {(f.soon || !f.ready) && (
              <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 shadow-sm backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-300">
                Soon
              </span>
            )}

            {/* Banner: image if available, otherwise an icon tile. */}
            {f.image ? (
              <div className="relative h-32 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.image}
                  alt={f.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <Icon className="h-7 w-7" />
                </span>
              </div>
            )}

            {/* Body */}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-base font-semibold text-zinc-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                {f.title}
              </h3>
              <p className="mt-1 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
                {f.description}
              </p>

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {!f.ready ? "Coming soon" : f.soon ? "Preview" : "Get started"}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
