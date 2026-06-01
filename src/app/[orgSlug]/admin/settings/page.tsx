import { getOrgContext } from '@/lib/org/context';
import BrandingForm from './_form';
import ChangePasswordForm from './_change-password-form';

interface SettingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Storefront Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Customize branding for <span className="font-medium text-zinc-700">{org.name}</span>.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <BrandingForm org={org} />
      </div>

      {/* Account — change password */}
      <div className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900">Account</h2>
        <p className="mt-1 text-sm text-zinc-500">Change the password for your own login.</p>
        <div className="mt-4 max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
