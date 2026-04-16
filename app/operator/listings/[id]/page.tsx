import Link from "next/link";
import { notFound } from "next/navigation";

import { saveOperatorListing } from "@/app/actions";
import { requireRole } from "@/src/lib/auth";
import { getOperatorListingDetail } from "@/src/lib/inventory";
import { getFlashClasses, getWorkflowFlash } from "@/src/lib/workflow-flash";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-300";
    case "PENDING_APPROVAL":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

export default async function OperatorListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getOperatorListingDetail(id, session.role === "OPERATOR" ? session.email : undefined);

  if (!data) {
    notFound();
  }

  const flash = getWorkflowFlash(resolvedSearchParams.message);
  const isDemoMode = data.sourceLabel.startsWith("Sample");
  const allowSubmitForReview = data.listing.status !== "ACTIVE";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <Link href="/operator" className="text-sm text-orange-300 transition hover:text-orange-200">
        ← Back to operator dashboard
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{data.listing.title}</h1>
            <p className="mt-2 text-slate-400">
              {data.listing.city}, {data.listing.state}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(data.listing.status)}`}>
              {data.listing.status.replaceAll("_", " ")}
            </span>
            <p className="text-2xl font-semibold text-orange-300">{formatCurrency(data.listing.dailyRate)}/day</p>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-slate-300">{data.listing.description}</p>
        {isDemoMode ? (
          <p className="mt-4 text-sm text-slate-400">Demo mode is active here, so listing edits validate and redirect but do not persist yet.</p>
        ) : null}
      </div>

      {flash ? <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getFlashClasses(flash.tone)}`}>{flash.text}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Listing pulse</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Recent bookings</p>
              <p className="mt-2 text-2xl font-semibold">{data.stats.recentBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Requested</p>
              <p className="mt-2 text-2xl font-semibold">{data.stats.requestedBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Paid</p>
              <p className="mt-2 text-2xl font-semibold">{data.stats.paidBookings}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            Owned by <span className="font-medium text-slate-100">{data.listing.ownerName}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Recommended next steps</h2>
          <div className="mt-4 space-y-3">
            {data.actionItems.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/operator"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
            >
              Back to dashboard
            </Link>
            <Link
              href={`/customer/listings/${data.listing.id}`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
            >
              Open customer view
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Edit listing</h2>
            <p className="mt-1 text-sm text-slate-400">
              Update the renter-facing details here, then push the listing back into review when needed.
            </p>
          </div>
          <span className="text-sm text-slate-400">
            {allowSubmitForReview ? "Submit for review is available on this listing." : "Active listings save in place."}
          </span>
        </div>

        <form action={saveOperatorListing} className="mt-6 space-y-5">
          <input type="hidden" name="listingId" value={data.listing.id} />
          <input type="hidden" name="returnTo" value={`/operator/listings/${data.listing.id}`} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span>Title</span>
              <input
                name="title"
                defaultValue={data.listing.title}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span>Description</span>
              <textarea
                name="description"
                defaultValue={data.listing.description}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span>City</span>
              <input
                name="city"
                defaultValue={data.listing.city}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span>State</span>
              <input
                name="state"
                defaultValue={data.listing.state}
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
                defaultValue={Math.round(data.listing.dailyRate / 100)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-orange-400"
                required
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="intent"
              value="save"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
            >
              Save changes
            </button>

            {allowSubmitForReview ? (
              <button
                type="submit"
                name="intent"
                value="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
              >
                Save and submit for review
              </button>
            ) : null}
          </div>

          <p className="text-xs text-slate-400">
            Saving keeps the current workflow state. Submit for review moves the listing into pending approval after the edits are saved.
          </p>
        </form>
      </section>
    </main>
  );
}
