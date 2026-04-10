export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <h1 className="text-4xl font-bold">Admin portal</h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        This is the admin shell for approvals, verifications, bookings, and marketplace oversight.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">Owner approvals</div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">Listing review</div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">Booking oversight</div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">Verification checks</div>
      </div>
    </main>
  );
}
