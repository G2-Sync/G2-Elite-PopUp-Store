'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type SetPasswordResult =
  | { ok: false; error: string }
  | { ok: true; redirectTo: string };

/**
 * Sets a new password for the currently-authenticated (recovery-session) user
 * and figures out where to send them afterward (super-admin, their org admin,
 * or home).
 *
 * Requires an active session — which the user has after clicking the
 * invite / password-reset email link and passing through /auth/callback.
 */
export async function setPasswordAction(password: string): Promise<SetPasswordResult> {
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: 'Your reset link has expired. Please request a new invite email.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: error.message };
  }

  // Decide where to send them based on their role.
  const admin = createAdminClient();

  const { data: sa } = await admin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (sa) {
    return { ok: true, redirectTo: '/super-admin' };
  }

  const { data: member } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const memberRow = member as { organization_id: string } | null;
  if (memberRow?.organization_id) {
    const { data: orgRow } = await admin
      .from('organizations')
      .select('slug')
      .eq('id', memberRow.organization_id)
      .maybeSingle();
    const org = orgRow as { slug: string } | null;
    if (org?.slug) {
      return { ok: true, redirectTo: `/${org.slug}/admin` };
    }
  }

  return { ok: true, redirectTo: '/' };
}
