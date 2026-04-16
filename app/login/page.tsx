import Link from "next/link";

import { signIn } from "@/app/actions";

function getNotice(reason: string | string[] | undefined) {
  const key = Array.isArray(reason) ? reason[0] : reason;

  switch (key) {
    case "auth":
      return "Sign in to access that internal route.";
    case "role":
      return "Your current role does not have access to that route. Choose the right role and continue.";
    case "invalid":
      return "Please enter a name, email, and valid role to continue.";
    case "signed-out":
      return "You have been signed out.";
    default:
      return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams.next || "";
  const notice = getNotice(resolvedSearchParams.reason);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 p-8 lg:grid lg:grid-cols-[1fr_0.9fr] lg:gap-8">
        <section>
          <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">Auth and role gating</span>
          <h1 className="mt-4 text-4xl font-bold">Sign in to Trucks Now</h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Internal routes now require a session. Use this lightweight sign-in flow to enter as an operator or admin
            while we keep building the real auth stack.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">Customer routes stay open for browsing and booking requests.</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">Operator routes require the OPERATOR or ADMIN role.</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">Admin routes require the ADMIN role.</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">For the demo data, use <span className="font-medium text-slate-100">operator@trucksnow.com</span> as the operator login and <span className="font-medium text-slate-100">admin@trucksnow.com</span> as the admin login.</div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/customer" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500">
              Browse customer view
            </Link>
            <Link href="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500">
              Back home
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 lg:mt-0">
          <h2 className="text-xl font-semibold">Session setup</h2>
          {notice ? <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">{notice}</div> : null}

          <form action={signIn} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={nextPath} />

            <div>
              <label htmlFor="name" className="text-sm text-slate-300">
                Name
              </label>
              <input
                id="name"
                name="name"
                defaultValue="Captain"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue="admin@trucksnow.com"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
              />
            </div>

            <div>
              <label htmlFor="role" className="text-sm text-slate-300">
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue="ADMIN"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="OPERATOR">Operator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
            >
              Create session
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
