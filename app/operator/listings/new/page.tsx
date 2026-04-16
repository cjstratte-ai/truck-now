import Link from "next/link";

import { createOperatorListing } from "@/app/actions";
import { requireRole } from "@/src/lib/auth";
import { getFlashClasses, getWorkflowFlash } from "@/src/lib/workflow-flash";

export default async function NewOperatorListingPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator/listings/new");
  const resolvedSearchParams = await searchParams;
  const flash = getWorkflowFlash(resolvedSearchParams.message);
  const isDemoMode = !process.env.DATABASE_URL;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <Link href="/operator" className="text-sm text-orange-300 transition hover:text-orange-200">
        ← Back to operator dashboard
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">Operator workflow</span>
        <h1 className="mt-4 text-4xl font-bold">Create a new listing</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Add a truck listing for <span className="font-medium text-slate-100">{session.email}</span>, save it as a draft,
          or send it straight into review when the renter-facing details are ready.
        </p>
        {isDemoMode ? (
          <p className="mt-4 text-sm text-slate-400">Demo mode is active here, so creation actions validate and redirect but do not persist yet.</p>
        ) : null}
      </div>

      {flash ? <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getFlashClasses(flash.tone)}`}>{flash.text}</div> : null}

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-xl font-semibold">Listing details</h2>
          <p className="mt-1 text-sm text-slate-400">
            Keep the copy clear and specific so the review lane can move quickly.
          </p>
        </div>

        <form action={createOperatorListing} className="mt-6 space-y-5">
          <input type="hidden" name="returnTo" value="/operator/listings/new" />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span>Title</span>
              <input
                name="title"
                placeholder="2023 Ford Transit 250 Cargo Van"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span>Description</span>
              <textarea
                name="description"
                rows={5}
                placeholder="Describe the truck, best-fit use cases, pickup expectations, and anything renters should know before booking."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span>City</span>
              <input
                name="city"
                placeholder="San Antonio"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span>State</span>
              <input
                name="state"
                placeholder="TX"
                maxLength={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 uppercase outline-none transition focus:border-orange-400"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span>Daily rate (USD)</span>
              <input
                type="number"
                name="dailyRate"
                min="1"
                step="1"
                placeholder="185"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="intent"
              value="draft"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
            >
              Create draft
            </button>
            <button
              type="submit"
              name="intent"
              value="submit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
            >
              Create and submit for review
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Draft keeps the listing private to the operator workflow. Submit for review creates it and places it into pending approval.
          </p>
        </form>
      </section>
    </main>
  );
}
