import Link from "next/link";

import { requireRole } from "@/src/lib/auth";
import { getOperatorDashboardData } from "@/src/lib/inventory";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
    case "PAID":
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-300";
    case "PENDING_APPROVAL":
    case "REQUESTED":
      return "bg-amber-500/15 text-amber-300";
    case "DRAFT":
    case "ARCHIVED":
      return "bg-slate-700 text-slate-300";
    default:
      return "bg-rose-500/15 text-rose-300";
  }
}

export default async function OperatorPage() {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");
  const data = await getOperatorDashboardData(session.role === "OPERATOR" ? session.email : undefined);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
          <h1 className="mt-4 text-4xl font-bold">Operator portal</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Manage live trucks, watch booking requests, and move into item-level workflow pages when something needs
            attention.
          </p>
        </div>
        <Link
          href="/operator/listings/new"
          className="inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
        >
          Add listing
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <a href="#operator-listings" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Jump to listings
        </a>
        <a href="#operator-bookings" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Jump to bookings
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Active listings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.activeListings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Draft + pending</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.pendingListings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Requested bookings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.requestedBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Paid bookings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.paidBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
          <p className="text-sm text-slate-400">Daily revenue potential</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(data.stats.revenuePotential)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section id="operator-listings" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Listings</h2>
            <span className="text-sm text-slate-400">{data.listings.length} total</span>
          </div>

          <div className="mt-4 space-y-3">
            {data.listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-300">
                No listings yet in this operator scope. Create one to start the workflow.
              </div>
            ) : (
              data.listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">{listing.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {listing.city}, {listing.state}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(listing.status)}`}>
                        {listing.status.replaceAll("_", " ")}
                      </span>
                      <span className="text-sm font-medium text-slate-200">{formatCurrency(listing.dailyRate)}/day</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/operator/listings/${listing.id}`}
                      className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                    >
                      Open workflow
                    </Link>
                    <Link
                      href={`/customer/listings/${listing.id}`}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                    >
                      Open customer view
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section id="operator-bookings" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent bookings</h2>
            <span className="text-sm text-slate-400">{data.bookings.length} shown</span>
          </div>

          <div className="mt-4 space-y-3">
            {data.bookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{booking.listingTitle}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(booking.status)}`}>
                    {booking.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {booking.customerName} in {booking.city}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Verification: <span className="text-slate-200">{booking.verificationStatus.replaceAll("_", " ")}</span>
                  </span>
                  <span className="font-medium text-slate-200">{formatCurrency(booking.totalAmount)}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/operator/bookings/${booking.id}`}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                  >
                    Review booking
                  </Link>
                  <Link
                    href={`/operator/listings/${booking.listingId}`}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  >
                    Open listing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
