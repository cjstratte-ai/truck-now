"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, getCurrentSession, normalizeNextPath, requireRole } from "@/src/lib/auth";
import {
  getCustomerNotificationKind,
  getNotificationFlowForBookingStatus,
  getNotificationFlowForNewRequest,
  getNotificationFlowForVerificationStatus,
  getOpsNotificationKind,
  getRentalDays,
} from "@/src/lib/booking-workflow";

async function loadPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { PrismaClient } = await import("@prisma/client");

  const globalForPrisma = globalThis as typeof globalThis & {
    prisma?: InstanceType<typeof PrismaClient>;
  };

  const prisma = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getRedirectUrl(path: string, message: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("message", message);
  return `${url.pathname}${url.search}`;
}

function getMoneyAmount(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return Number.NaN;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return Math.round(parsed * 100);
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "listing";
}

function getPhotoUrls(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return [] as string[];
  }

  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item))
    .slice(0, 8);
}

function getOptionalInt(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getPaymentReference(formData: FormData, bookingId: string) {
  const value = getString(formData, "paymentReference");

  if (value) {
    return value;
  }

  return `manual-${bookingId.slice(-6)}`;
}

async function findAuthorizedBooking(
  prisma: NonNullable<Awaited<ReturnType<typeof loadPrismaClient>>>,
  bookingId: string,
  session: Awaited<ReturnType<typeof requireRole>>,
) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(session.role === "OPERATOR"
        ? {
            listing: {
              owner: {
                email: session.email,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      listingId: true,
      status: true,
      verificationStatus: true,
      paymentStatus: true,
      customerNotificationKind: true,
      opsNotificationKind: true,
    },
  });
}

async function logBookingTimelineEvent(
  prisma: NonNullable<Awaited<ReturnType<typeof loadPrismaClient>>>,
  bookingId: string,
  event: {
    eventType: string;
    title: string;
    detail: string;
    actorRole?: string;
    actorName?: string;
    occurredAt?: Date;
  },
) {
  await prisma.bookingTimelineEvent.create({
    data: {
      bookingId,
      eventType: event.eventType,
      title: event.title,
      detail: event.detail,
      actorRole: event.actorRole,
      actorName: event.actorName,
      occurredAt: event.occurredAt,
    },
  });
}

async function logBookingTimelineEvents(
  prisma: NonNullable<Awaited<ReturnType<typeof loadPrismaClient>>>,
  bookingId: string,
  events: Array<{
    eventType: string;
    title: string;
    detail: string;
    actorRole?: string;
    actorName?: string;
    occurredAt?: Date;
  }>,
) {
  if (events.length === 0) {
    return;
  }

  await prisma.bookingTimelineEvent.createMany({
    data: events.map((event) => ({
      bookingId,
      eventType: event.eventType,
      title: event.title,
      detail: event.detail,
      actorRole: event.actorRole,
      actorName: event.actorName,
      occurredAt: event.occurredAt,
    })),
  });
}

function revalidateWorkflowPaths(listingId?: string, bookingId?: string) {
  revalidatePath("/customer");
  revalidatePath("/operator");
  revalidatePath("/admin");

  if (listingId) {
    revalidatePath(`/customer/listings/${listingId}`);
    revalidatePath(`/operator/listings/${listingId}`);
    revalidatePath(`/admin/listings/${listingId}`);
  }

  if (bookingId) {
    revalidatePath(`/operator/bookings/${bookingId}`);
    revalidatePath(`/admin/bookings/${bookingId}`);
    revalidatePath(`/customer/bookings/${bookingId}`);
  }
}

export async function signIn(formData: FormData) {
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const role = getString(formData, "role");
  const nextPath = getString(formData, "next");

  if (!name || !email || !["CUSTOMER", "OPERATOR", "ADMIN"].includes(role)) {
    redirect("/login?reason=invalid");
  }

  await createSession({
    name,
    email,
    role: role as "CUSTOMER" | "OPERATOR" | "ADMIN",
  });

  redirect(normalizeNextPath(nextPath, role as "CUSTOMER" | "OPERATOR" | "ADMIN"));
}

export async function signOut() {
  await clearSession();
  redirect("/login?reason=signed-out");
}

export async function createBookingRequest(formData: FormData) {
  const listingId = getString(formData, "listingId");
  const customerName = getString(formData, "customerName");
  const customerEmail = getString(formData, "customerEmail").toLowerCase();
  const startDateValue = getString(formData, "startDate");
  const endDateValue = getString(formData, "endDate");
  const returnTo = `/customer/listings/${listingId}`;

  if (!listingId || !customerName || !customerEmail || !startDateValue || !endDateValue) {
    redirect(getRedirectUrl(returnTo, "booking-request-missing-fields"));
  }

  const session = await getCurrentSession();

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    redirect(getRedirectUrl(returnTo, "booking-request-invalid-dates"));
  }

  if (startDate < today) {
    redirect(getRedirectUrl(returnTo, "booking-request-past-date"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, "booking-request-demo"));
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      select: {
        id: true,
        dailyRate: true,
        status: true,
      },
    });

    if (!listing || listing.status !== "ACTIVE") {
      redirect(getRedirectUrl(returnTo, "booking-request-unavailable"));
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        listingId: listing.id,
        status: {
          in: ["REQUESTED", "APPROVED", "PAID"],
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        id: true,
      },
    });

    if (conflict) {
      redirect(getRedirectUrl(returnTo, "booking-request-conflict"));
    }

    const customer = await prisma.user.upsert({
      where: {
        email: customerEmail,
      },
      update: {
        name: customerName,
      },
      create: {
        email: customerEmail,
        name: customerName,
        role: "CUSTOMER",
      },
    });

    const rentalDays = getRentalDays(startDateValue, endDateValue);
    const totalAmount = rentalDays * listing.dailyRate;

    const now = new Date();

    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        customerId: customer.id,
        startDate,
        endDate,
        totalAmount,
        status: "REQUESTED",
        verificationStatus: "PENDING",
        paymentStatus: "NOT_READY",
        ...getNotificationFlowForNewRequest(now),
      },
    });

    await logBookingTimelineEvents(prisma, booking.id, [
      {
        eventType: "BOOKING_REQUESTED",
        title: "Booking requested",
        detail: `${customerName} requested this truck from ${startDateValue} to ${endDateValue}.`,
        actorRole: "CUSTOMER",
        actorName: customerName,
        occurredAt: now,
      },
      {
        eventType: "CUSTOMER_NOTIFICATION_SENT",
        title: "Customer confirmation sent",
        detail: `The booking confirmation was marked sent to ${customerEmail}.`,
        actorRole: "SYSTEM",
        actorName: "Workflow automation",
        occurredAt: now,
      },
      {
        eventType: "OPS_NOTIFICATION_QUEUED",
        title: "Ops review queued",
        detail: "The booking is waiting on operator review and the ops lane is pending an update.",
        actorRole: "SYSTEM",
        actorName: "Workflow automation",
        occurredAt: now,
      },
    ]);

    revalidateWorkflowPaths(listing.id, booking.id);

    if (session?.role === "CUSTOMER" && session.email.toLowerCase() === customerEmail) {
      redirect(getRedirectUrl(`/customer/bookings/${booking.id}`, "booking-request-created"));
    }

    redirect(getRedirectUrl(returnTo, "booking-request-created"));
  } catch {
    redirect(getRedirectUrl(returnTo, "booking-request-failed"));
  }
}

