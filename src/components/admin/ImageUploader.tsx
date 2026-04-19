'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  /** Called with the selected File objects */
  onFiles: (files: File[]) => void;
  /** Max number of files that can be selected at once */
  maxFiles?: number;
  /** Max size per file in bytes (default 8 MB) */
  maxBytes?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  onFiles,
  maxFiles = 8,
  maxBytes = 8 * 1024 * 1024,
  disabled = false,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError(null);

    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        setError('Only PNG, JPG, and WEBP files are accepted.');
        return;
      }
      if (file.size > maxBytes) {
        setError(`Files must be under ${Math.round(maxBytes / 1024 / 1024)} MB each.`);
        return;
      }
      accepted.push(file);
    }

    if (accepted.length > maxFiles) {
      setError(`You can upload at most ${maxFiles} images.`);
      return;
    }

    const newPreviews = accepted.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setPreviews(newPreviews);
    onFiles(accepted);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging ? 'border-zinc-500 bg-zinc-50' : 'border-zinc-300 bg-white hover:border-zinc-400',
          disabled ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <svg className="mb-3 h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-zinc-700">
          Drag and drop images, or <span className="text-zinc-900 underline">click to browse</span>
        </p>
        <p className="mt-1 text-xs text-zinc-400">PNG, JPG, WEBP — up to 8 MB each</p>
        <input
          ref={inputRef}
          type="file"
          name="images"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => processFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
              <Image src={p.url} alt={p.name} fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
