'use server';

import { createClient } from '@/lib/supabase/server';

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Changes the currently-authenticated user's password.
 *
 * Any logged-in user (super-admin or org admin) can change their OWN
 * password here. Uses the session-scoped server client so it only ever
 * affects the caller's account.
 */
export async function changePasswordAction(
  newPassword: string
): Promise<ChangePasswordResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'You are not signed in.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
