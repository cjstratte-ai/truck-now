import Link from "next/link";

import { requireRole } from "@/src/lib/auth";
import { getAdminDashboardData } from "@/src/lib/inventory";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-300";
    case "PENDING_APPROVAL":
    case "REQUESTED":
    case "PENDING":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

function itemLabel(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export default async function AdminPage() {
  await requireRole(["ADMIN"], "/admin");
  const data = await getAdminDashboardData();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
        <h1 className="mt-4 text-4xl font-bold">Admin portal</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Review listings, booking requests, and verification work. Each queue item now opens into a dedicated review
          page so the team has a clear next step.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <a href="#admin-listing-review" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Listing review
        </a>
        <a href="#admin-booking-review" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Booking review
        </a>
        <a href="#admin-verification-queue" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-slate-500">
          Verification queue
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Pending approvals</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.pendingApprovals}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Active listings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.activeListings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Requested bookings</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.requestedBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Verification pending</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.verificationPending}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section id="admin-listing-review" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Listing review</h2>
            <span className="text-sm text-slate-400">{itemLabel(data.listingReviewQueue.length)}</span>
          </div>

          <div className="mt-4 space-y-3">
            {data.listingReviewQueue.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{listing.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(listing.status)}`}>
                    {listing.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {listing.city}, {listing.state}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/admin/listings/${listing.id}`}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                  >
                    Open review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-booking-review" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Booking review</h2>
            <span className="text-sm text-slate-400">{itemLabel(data.bookingReviewQueue.length)}</span>
          </div>

          <div className="mt-4 space-y-3">
            {data.bookingReviewQueue.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{booking.listingTitle}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(booking.status)}`}>
                    {booking.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{booking.customerName}</p>
                <p className="mt-3 text-sm font-medium text-slate-200">{formatCurrency(booking.totalAmount)}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                  >
                    Review request
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-verification-queue" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Verification queue</h2>
            <span className="text-sm text-slate-400">{itemLabel(data.verificationQueue.length)}</span>
          </div>

          <div className="mt-4 space-y-3">
            {data.verificationQueue.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{booking.customerName}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(booking.verificationStatus)}`}
                  >
                    {booking.verificationStatus.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{booking.listingTitle}</p>
                <p className="mt-3 text-sm font-medium text-slate-200">{formatCurrency(booking.totalAmount)}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                  >
                    Check verification
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
