const sampleInventory = [
  {
    id: "1",
    title: "2021 Ford F-250 Work Truck",
    city: "Dallas",
    dailyRate: 149,
    type: "Work Truck",
  },
  {
    id: "2",
    title: "2020 Isuzu NPR Box Truck",
    city: "Houston",
    dailyRate: 179,
    type: "Box Truck",
  },
  {
    id: "3",
    title: "2019 Ram 2500 Utility Truck",
    city: "Austin",
    dailyRate: 159,
    type: "Utility Truck",
  },
];

export default function CustomerPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16 text-white">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Find a truck</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Search available trucks across Texas. This is the customer booking portal shell.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sampleInventory.map((truck) => (
          <div key={truck.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-orange-300">{truck.type}</p>
            <h2 className="mt-2 text-xl font-semibold">{truck.title}</h2>
            <p className="mt-2 text-slate-400">{truck.city}, Texas</p>
            <p className="mt-4 text-lg font-medium">${truck.dailyRate}/day</p>
          </div>
        ))}
      </div>
    </main>
  );
}