export async function reviewListing(formData: FormData) {
  await requireRole(["ADMIN"], "/admin");

  const listingId = getString(formData, "listingId");
  const nextStatus = getString(formData, "nextStatus") as "ACTIVE" | "REJECTED";
  const reviewNotes = getString(formData, "reviewNotes");
  const returnTo = `/admin/listings/${listingId}`;

  if (!listingId || !["ACTIVE", "REJECTED"].includes(nextStatus)) {
    redirect(getRedirectUrl(returnTo, "listing-review-failed"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, nextStatus === "ACTIVE" ? "listing-approved-demo" : "listing-rejected-demo"));
  }

  try {
    await prisma.listing.update({
      where: {
        id: listingId,
      },
      data: {
        status: nextStatus,
        reviewNotes: nextStatus === "REJECTED" ? reviewNotes || null : null,
      },
    });

    revalidateWorkflowPaths(listingId);
    redirect(getRedirectUrl(returnTo, nextStatus === "ACTIVE" ? "listing-approved" : "listing-rejected"));
  } catch {
    redirect(getRedirectUrl(returnTo, "listing-review-failed"));
  }
}

export async function saveOperatorListing(formData: FormData) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");

  const listingId = getString(formData, "listingId");
  const title = getString(formData, "title");
  const vehicleType = getString(formData, "vehicleType") as "PICKUP" | "BOX_TRUCK" | "CARGO_VAN" | "OTHER";
  const description = getString(formData, "description");
  const city = getString(formData, "city");
  const state = getString(formData, "state").toUpperCase();
  const dailyRate = getMoneyAmount(formData, "dailyRate");
  const photoUrls = getPhotoUrls(formData, "photoUrls");
  const boxSizeFeet = getOptionalInt(formData, "boxSizeFeet");
  const passengerCapacity = getOptionalInt(formData, "passengerCapacity");
  const hasRamp = getCheckbox(formData, "hasRamp");
  const intent = getString(formData, "intent");
  const returnTo = getString(formData, "returnTo") || `/operator/listings/${listingId}`;

  if (
    !listingId ||
    !title ||
    !["PICKUP", "BOX_TRUCK", "CARGO_VAN", "OTHER"].includes(vehicleType) ||
    !description ||
    !city ||
    !state ||
    state.length !== 2 ||
    dailyRate <= 0 ||
    (vehicleType === "BOX_TRUCK" && !boxSizeFeet)
  ) {
    redirect(getRedirectUrl(returnTo, "listing-save-invalid"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, intent === "submit" ? "listing-submitted-demo" : "listing-saved-demo"));
  }

  try {
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        ...(session.role === "OPERATOR"
          ? {
              owner: {
                email: session.email,
              },
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!listing) {
      redirect(getRedirectUrl(returnTo, "listing-save-failed"));
    }

    const nextStatus =
      intent === "submit" ? "PENDING_APPROVAL" : listing.status === "REJECTED" ? "DRAFT" : listing.status;

    await prisma.listing.update({
      where: {
        id: listing.id,
      },
      data: {
        title,
        vehicleType,
        description,
        photoUrls,
        boxSizeFeet,
        passengerCapacity,
        hasRamp,
        city,
        state,
        dailyRate,
        status: nextStatus,
      },
    });

    revalidateWorkflowPaths(listing.id);
    redirect(getRedirectUrl(returnTo, intent === "submit" ? "listing-submitted" : "listing-saved"));
  } catch {
    redirect(getRedirectUrl(returnTo, "listing-save-failed"));
  }
}

