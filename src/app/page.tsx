import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        {/* Eyebrow */}
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
          G2 Elite
        </p>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
          Pop-Up Store
        </h1>

        {/* Tagline */}
        <p className="mt-6 text-lg leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-xl">
          Limited drops. Curated goods.&nbsp;
          <span className="text-zinc-700 dark:text-zinc-300">Shop while it lasts.</span>
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus:ring-zinc-100"
          >
            Shop Now
          </Link>
        </div>

        {/* Decorative divider */}
        <div className="mt-20 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Limited availability
          </span>
          <span className="h-px w-16 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
