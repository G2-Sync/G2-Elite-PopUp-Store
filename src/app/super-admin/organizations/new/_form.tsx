'use client';

import { useState, useTransition } from 'react';
import { createOrganization } from '../_actions';

const FONT_OPTIONS = [
  'Inter',
  'Playfair Display',
  'Poppins',
  'Roboto',
  'Space Grotesk',
  'Merriweather',
] as const;

export default function NewOrgForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(true);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createOrganization(formData);
      // On success the server action redirects — this only runs on error
      if (!result.ok) {
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

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Basics */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Basics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className="text-sm font-medium text-zinc-700">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              disabled={isPending}
            />
            <p className="text-xs text-zinc-400">Lowercase letters, numbers, hyphens only</p>
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
              placeholder="Acme Corporation"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
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
              placeholder="Gear up. Play harder."
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
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
              placeholder="hello@acmecorp.com"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5 justify-center">
            <label className="text-sm font-medium text-zinc-700">Status</label>
            {/* Hidden input carries the real boolean value — checkbox just toggles it */}
            <input type="hidden" name="is_active" value={isActive ? 'true' : 'false'} />
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-200"
                disabled={isPending}
              />
              <span className="text-sm text-zinc-700">Active</span>
            </label>
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
            defaultValue="#0F172A"
            disabled={isPending}
          />
          <ColorField
            id="accent_color"
            name="accent_color"
            label="Accent color"
            defaultValue="#F59E0B"
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
              defaultValue="Inter"
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
      {/* Section 4: Images (note) */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-2 text-base font-semibold text-zinc-900">Images</h2>
        <p className="text-sm text-zinc-500">
          Logo and hero image can be uploaded from the organization edit page after creation.
        </p>
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
          {isPending ? 'Creating…' : 'Create organization'}
        </button>
        <a
          href="/super-admin/organizations"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ColorField helper component
// ---------------------------------------------------------------------------

function ColorField({
  id,
  name,
  label,
  defaultValue,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  disabled: boolean;
}) {
  const [hex, setHex] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-9 w-10 cursor-pointer rounded border border-zinc-300 bg-white p-0.5 disabled:opacity-50"
          disabled={disabled}
        />
        <input
          id={id}
          name={name}
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          pattern="^#[0-9a-fA-F]{6}$"
          placeholder="#000000"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