export async function createOperatorListing(formData: FormData) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator/listings/new");

  const title = getString(formData, "title");
  const vehicleType = getString(formData, "vehicleType") as "PICKUP" | "BOX_TRUCK" | "CARGO_VAN" | "OTHER";
  const description = getString(formData, "description");
  const city = getString(formData, "city");
  const state = getString(formData, "state").toUpperCase();
  const dailyRate = getMoneyAmount(formData, "dailyRate");
  const photoUrls = getPhotoUrls(formData, "photoUrls");
  const boxSizeFeet = getOptionalInt(formData, "boxSizeFeet");
  const passengerCapacity = getOptionalInt(formData, "passengerCapacity");
  const hasRamp = getCheckbox(formData, "hasRamp");
  const intent = getString(formData, "intent");
  const returnTo = getString(formData, "returnTo") || "/operator/listings/new";

  if (
    !title ||
    !["PICKUP", "BOX_TRUCK", "CARGO_VAN", "OTHER"].includes(vehicleType) ||
    !description ||
    !city ||
    !state ||
    state.length !== 2 ||
    dailyRate <= 0 ||
    (vehicleType === "BOX_TRUCK" && !boxSizeFeet)
  ) {
    redirect(getRedirectUrl(returnTo, "listing-save-invalid"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, intent === "submit" ? "listing-created-submitted-demo" : "listing-created-demo"));
  }

  try {
    const owner = await prisma.user.upsert({
      where: {
        email: session.email,
      },
      update: {
        name: session.name,
        role: session.role,
      },
      create: {
        email: session.email,
        name: session.name,
        role: session.role,
      },
      select: {
        id: true,
      },
    });

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 2;

    while (await prisma.listing.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: owner.id,
        title,
        slug,
        vehicleType,
        description,
        photoUrls,
        boxSizeFeet,
        passengerCapacity,
        hasRamp,
        city,
        state,
        dailyRate,
        status: intent === "submit" ? "PENDING_APPROVAL" : "DRAFT",
      },
      select: {
        id: true,
      },
    });

    revalidateWorkflowPaths(listing.id);
    redirect(
      getRedirectUrl(
        `/operator/listings/${listing.id}`,
        intent === "submit" ? "listing-created-submitted" : "listing-created",
      ),
    );
  } catch {
    redirect(getRedirectUrl(returnTo, "listing-create-failed"));
  }
}

