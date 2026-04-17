import Link from "next/link";

import { requireRole } from "@/src/lib/auth";
import { getCustomerBookingsData } from "@/src/lib/inventory";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusBadgeClasses(status: string) {
  if (status === "PAID") {
    return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  }

  if (status === "APPROVED") {
    return "bg-sky-500/15 text-sky-200 border-sky-500/30";
  }

  if (status === "REJECTED") {
    return "bg-rose-500/15 text-rose-200 border-rose-500/30";
  }

  return "bg-orange-500/15 text-orange-200 border-orange-500/30";
}

export default async function CustomerBookingsPage() {
  const session = await requireRole(["CUSTOMER"], "/customer/bookings");
  const data = await getCustomerBookingsData(session.email.toLowerCase());

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
          <h1 className="mt-4 text-4xl font-bold">Your bookings</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Track every rental request in one place, then open the item-level page when you need the full workflow timeline.
          </p>
        </div>
        <Link
          href="/customer"
          className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
        >
          Browse more trucks
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {data.bookings.length > 0 ? (
          data.bookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs ${getStatusBadgeClasses(booking.status)}`}>
                  {formatLabel(booking.status)}
                </span>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  Verification: {formatLabel(booking.verificationStatus)}
                </span>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  Payment: {formatLabel(booking.paymentStatus)}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{booking.listingTitle}</h2>
                  <p className="mt-2 text-sm text-slate-400">{booking.city}</p>
                  <p className="mt-3 text-sm text-slate-300">
                    {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
                  </p>
                </div>
                <p className="text-xl font-semibold text-orange-300">{formatCurrency(booking.totalAmount)} total</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/customer/bookings/${booking.id}`}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                >
                  Open booking timeline
                </Link>
                <Link
                  href={`/customer/listings/${booking.listingId}`}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                >
                  Open truck listing
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
            You do not have any tracked bookings yet. Start from the customer inventory, request a truck, and it will appear here.
          </div>
        )}
      </div>
    </main>
  );
}
