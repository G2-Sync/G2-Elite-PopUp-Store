import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Organization, OrganizationMember } from '@/lib/supabase/types';
import EditOrgForm from './_edit-form';
import AdminSection from './_admin-section';

interface EditOrgPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit organization page — /super-admin/organizations/[id]
 *
 * Fetches the org and its current admin member (if any), then renders:
 *  - The editable org form
 *  - The Organization Admin invite/manage section
 *
 * Auth guard is in the parent layout.
 * Next.js 16 async params — must be awaited.
 */
export default async function EditOrgPage({ params }: EditOrgPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  // Fetch org
  const { data: orgData, error } = await admin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !orgData) {
    notFound();
  }

  const org = orgData as Organization;

  // Fetch current admin member (if any)
  const { data: memberData } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', id)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  const member = memberData as Pick<OrganizationMember, 'user_id'> | null;

  // Resolve admin email via auth.admin
  let adminEmail: string | null = null;
  if (member) {
    const { data: userData } = await admin.auth.admin.getUserById(member.user_id);
    adminEmail = userData?.user?.email ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/super-admin/organizations" className="hover:text-zinc-900">
          Organizations
        </Link>
        <span>/</span>
        <span className="font-mono text-zinc-900">{org.slug}</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900">{org.name}</h1>
      <p className="mb-8 font-mono text-xs text-zinc-400">{org.slug}</p>

      {/* Main edit form */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <EditOrgForm org={org} />
      </div>

      {/* Admin section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-zinc-900">Organization Admin</h2>
        <p className="mb-5 text-sm text-zinc-500">
          The admin can manage products, categories, and orders for this organization.
        </p>
        <AdminSection
          orgId={org.id}
          adminUserId={member?.user_id ?? null}
          adminEmail={adminEmail}
        />
      </div>
    </main>
  );
}
