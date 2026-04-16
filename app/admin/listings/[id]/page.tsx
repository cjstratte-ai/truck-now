import Link from "next/link";
import { notFound } from "next/navigation";

import { reviewListing } from "@/app/actions";
import { requireRole } from "@/src/lib/auth";
import { getAdminListingReviewDetail } from "@/src/lib/inventory";
import { getFlashClasses, getWorkflowFlash } from "@/src/lib/workflow-flash";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function formatVehicleType(vehicleType: string) {
  return vehicleType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-300";
    case "PENDING_APPROVAL":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

export default async function AdminListingReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  await requireRole(["ADMIN"], "/admin");
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getAdminListingReviewDetail(id);

  if (!data) {
    notFound();
  }

  const flash = getWorkflowFlash(resolvedSearchParams.message);
  const isDemoMode = data.sourceLabel.startsWith("Sample");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <Link href="/admin" className="text-sm text-orange-300 transition hover:text-orange-200">
        ← Back to admin queue
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
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Type</p>
            <p className="mt-2 font-medium text-slate-100">{formatVehicleType(data.listing.vehicleType)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Box size</p>
            <p className="mt-2 font-medium text-slate-100">{data.listing.boxSizeFeet ? `${data.listing.boxSizeFeet} ft` : "N/A"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Passenger capacity</p>
            <p className="mt-2 font-medium text-slate-100">{data.listing.passengerCapacity ?? "N/A"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Ramp</p>
            <p className="mt-2 font-medium text-slate-100">{data.listing.hasRamp ? "Yes" : "No"}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.listing.photoUrls.length > 0 ? (
            data.listing.photoUrls.map((photoUrl, index) => (
              <div key={photoUrl} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
                <img src={photoUrl} alt={`${data.listing.title} photo ${index + 1}`} className="h-64 w-full object-cover" />
              </div>
            ))
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 text-sm text-slate-400 md:col-span-2">
              No listing photos provided yet
            </div>
          )}
        </div>
        {isDemoMode ? (
          <p className="mt-4 text-sm text-slate-400">Demo mode is active here, so review actions validate and redirect but do not persist yet.</p>
        ) : null}
      </div>

      {flash ? <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getFlashClasses(flash.tone)}`}>{flash.text}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Review checklist</h2>
          <div className="mt-4 space-y-3">
            {data.checklist.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            Owner: <span className="font-medium text-slate-100">{data.listing.ownerName}</span>
            <br />
            Contact: <span className="font-medium text-slate-100">{data.listing.ownerEmail}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Admin actions</h2>
          <div className="mt-4 space-y-3">
            {data.actionItems.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <form action={reviewListing}>
              <input type="hidden" name="listingId" value={data.listing.id} />
              <input type="hidden" name="nextStatus" value="ACTIVE" />
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
              >
                Approve listing
              </button>
            </form>

            <form action={reviewListing}>
              <input type="hidden" name="listingId" value={data.listing.id} />
              <input type="hidden" name="nextStatus" value="REJECTED" />
              <button
                type="submit"
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
              >
                Send back
              </button>
            </form>

            <Link
              href={`/customer/listings/${data.listing.id}`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
            >
              Preview customer view
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
