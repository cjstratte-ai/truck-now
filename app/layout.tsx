import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import { signOut } from "@/app/actions";
import { getCurrentSession } from "@/src/lib/auth";

export const metadata: Metadata = {
  title: "Trucks Now",
  description: "Texas-first truck rental marketplace for renters, owners, and operators.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <div className="border-b border-slate-800 bg-slate-950/90">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/" className="font-semibold text-white transition hover:text-orange-300">
                Trucks Now
              </Link>
              <Link href="/customer" className="text-slate-300 transition hover:text-white">
                Customer
              </Link>
              <Link href="/operator" className="text-slate-300 transition hover:text-white">
                Operator
              </Link>
              <Link href="/admin" className="text-slate-300 transition hover:text-white">
                Admin
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {session ? (
                <>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                    {session.name} ({session.role})
                  </span>
                  <form action={signOut}>
                    <button type="submit" className="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 transition hover:border-slate-500">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-orange-400">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
