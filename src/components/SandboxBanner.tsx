'use client';

/**
 * Yellow test-mode banner shown on cart and checkout pages.
 * Always visible — no dismiss in production, keeps it simple.
 */
export default function SandboxBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-800">
      🧪 Test Mode — payments are simulated. No real charges will occur.
    </div>
  );
}
