export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 text-center dark:from-zinc-900 dark:to-black">
      <span className="mb-4 inline-block rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        Interview prep, made simple
      </span>
      <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
        HikeReady
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Get ready for your next hike in your career. More coming soon.
      </p>
    </main>
  );
}
