import { getActiveListings } from "@/src/lib/inventory";

type InventoryItem = {
  id: string;
  title: string;
  city: string;
  dailyRate: number;
  description: string;
};

const fallbackInventory: InventoryItem[] = [
  {
    id: "fallback-1",
    title: "2021 Ford F-250 Work Truck",
    city: "Dallas",
    dailyRate: 14900,
    description: "Reliable heavy duty truck rental in Dallas for hauling, moving, and work site jobs.",
  },
  {
    id: "fallback-2",
    title: "2020 Isuzu NPR Box Truck",
    city: "Houston",
    dailyRate: 17900,
    description: "Popular box truck in Houston for moves, deliveries, and business rentals.",
  },
  {
    id: "fallback-3",
    title: "2019 Ram 2500 Utility Truck",
    city: "Austin",
    dailyRate: 15900,
    description: "Utility truck rental in Austin with flexible day rates and simple pickup.",
  },
];

export default async function CustomerPage() {
  const listings = await getActiveListings();
  const inventory: InventoryItem[] = listings.length > 0 ? listings : fallbackInventory;
  const sourceLabel = listings.length > 0 ? "Live DB inventory" : "Fallback sample inventory";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">
          {sourceLabel}
        </span>
        <h1 className="mt-4 text-4xl font-bold">Find a truck</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Browse available trucks across Texas. This customer portal now supports database-backed inventory with a safe fallback.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {inventory.map((truck) => (
          <div key={truck.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-orange-300">Texas listing</p>
            <h2 className="mt-2 text-xl font-semibold">{truck.title}</h2>
            <p className="mt-2 text-slate-400">{truck.city}, Texas</p>
            <p className="mt-3 text-slate-300">{truck.description}</p>
            <p className="mt-4 text-lg font-medium">${(truck.dailyRate / 100).toFixed(2)}/day</p>
          </div>
        ))}
      </div>
    </main>
  );
}
