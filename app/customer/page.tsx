import Link from "next/link";

import { getCustomerInventoryData } from "@/src/lib/inventory";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

export default async function CustomerPage() {
  const data = await getCustomerInventoryData();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
        <h1 className="mt-4 text-4xl font-bold">Find a truck</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Browse available trucks across Texas, compare the basics, and open each listing for a clearer rental summary.
        </p>
      </div>

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
            <p className="mt-2 text-slate-400">
              {truck.city}, {truck.state}
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
