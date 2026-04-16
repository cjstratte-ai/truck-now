import Link from "next/link";
import { notFound } from "next/navigation";

import { updateBookingStatus, updateVerificationStatus } from "@/app/actions";
import { getAdminBookingReviewDetail } from "@/src/lib/inventory";
import { getFlashClasses, getWorkflowFlash } from "@/src/lib/workflow-flash";

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusClasses(status: string) {
  switch (status) {
    case "APPROVED":
    case "PAID":
      return "bg-emerald-500/15 text-emerald-300";
    case "REQUESTED":
    case "PENDING":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

export default async function AdminBookingReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getAdminBookingReviewDetail(id);

  if (!data) {
    notFound();
  }

  const flash = getWorkflowFlash(resolvedSearchParams.message);
  const isDemoMode = data.sourceLabel.startsWith("Sample");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <Link href="/admin" className="text-sm text-orange-300 transition hover:text-orange-200">
        ← Back to admin queue
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{data.booking.listingTitle}</h1>
            <p className="mt-2 text-slate-400">
              {data.booking.customerName} in {data.booking.city}
            </p>
          </div>
          <p className="text-2xl font-semibold text-orange-300">{formatCurrency(data.booking.totalAmount)}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className={`rounded-full px-3 py-1 font-medium ${getStatusClasses(data.booking.status)}`}>
            {data.booking.status.replaceAll("_", " ")}
          </span>
          <span className={`rounded-full px-3 py-1 font-medium ${getStatusClasses(data.booking.verificationStatus)}`}>
            Verification {data.booking.verificationStatus.replaceAll("_", " ")}
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
            {formatDate(data.booking.startDate)} to {formatDate(data.booking.endDate)}
          </span>
        </div>
        {isDemoMode ? (
          <p className="mt-4 text-sm text-slate-400">Demo mode is active here, so booking and verification actions validate and redirect but do not persist yet.</p>
        ) : null}
      </div>

      {flash ? <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getFlashClasses(flash.tone)}`}>{flash.text}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Admin review checklist</h2>
          <div className="mt-4 space-y-3">
            {data.checklist.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            Customer contact: <span className="font-medium text-slate-100">{data.booking.customerEmail}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Workflow actions</h2>
          <div className="mt-4 space-y-3">
            {data.actionItems.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {data.booking.status === "REQUESTED" ? (
              <>
                <form action={updateBookingStatus}>
                  <input type="hidden" name="bookingId" value={data.booking.id} />
                  <input type="hidden" name="nextStatus" value="APPROVED" />
                  <input type="hidden" name="returnTo" value={`/admin/bookings/${data.booking.id}`} />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                  >
                    Approve booking
                  </button>
                </form>

                <form action={updateBookingStatus}>
                  <input type="hidden" name="bookingId" value={data.booking.id} />
                  <input type="hidden" name="nextStatus" value="REJECTED" />
                  <input type="hidden" name="returnTo" value={`/admin/bookings/${data.booking.id}`} />
                  <button
                    type="submit"
                    className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                  >
                    Reject booking
                  </button>
                </form>
              </>
            ) : null}

            {data.booking.verificationStatus !== "APPROVED" ? (
              <form action={updateVerificationStatus}>
                <input type="hidden" name="bookingId" value={data.booking.id} />
                <input type="hidden" name="nextStatus" value="APPROVED" />
                <input type="hidden" name="returnTo" value={`/admin/bookings/${data.booking.id}`} />
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
                >
                  Approve verification
                </button>
              </form>
            ) : null}

            {data.booking.verificationStatus !== "REJECTED" ? (
              <form action={updateVerificationStatus}>
                <input type="hidden" name="bookingId" value={data.booking.id} />
                <input type="hidden" name="nextStatus" value="REJECTED" />
                <input type="hidden" name="returnTo" value={`/admin/bookings/${data.booking.id}`} />
                <button
                  type="submit"
                  className="rounded-lg border border-rose-400/50 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-300"
                >
                  Reject verification
                </button>
              </form>
            ) : null}

            <Link
              href={`/operator/bookings/${data.booking.id}`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
            >
              Open operator workflow
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