export async function archiveOperatorListing(formData: FormData) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");

  const listingId = getString(formData, "listingId");
  const nextStatus = getString(formData, "nextStatus") as "ARCHIVED" | "DRAFT";
  const returnTo = getString(formData, "returnTo") || `/operator/listings/${listingId}`;

  if (!listingId || !["ARCHIVED", "DRAFT"].includes(nextStatus)) {
    redirect(getRedirectUrl(returnTo, "listing-save-failed"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, nextStatus === "ARCHIVED" ? "listing-archived-demo" : "listing-restored-demo"));
  }

  try {
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        ...(session.role === "OPERATOR"
          ? {
              owner: {
                email: session.email,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!listing) {
      redirect(getRedirectUrl(returnTo, "listing-save-failed"));
    }

    await prisma.listing.update({
      where: {
        id: listing.id,
      },
      data: {
        status: nextStatus,
      },
    });

    revalidateWorkflowPaths(listing.id);
    redirect(getRedirectUrl(returnTo, nextStatus === "ARCHIVED" ? "listing-archived" : "listing-restored"));
  } catch {
    redirect(getRedirectUrl(returnTo, "listing-save-failed"));
  }
}

export async function updateBookingStatus(formData: FormData) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");

  const bookingId = getString(formData, "bookingId");
  const nextStatus = getString(formData, "nextStatus") as "APPROVED" | "REJECTED" | "PAID";
  const statusNote = getString(formData, "statusNote");
  const paymentReference = getPaymentReference(formData, bookingId);
  const returnTo = getString(formData, "returnTo") || `/operator/bookings/${bookingId}`;

  if (!bookingId || !["APPROVED", "REJECTED", "PAID"].includes(nextStatus)) {
    redirect(getRedirectUrl(returnTo, "booking-status-failed"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    const demoMessage =
      nextStatus === "APPROVED"
        ? "booking-approved-demo"
        : nextStatus === "REJECTED"
          ? "booking-rejected-demo"
          : "booking-paid-demo";

    redirect(getRedirectUrl(returnTo, demoMessage));
  }

  try {
    const currentBooking = await findAuthorizedBooking(prisma, bookingId, session);

    if (!currentBooking) {
      redirect(getRedirectUrl(returnTo, "booking-status-failed"));
    }

    const now = new Date();
    let updateData:
      | {
          status: "APPROVED" | "REJECTED" | "PAID";
          paymentStatus: "NOT_READY" | "PENDING_CAPTURE" | "CAPTURED";
          paymentCapturedAt: Date | null;
          paymentReference: string | null;
          customerNotificationKind: string;
          customerNotificationState: "PENDING";
          customerNotificationSentAt: null;
          opsNotificationKind: string;
          opsNotificationState: "PENDING";
          opsNotificationSentAt: null;
        }
      | undefined;

    if (nextStatus === "APPROVED") {
      if (currentBooking.status !== "REQUESTED" || currentBooking.verificationStatus === "REJECTED") {
        redirect(getRedirectUrl(returnTo, "booking-status-failed"));
      }

      updateData = {
        status: nextStatus,
        paymentStatus: "PENDING_CAPTURE",
        paymentCapturedAt: null,
        paymentReference: null,
        ...getNotificationFlowForBookingStatus(nextStatus),
      };
    } else if (nextStatus === "REJECTED") {
      if (currentBooking.status === "PAID") {
        redirect(getRedirectUrl(returnTo, "booking-status-failed"));
      }

      updateData = {
        status: nextStatus,
        paymentStatus: "NOT_READY",
        paymentCapturedAt: null,
        paymentReference: null,
        ...getNotificationFlowForBookingStatus(nextStatus),
      };
    } else {
      if (currentBooking.status !== "APPROVED" || currentBooking.paymentStatus !== "PENDING_CAPTURE") {
        redirect(getRedirectUrl(returnTo, "booking-status-failed"));
      }

      updateData = {
        status: nextStatus,
        paymentStatus: "CAPTURED",
        paymentCapturedAt: now,
        paymentReference,
        ...getNotificationFlowForBookingStatus(nextStatus),
      };
    }

    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: updateData,
      select: {
        id: true,
        listingId: true,
      },
    });

    await logBookingTimelineEvents(prisma, booking.id, [
      {
        eventType: nextStatus === "APPROVED" ? "BOOKING_APPROVED" : nextStatus === "REJECTED" ? "BOOKING_REJECTED" : "PAYMENT_CAPTURED",
        title: nextStatus === "APPROVED" ? "Booking approved" : nextStatus === "REJECTED" ? "Booking rejected" : "Payment captured",
        detail:
          nextStatus === "APPROVED"
            ? `${session.name} approved the booking and moved it into payment capture.${statusNote ? ` Note: ${statusNote}` : ""}`
            : nextStatus === "REJECTED"
              ? `${session.name} rejected the booking and stopped it from moving forward.${statusNote ? ` Note: ${statusNote}` : ""}`
              : `${session.name} captured payment with reference ${paymentReference}.${statusNote ? ` Note: ${statusNote}` : ""}`,
        actorRole: session.role,
        actorName: session.name,
        occurredAt: now,
      },
      {
        eventType: "WORKFLOW_NOTIFICATION_QUEUED",
        title: "Workflow updates queued",
        detail:
          nextStatus === "APPROVED"
            ? "Customer payment instructions and ops follow-up are pending send."
            : nextStatus === "REJECTED"
              ? "Customer and ops rejection updates are pending send."
              : "Customer payment confirmation and ops handoff updates are pending send.",
        actorRole: "SYSTEM",
        actorName: "Workflow automation",
        occurredAt: now,
      },
    ]);

    revalidateWorkflowPaths(booking.listingId, booking.id);

    const successMessage =
      nextStatus === "APPROVED" ? "booking-approved" : nextStatus === "REJECTED" ? "booking-rejected" : "booking-paid";

    redirect(getRedirectUrl(returnTo, successMessage));
  } catch {
    redirect(getRedirectUrl(returnTo, "booking-status-failed"));
  }
}

