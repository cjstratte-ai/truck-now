import Link from "next/link";

import { getCurrentSession } from "@/src/lib/auth";
import { getCustomerInventoryData } from "@/src/lib/inventory";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function formatVehicleType(vehicleType: string) {
  return vehicleType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
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

export default async function CustomerPage() {
  const session = await getCurrentSession();
  const customerEmail = session?.role === "CUSTOMER" ? session.email.toLowerCase() : undefined;
  const data = await getCustomerInventoryData(customerEmail);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
        <h1 className="mt-4 text-4xl font-bold">Find a truck</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Browse available trucks across Texas, compare the basics, and open each listing for a clearer rental summary.
        </p>
      </div>

      {session?.role === "CUSTOMER" ? (
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Your bookings</h2>
              <p className="mt-2 text-sm text-slate-400">Track the current status lane before you reach out about timing, payment, or pickup.</p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
              {data.bookings.length} recent {data.bookings.length === 1 ? "booking" : "bookings"}
            </span>
          </div>

          {data.bookings.length > 0 ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {data.bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs ${getStatusBadgeClasses(booking.status)}`}>
                      {formatLabel(booking.status)}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      Verification: {formatLabel(booking.verificationStatus)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-100">{booking.listingTitle}</h3>
                  <p className="mt-1 text-sm text-slate-400">{booking.city}</p>
                  <p className="mt-3 text-sm text-slate-300">
                    {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Payment: {formatLabel(booking.paymentStatus)}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-medium text-orange-300">{formatCurrency(booking.totalAmount)} total</p>
                    <Link
                      href={`/customer/bookings/${booking.id}`}
                      className="rounded-lg border border-orange-400/50 px-4 py-2 text-sm font-medium text-orange-200 transition hover:border-orange-300"
                    >
                      Open booking
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm text-slate-400">
              You do not have any tracked bookings yet. Once you submit a request while signed in, it will show up here.
            </div>
          )}
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Want booking tracking?</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Sign in as a customer before you request a truck and this dashboard will keep your booking status, payment lane,
                and next-step links in one place.
              </p>
            </div>
            <Link
              href="/login?next=%2Fcustomer"
              className="inline-flex rounded-lg border border-orange-400/50 px-4 py-2 text-sm font-medium text-orange-200 transition hover:border-orange-300"
            >
              Sign in to track bookings
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.listings.map((truck) => (
          <div key={truck.id} className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              {truck.photoUrls[0] ? (
                <img src={truck.photoUrls[0]} alt={truck.title} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-sm text-slate-400">
                  Photo coming soon
                </div>
              )}
            </div>
            <p className="text-sm text-orange-300">Texas listing</p>
            <h2 className="mt-2 text-xl font-semibold">{truck.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{formatVehicleType(truck.vehicleType)}</p>
            <p className="mt-2 text-slate-400">
              {truck.city}, {truck.state}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {truck.passengerCapacity ? `${truck.passengerCapacity} seats` : "Passenger capacity not listed"}
              {truck.hasRamp ? " • Ramp" : ""}
              {truck.boxSizeFeet ? ` • ${truck.boxSizeFeet} ft box` : ""}
            </p>
            <p className="mt-3 flex-1 text-slate-300">{truck.description}</p>
            <p className="mt-4 text-lg font-medium">{formatCurrency(truck.dailyRate)}/day</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/customer/listings/${truck.id}`}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
              >
                View details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
