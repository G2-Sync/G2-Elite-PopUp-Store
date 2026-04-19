'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type SignupResult =
  | { ok: false; error: string }
  | { ok: true; message: string };

export async function signupAction(formData: FormData): Promise<SignupResult> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const confirm = (formData.get('confirm') as string | null) ?? '';

  if (!email || !password || !confirm) {
    return { ok: false, error: 'All fields are required.' };
  }

  if (password !== confirm) {
    return { ok: false, error: 'Passwords do not match.' };
  }

  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  // Guard: only allowed when no super-admin exists yet
  const admin = createAdminClient();
  const { count } = await admin
    .from('super_admins')
    .select('user_id', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: 'Public signup is not available. Contact your administrator.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    message:
      'Account created. An administrator must grant you super-admin access before you can sign in.',
  };
}
