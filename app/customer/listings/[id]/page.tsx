import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingRequestForm } from "./booking-request-form";

import { getCurrentSession } from "@/src/lib/auth";
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
  const [data, session] = await Promise.all([getCustomerListingDetail(id), getCurrentSession()]);

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
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.listing.photoUrls.length > 0 ? (
            data.listing.photoUrls.map((photoUrl, index) => (
              <div key={photoUrl} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
                <img src={photoUrl} alt={`${data.listing.title} photo ${index + 1}`} className="h-64 w-full object-cover" />
              </div>
            ))
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 text-sm text-slate-400 md:col-span-2">
              Photos coming soon
            </div>
          )}
        </div>
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
          <BookingRequestForm
            listingId={data.listing.id}
            dailyRate={data.listing.dailyRate}
            defaultName={session?.name}
            defaultEmail={session?.email}
          />
        </section>
      </div>
    </main>
  );
}
