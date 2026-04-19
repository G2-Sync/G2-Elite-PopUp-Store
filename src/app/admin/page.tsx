import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — G2 Elite Pop-Up Store',
};

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Admin
      </h1>
      <p className="mt-4 text-zinc-500 dark:text-zinc-400">
        Product and order management dashboard — coming soon.
      </p>
    </main>
  );
}
