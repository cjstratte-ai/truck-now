import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/src/lib/auth";
import { getOperatorListingDetail } from "@/src/lib/inventory";

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

export default async function OperatorListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");
  const { id } = await params;
  const data = await getOperatorListingDetail(id, session.role === "OPERATOR" ? session.email : undefined);

  if (!data) {
    notFound();
  }

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
      </div>

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
    </main>
  );
}
