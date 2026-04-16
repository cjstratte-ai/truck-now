import Link from "next/link";
import { notFound } from "next/navigation";

import { updateBookingStatus } from "@/app/actions";
import { formatCurrency, getCustomerNotificationPreview, getOpsNotificationPreview, getPaymentSummary } from "@/src/lib/booking-workflow";
import { requireRole } from "@/src/lib/auth";
import { getOperatorBookingDetail } from "@/src/lib/inventory";
import { getFlashClasses, getWorkflowFlash } from "@/src/lib/workflow-flash";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusClasses(status: string) {
  switch (status) {
    case "PAID":
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-300";
    case "REQUESTED":
    case "PENDING":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

export default async function OperatorBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  await requireRole(["OPERATOR", "ADMIN"], "/operator");
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getOperatorBookingDetail(id);

  if (!data) {
    notFound();
  }

  const flash = getWorkflowFlash(resolvedSearchParams.message);
  const isDemoMode = data.sourceLabel.startsWith("Sample");
  const paymentSummary = getPaymentSummary(data.booking);
  const customerNotification = getCustomerNotificationPreview(data.booking);
  const opsNotification = getOpsNotificationPreview(data.booking);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <Link href="/operator" className="text-sm text-orange-300 transition hover:text-orange-200">
        ← Back to operator dashboard
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
          <p className="mt-4 text-sm text-slate-400">Demo mode is active here, so booking updates validate and redirect but do not persist yet.</p>
        ) : null}
      </div>

      {flash ? <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getFlashClasses(flash.tone)}`}>{flash.text}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Operator checklist</h2>
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
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Payment summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Rental days</p>
                <p className="mt-2 text-2xl font-semibold">{paymentSummary.rentalDays}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Platform fee</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(paymentSummary.platformFee)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Operator payout</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(paymentSummary.operatorPayout)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-medium text-slate-100">{paymentSummary.label}</p>
              <p className="mt-2">{paymentSummary.note}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
                    <input type="hidden" name="returnTo" value={`/operator/bookings/${data.booking.id}`} />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                    >
                      Approve request
                    </button>
                  </form>

                  <form action={updateBookingStatus}>
                    <input type="hidden" name="bookingId" value={data.booking.id} />
                    <input type="hidden" name="nextStatus" value="REJECTED" />
                    <input type="hidden" name="returnTo" value={`/operator/bookings/${data.booking.id}`} />
                    <button
                      type="submit"
                      className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                    >
                      Reject request
                    </button>
                  </form>
                </>
              ) : null}

              {data.booking.status === "APPROVED" ? (
                <form action={updateBookingStatus}>
                  <input type="hidden" name="bookingId" value={data.booking.id} />
                  <input type="hidden" name="nextStatus" value="PAID" />
                  <input type="hidden" name="returnTo" value={`/operator/bookings/${data.booking.id}`} />
                  <button
                    type="submit"
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-400"
                  >
                    Mark paid
                  </button>
                </form>
              ) : null}

              <Link
                href={`/operator/listings/${data.booking.listingId}`}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
              >
                Open listing workflow
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Notification previews</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Customer</p>
                <p className="mt-2 font-medium text-slate-100">{customerNotification.title}</p>
                <p className="mt-2 text-slate-400">To: {customerNotification.audience}</p>
                <p className="mt-3">{customerNotification.body}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Operations</p>
                <p className="mt-2 font-medium text-slate-100">{opsNotification.title}</p>
                <p className="mt-2 text-slate-400">To: {opsNotification.audience}</p>
                <p className="mt-3">{opsNotification.body}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
