/**
 * Sign-out button. Renders a tiny form that POSTs to /logout.
 *
 * Why a form (not a Link)?
 *   Next.js <Link> prefetches the target page automatically when it
 *   becomes visible. If /logout were a GET handler, that prefetch
 *   would fire the logout action and clear the user's session before
 *   they did anything. Using a form + POST means only an explicit
 *   click submits — no accidental auto-logouts.
 */
interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  className = 'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50',
  children = 'Sign out',
}: LogoutButtonProps) {
  return (
    <form action="/logout" method="POST" className="inline">
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
