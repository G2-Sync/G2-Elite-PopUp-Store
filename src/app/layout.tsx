import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'G2 Elite Pop-Up Store',
  description:
    'Limited drops, curated goods. Shop exclusive G2 Elite apparel, accessories, art prints, and home goods while they last.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link
              href="/"
              className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 transition-opacity hover:opacity-70 dark:text-zinc-50"
              aria-label="G2 Elite Pop-Up Store home"
            >
              G2 Elite
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-6" aria-label="Main navigation">
              <Link
                href="/shop"
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Shop
              </Link>

              {/* Cart icon — stub (no functionality yet) */}
              <Link
                href="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="View cart"
              >
                <ShoppingCart size={20} aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <div className="flex flex-1 flex-col">{children}</div>

        {/* Footer */}
        <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
              &copy; {new Date().getFullYear()} G2 Elite. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
