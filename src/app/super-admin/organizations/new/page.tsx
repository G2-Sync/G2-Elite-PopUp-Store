import Link from 'next/link';
import NewOrgForm from './_form';

/**
 * Create organization page — /super-admin/organizations/new
 *
 * Auth guard is in the parent layout. This page is a thin server wrapper
 * around the client-side NewOrgForm component.
 */
export default function NewOrganizationPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/super-admin/organizations" className="hover:text-zinc-900">
          Organizations
        </Link>
        <span>/</span>
        <span className="text-zinc-900">New</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">
        Create organization
      </h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <NewOrgForm />
      </div>
    </main>
  );
}
