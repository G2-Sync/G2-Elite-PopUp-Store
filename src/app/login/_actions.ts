'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type LoginResult =
  | { ok: false; error: string }
  | { ok: true; redirectTo: string };

/**
 * Sign-in server action.
 *
 * IMPORTANT: We return a redirectTo string instead of calling redirect()
 * from inside the action. Next.js's redirect() inside server actions
 * has had issues stripping cookie attributes (especially Domain) from
 * the response in some deployment configurations. By returning the
 * target and letting the client navigate with router.push(), we ensure
 * the cookies set by signInWithPassword make it to the browser intact.
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? 'Invalid email or password.' };
  }

  const userId = data.user.id;
  const admin = createAdminClient();

  // Check if super-admin
  const { data: saRow } = await admin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (saRow) {
    return { ok: true, redirectTo: '/super-admin' };
  }

  // Check if org admin — find first org membership, then look up the slug
  const memberRes = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  const memberRow = memberRes.data as { organization_id: string } | null;

  if (memberRow?.organization_id) {
    const orgRes = await admin
      .from('organizations')
      .select('slug')
      .eq('id', memberRow.organization_id)
      .maybeSingle();
    const orgRow = orgRes.data as { slug: string } | null;
    if (orgRow?.slug) {
      return { ok: true, redirectTo: `/${orgRow.slug}/admin` };
    }
  }

  // Authenticated but no role assigned
  return { ok: true, redirectTo: '/?notice=account-not-linked' };
}
