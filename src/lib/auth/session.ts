import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------

/**
 * Returns the currently authenticated Supabase user, or null if not logged in.
 * Uses the server client so RLS applies via the user's session cookie.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ---------------------------------------------------------------------------
// requireUser
// ---------------------------------------------------------------------------

/**
 * Returns the current user. Redirects to /login if no session exists.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

// ---------------------------------------------------------------------------
// isCurrentUserSuperAdmin
// ---------------------------------------------------------------------------

/**
 * Returns true if the current user's id is in the super_admins table.
 * Returns false when there is no session.
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Use the admin client so we can read super_admins regardless of RLS policy.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

// ---------------------------------------------------------------------------
// requireSuperAdmin
// ---------------------------------------------------------------------------

/**
 * Ensures the current user is a super-admin.
 * Redirects to /login if not authenticated.
 * Redirects to / if authenticated but not a super-admin.
 */
export async function requireSuperAdmin() {
  const user = await requireUser(); // redirects to /login if no session
  const isSuperAdmin = await isCurrentUserSuperAdmin();
  if (!isSuperAdmin) {
    redirect('/');
  }
  return user;
}

// ---------------------------------------------------------------------------
// isCurrentUserOrgAdmin
// ---------------------------------------------------------------------------

/**
 * Returns true if the current user is an admin member of the given org.
 * Super-admins are treated as admins of every org (so they can test + support
 * any tenant without needing a separate invited account).
 */
export async function isCurrentUserOrgAdmin(orgId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Super-admins have implicit admin access to every org.
  if (await isCurrentUserSuperAdmin()) return true;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

// ---------------------------------------------------------------------------
// requireOrgAdmin
// ---------------------------------------------------------------------------

/**
 * Ensures the current user is an admin of the given org.
 * Redirects to /login if not authenticated.
 * Redirects to / if authenticated but not an org admin.
 */
export async function requireOrgAdmin(orgId: string) {
  const user = await requireUser();
  const isAdmin = await isCurrentUserOrgAdmin(orgId);
  if (!isAdmin) {
    redirect('/');
  }
  return user;
}
