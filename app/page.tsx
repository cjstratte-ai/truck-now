import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-24">
        <span className="w-fit rounded-full bg-orange-500/20 px-4 py-1 text-sm text-orange-300">
          Trucks Now, Texas-first truck rental marketplace
        </span>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight">
          Rent verified trucks across Texas with secure booking requests, owner approvals, and printable paperwork.
        </h1>

        <p className="max-w-2xl text-lg text-slate-300">
          Trucks Now helps renters find trucks fast and helps owners market, manage, and monetize their fleets. Operator
          and admin workflows now sit behind session-based role gating.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-lg border border-orange-500/40 px-5 py-3 font-semibold text-orange-300"
          >
            Sign in
          </Link>
          <Link
            href="/customer"
            className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-black"
          >
            Find a truck
          </Link>
          <Link
            href="/operator"
            className="rounded-lg border border-slate-700 px-5 py-3 font-semibold"
          >
            List your trucks
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-700 px-5 py-3 font-semibold"
          >
            Admin portal
          </Link>
        </div>
      </section>
    </main>
  );
}