export async function updateVerificationStatus(formData: FormData) {
  const session = await requireRole(["ADMIN"], "/admin");

  const bookingId = getString(formData, "bookingId");
  const nextStatus = getString(formData, "nextStatus") as "APPROVED" | "REJECTED";
  const verificationNote = getString(formData, "verificationNote");
  const returnTo = getString(formData, "returnTo") || `/admin/bookings/${bookingId}`;

  if (!bookingId || !["APPROVED", "REJECTED"].includes(nextStatus)) {
    redirect(getRedirectUrl(returnTo, "verification-status-failed"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, nextStatus === "APPROVED" ? "verification-approved-demo" : "verification-rejected-demo"));
  }

  try {
    const currentBooking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!currentBooking) {
      redirect(getRedirectUrl(returnTo, "verification-status-failed"));
    }

    const now = new Date();

    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data:
        nextStatus === "APPROVED"
          ? {
              verificationStatus: nextStatus,
              ...getNotificationFlowForVerificationStatus(nextStatus),
            }
          : {
              verificationStatus: nextStatus,
              status: currentBooking.status === "PAID" ? currentBooking.status : "REJECTED",
              paymentStatus: currentBooking.status === "PAID" ? undefined : "NOT_READY",
              paymentCapturedAt: currentBooking.status === "PAID" ? undefined : null,
              paymentReference: currentBooking.status === "PAID" ? undefined : null,
              ...getNotificationFlowForVerificationStatus(nextStatus),
            },
      select: {
        id: true,
        listingId: true,
      },
    });

    await logBookingTimelineEvents(prisma, booking.id, [
      {
        eventType: nextStatus === "APPROVED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
        title: nextStatus === "APPROVED" ? "Verification approved" : "Verification rejected",
        detail:
          nextStatus === "APPROVED"
            ? `${session.name} cleared verification so the booking can keep moving.${verificationNote ? ` Note: ${verificationNote}` : ""}`
            : `${session.name} rejected verification and blocked the booking from continuing.${verificationNote ? ` Note: ${verificationNote}` : ""}`,
        actorRole: session.role,
        actorName: session.name,
        occurredAt: now,
      },
      {
        eventType: "WORKFLOW_NOTIFICATION_QUEUED",
        title: "Workflow updates queued",
        detail:
          nextStatus === "APPROVED"
            ? "Ops review is pending an updated workflow send."
            : "Customer and ops verification-failure updates are pending send.",
        actorRole: "SYSTEM",
        actorName: "Workflow automation",
        occurredAt: now,
      },
    ]);

    revalidateWorkflowPaths(booking.listingId, booking.id);
    redirect(getRedirectUrl(returnTo, nextStatus === "APPROVED" ? "verification-approved" : "verification-rejected"));
  } catch {
    redirect(getRedirectUrl(returnTo, "verification-status-failed"));
  }
}

