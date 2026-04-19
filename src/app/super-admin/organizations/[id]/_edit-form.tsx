'use client';

import { useState, useTransition } from 'react';
import { updateOrganization, toggleOrgActive, uploadOrgAsset } from '../_actions';
import type { Organization } from '@/lib/supabase/types';

const FONT_OPTIONS = [
  'Inter',
  'Playfair Display',
  'Poppins',
  'Roboto',
  'Space Grotesk',
  'Merriweather',
] as const;

interface EditOrgFormProps {
  org: Organization;
}

export default function EditOrgForm({ org }: EditOrgFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(org.is_active);
  const [primaryColor, setPrimaryColor] = useState(org.primary_color);
  const [accentColor, setAccentColor] = useState(org.accent_color);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    formData.set('is_active', isActive ? 'true' : 'false');
    startTransition(async () => {
      const result = await updateOrganization(org.id, formData);
      if (result.ok) {
        setSuccess('Organization updated.');
      } else {
        setError(result.error);
      }
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      const result = await toggleOrgActive(org.id);
      if (result.ok) {
        setIsActive((prev) => !prev);
        setSuccess(`Organization ${isActive ? 'deactivated' : 'activated'}.`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Basics */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Basics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Slug</label>
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              <span className="font-mono text-sm text-zinc-500">{org.slug}</span>
            </div>
            <p className="text-xs text-zinc-400">Slug cannot be changed after creation</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              Organization name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={org.name}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="tagline" className="text-sm font-medium text-zinc-700">
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              defaultValue={org.tagline ?? ''}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact_email" className="text-sm font-medium text-zinc-700">
              Contact email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={org.contact_email ?? ''}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5 justify-center">
            <label className="text-sm font-medium text-zinc-700">Status</label>
            <div className="flex items-center gap-3">
              <span
                className={
                  isActive
                    ? 'inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                    : 'inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500'
                }
              >
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isPending}
                className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900 disabled:opacity-50"
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Colors */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Colors</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ColorField
            id="primary_color"
            name="primary_color"
            label="Primary color"
            value={primaryColor}
            onChange={setPrimaryColor}
            disabled={isPending}
          />
          <ColorField
            id="accent_color"
            name="accent_color"
            label="Accent color"
            value={accentColor}
            onChange={setAccentColor}
            disabled={isPending}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Typography */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Typography</h2>
        <div className="max-w-xs">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="font_family" className="text-sm font-medium text-zinc-700">
              Font family
            </label>
            <select
              id="font_family"
              name="font_family"
              defaultValue={org.font_family}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              disabled={isPending}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Images */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Images</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AssetUploader
            orgId={org.id}
            kind="logo"
            label="Logo"
            currentUrl={org.logo_url}
          />
          <AssetUploader
            orgId={org.id}
            kind="hero"
            label="Hero image"
            currentUrl={org.hero_image_url}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Submit */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <a
          href="/super-admin/organizations"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Back
        </a>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ColorField
// ---------------------------------------------------------------------------

function ColorField({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-9 w-10 cursor-pointer rounded border border-zinc-300 bg-white p-0.5 disabled:opacity-50"
          disabled={disabled}
        />
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="^#[0-9a-fA-F]{6}$"
          placeholder="#000000"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssetUploader
// ---------------------------------------------------------------------------

function AssetUploader({
  orgId,
  kind,
  label,
  currentUrl,
}: {
  orgId: string;
  kind: 'logo' | 'hero';
  label: string;
  currentUrl: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(currentUrl);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const result = await uploadOrgAsset(orgId, kind, file);
    setUploading(false);
    if (result.ok) {
      setUrl(result.data.url);
    } else {
      setUploadError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${label} preview`}
          className="h-24 w-full rounded-lg border border-zinc-200 object-contain bg-zinc-50"
        />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={uploading}
        className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-50"
      />
      {uploading && <p className="text-xs text-zinc-400">Uploading…</p>}
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}
