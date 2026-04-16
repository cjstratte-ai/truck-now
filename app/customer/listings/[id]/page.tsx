import Link from "next/link";
import { notFound } from "next/navigation";

import { createBookingRequest } from "@/app/actions";
import { getCustomerListingDetail } from "@/src/lib/inventory";
import { getFlashClasses, getWorkflowFlash } from "@/src/lib/workflow-flash";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

export default async function CustomerListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getCustomerListingDetail(id);

  if (!data) {
    notFound();
  }

  const flash = getWorkflowFlash(resolvedSearchParams.message);
  const isDemoMode = data.sourceLabel.startsWith("Sample");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <Link href="/customer" className="text-sm text-orange-300 transition hover:text-orange-200">
        ← Back to inventory
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
          <p className="text-2xl font-semibold text-orange-300">{formatCurrency(data.listing.dailyRate)}/day</p>
        </div>
        <p className="mt-6 max-w-3xl text-slate-300">{data.listing.description}</p>
        {isDemoMode ? (
          <p className="mt-4 text-sm text-slate-400">Demo mode is active here, so requests validate and redirect but do not persist yet.</p>
        ) : null}
      </div>

      {flash ? <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getFlashClasses(flash.tone)}`}>{flash.text}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">What to expect</h2>
          <div className="mt-4 space-y-3">
            {data.highlights.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <ol className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">1. Confirm the truck, city, rate, and timing fit the job.</li>
            <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">2. Send the booking request with your dates and contact info.</li>
            <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">3. The request moves into review and the operator can approve the next step.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Request this truck</h2>
          <form action={createBookingRequest} className="mt-4 space-y-4">
            <input type="hidden" name="listingId" value={data.listing.id} />

            <div>
              <label htmlFor="customerName" className="text-sm text-slate-300">
                Name
              </label>
              <input
                id="customerName"
                name="customerName"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="text-sm text-slate-300">
                Email
              </label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="text-sm text-slate-300">
                  Start date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="text-sm text-slate-300">
                  End date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
            >
              Send booking request
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