export async function sendBookingNotification(formData: FormData) {
  const session = await requireRole(["OPERATOR", "ADMIN"], "/operator");

  const bookingId = getString(formData, "bookingId");
  const audience = getString(formData, "audience");
  const returnTo = getString(formData, "returnTo") || `/operator/bookings/${bookingId}`;

  if (!bookingId || !["customer", "ops"].includes(audience)) {
    redirect(getRedirectUrl(returnTo, "notification-send-failed"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, audience === "customer" ? "customer-notification-sent-demo" : "ops-notification-sent-demo"));
  }

  try {
    const bookingRecord = await findAuthorizedBooking(prisma, bookingId, session);

    if (!bookingRecord) {
      redirect(getRedirectUrl(returnTo, "notification-send-failed"));
    }

    const now = new Date();
    const customerKind = getCustomerNotificationKind(
      bookingRecord.status,
      bookingRecord.verificationStatus,
      bookingRecord.customerNotificationKind,
    );
    const opsKind = getOpsNotificationKind(
      bookingRecord.status,
      bookingRecord.verificationStatus,
      bookingRecord.opsNotificationKind,
    );

    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data:
        audience === "customer"
          ? {
              customerNotificationKind: customerKind,
              customerNotificationState: "SENT",
              customerNotificationSentAt: now,
            }
          : {
              opsNotificationKind: opsKind,
              opsNotificationState: "SENT",
              opsNotificationSentAt: now,
            },
      select: {
        id: true,
        listingId: true,
      },
    });

    await logBookingTimelineEvent(prisma, booking.id, {
      eventType: audience === "customer" ? "CUSTOMER_NOTIFICATION_SENT" : "OPS_NOTIFICATION_SENT",
      title: audience === "customer" ? "Customer update sent" : "Ops update sent",
      detail:
        audience === "customer"
          ? `${session.name} marked the ${customerKind.toLowerCase().replaceAll("_", " ")} update sent to the customer.`
          : `${session.name} marked the ${opsKind.toLowerCase().replaceAll("_", " ")} update sent to operations.`,
      actorRole: session.role,
      actorName: session.name,
      occurredAt: now,
    });

    revalidateWorkflowPaths(booking.listingId, booking.id);
    redirect(getRedirectUrl(returnTo, audience === "customer" ? "customer-notification-sent" : "ops-notification-sent"));
  } catch {
    redirect(getRedirectUrl(returnTo, "notification-send-failed"));
  }
}
