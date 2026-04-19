/**
 * Root marketing landing page — /
 *
 * Public, static. No org-specific content. Orgs are accessed directly by slug
 * (e.g. /acme) — they are not listed here by design (private / invite-only).
 */
export default function RootPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
          G2 Elite Pop-Up Store Platform
        </h1>

        <p className="mt-4 text-lg text-zinc-500 sm:text-xl">
          Host curated pop-up shops for your brand.
        </p>

        <div className="mt-10">
          <a
            href="mailto:admin@g2sync.com"
            className="inline-flex items-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80"
          >
            Run a pop-up? Contact us
          </a>
        </div>
      </div>
    </main>
  );
}
