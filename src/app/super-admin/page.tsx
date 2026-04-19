import Link from 'next/link';

/**
 * Super admin dashboard — /super-admin
 */
export default function SuperAdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Welcome, super admin.
      </h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Manage organizations here.
      </p>

      <Link
        href="/super-admin/organizations"
        className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        View Organizations
      </Link>
    </main>
  );
}
