import Link from "next/link";
import { notFound } from "next/navigation";

import { getCustomerListingDetail } from "@/src/lib/inventory";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

export default async function CustomerListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCustomerListingDetail(id);

  if (!data) {
    notFound();
  }

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
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">What to expect</h2>
          <div className="mt-4 space-y-3">
            {data.highlights.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Booking path</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">1. Review the truck details and confirm the city, rate, and job fit.</li>
            <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">2. Send a booking request for the dates you want.</li>
            <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">3. The operator reviews the request and the platform keeps verification in line before handoff.</li>
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/customer"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
            >
              Back to inventory
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
