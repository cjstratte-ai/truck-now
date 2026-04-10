export default function OperatorPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <h1 className="text-4xl font-bold">Operator portal</h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        This is the owner and operator shell for managing listings, bookings, payouts, and paperwork.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Listings</h2>
          <p className="mt-2 text-slate-400">Create and manage truck listings.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Bookings</h2>
          <p className="mt-2 text-slate-400">Approve or reject booking requests.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Payouts</h2>
          <p className="mt-2 text-slate-400">Track Stripe Connect onboarding and payouts.</p>
        </div>
      </div>
    </main>
  );
}
