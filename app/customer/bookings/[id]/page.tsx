import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCurrency,
  getCustomerNotificationPreview,
  getPaymentSummary,
} from "@/src/lib/booking-workflow";
import { requireRole } from "@/src/lib/auth";
import { getCustomerBookingDetail } from "@/src/lib/inventory";
import { getFlashClasses, getWorkflowFlash } from "@/src/lib/workflow-flash";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not sent yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusBadgeClasses(status: string) {
  if (status === "PAID") {
    return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  }

  if (status === "APPROVED") {
    return "bg-sky-500/15 text-sky-200 border-sky-500/30";
  }

  if (status === "REJECTED") {
    return "bg-rose-500/15 text-rose-200 border-rose-500/30";
  }

  return "bg-orange-500/15 text-orange-200 border-orange-500/30";
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function CustomerBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await requireRole(["CUSTOMER"], `/customer/bookings/${id}`);
  const data = await getCustomerBookingDetail(id, session.email.toLowerCase());

  if (!data) {
    notFound();
  }

  const flash = getWorkflowFlash(resolvedSearchParams.message);
  const paymentSummary = getPaymentSummary({
    listingTitle: data.booking.listingTitle,
    customerName: data.booking.customerName,
    customerEmail: data.booking.customerEmail,
    startDate: data.booking.startDate,
    endDate: data.booking.endDate,
    totalAmount: data.booking.totalAmount,
    status: data.booking.status,
    verificationStatus: data.booking.verificationStatus,
    paymentStatus: data.booking.paymentStatus,
    paymentCapturedAt: data.booking.paymentCapturedAt,
    paymentReference: data.booking.paymentReference,
    customerNotificationKind: data.booking.customerNotificationKind,
    customerNotificationState: data.booking.customerNotificationState,
    customerNotificationSentAt: data.booking.customerNotificationSentAt,
    opsNotificationKind: data.booking.opsNotificationKind,
    opsNotificationState: data.booking.opsNotificationState,
    opsNotificationSentAt: data.booking.opsNotificationSentAt,
  });
  const customerPreview = getCustomerNotificationPreview({
    listingTitle: data.booking.listingTitle,
    customerName: data.booking.customerName,
    customerEmail: data.booking.customerEmail,
    startDate: data.booking.startDate,
    endDate: data.booking.endDate,
    totalAmount: data.booking.totalAmount,
    status: data.booking.status,
    verificationStatus: data.booking.verificationStatus,
    paymentStatus: data.booking.paymentStatus,
    paymentCapturedAt: data.booking.paymentCapturedAt,
    paymentReference: data.booking.paymentReference,
    customerNotificationKind: data.booking.customerNotificationKind,
    customerNotificationState: data.booking.customerNotificationState,
    customerNotificationSentAt: data.booking.customerNotificationSentAt,
    opsNotificationKind: data.booking.opsNotificationKind,
    opsNotificationState: data.booking.opsNotificationState,
    opsNotificationSentAt: data.booking.opsNotificationSentAt,
  });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-white">
      <Link href="/customer" className="text-sm text-orange-300 transition hover:text-orange-200">
        ← Back to inventory
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">{data.sourceLabel}</span>
          <span className={`rounded-full border px-3 py-1 text-sm ${getStatusBadgeClasses(data.booking.status)}`}>
            {formatLabel(data.booking.status)}
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
            Verification: {formatLabel(data.booking.verificationStatus)}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{data.booking.listingTitle}</h1>
            <p className="mt-2 text-slate-400">Booking #{data.booking.id.slice(-6)}</p>
          </div>
          <p className="text-2xl font-semibold text-orange-300">{formatCurrency(data.booking.totalAmount)} total</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Rental window</p>
            <p className="mt-2 font-medium text-slate-100">
              {formatDate(data.booking.startDate)} to {formatDate(data.booking.endDate)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Payment status</p>
            <p className="mt-2 font-medium text-slate-100">{paymentSummary.label}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Customer updates</p>
            <p className="mt-2 font-medium text-slate-100">{formatLabel(data.booking.customerNotificationState)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Last update</p>
            <p className="mt-2 font-medium text-slate-100">{formatDateTime(data.timeline[0]?.occurredAt ?? null)}</p>
          </div>
        </div>
      </div>

      {flash ? <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getFlashClasses(flash.tone)}`}>{flash.text}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">What happens next</h2>
          <div className="mt-4 space-y-3">
            {data.nextSteps.map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
            <p className="font-medium text-slate-100">Payment summary</p>
            <p className="mt-2">{paymentSummary.note}</p>
            {data.booking.paymentReference ? (
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Reference: {data.booking.paymentReference}</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Latest customer update</h2>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-wide text-orange-300">{customerPreview.title}</p>
              <p className="mt-3">{customerPreview.body}</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">
                {formatLabel(customerPreview.state)} • {formatDateTime(customerPreview.sentAt)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Booking timeline</h2>
            <div className="mt-4 space-y-4">
              {data.timeline.map((event) => (
                <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-slate-100">{event.title}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{formatDateTime(event.occurredAt)}</p>
                  </div>
                  <p className="mt-2">{event.detail}</p>
                  {(event.actorName || event.actorRole) ? (
                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                      {event.actorName ?? "Unknown"}
                      {event.actorRole ? ` • ${event.actorRole}` : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
