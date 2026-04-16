"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, normalizeNextPath, requireRole } from "@/src/lib/auth";
import { getRentalDays } from "@/src/lib/booking-workflow";

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

    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        customerId: customer.id,
        startDate,
        endDate,
        totalAmount,
        status: "REQUESTED",
        verificationStatus: "PENDING",
      },
    });

    revalidateWorkflowPaths(listing.id, booking.id);
    redirect(getRedirectUrl(returnTo, "booking-request-created"));
  } catch {
    redirect(getRedirectUrl(returnTo, "booking-request-failed"));
  }
}

export async function reviewListing(formData: FormData) {
  await requireRole(["ADMIN"], "/admin");

  const listingId = getString(formData, "listingId");
  const nextStatus = getString(formData, "nextStatus");
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
  const description = getString(formData, "description");
  const city = getString(formData, "city");
  const state = getString(formData, "state").toUpperCase();
  const dailyRate = getMoneyAmount(formData, "dailyRate");
  const intent = getString(formData, "intent");
  const returnTo = getString(formData, "returnTo") || `/operator/listings/${listingId}`;

  if (!listingId || !title || !description || !city || !state || state.length !== 2 || dailyRate <= 0) {
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
        description,
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
  const description = getString(formData, "description");
  const city = getString(formData, "city");
  const state = getString(formData, "state").toUpperCase();
  const dailyRate = getMoneyAmount(formData, "dailyRate");
  const intent = getString(formData, "intent");
  const returnTo = getString(formData, "returnTo") || "/operator/listings/new";

  if (!title || !description || !city || !state || state.length !== 2 || dailyRate <= 0) {
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
        description,
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
  const nextStatus = getString(formData, "nextStatus");
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
  const nextStatus = getString(formData, "nextStatus");
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
    if (session.role === "OPERATOR") {
      const authorizedBooking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          listing: {
            owner: {
              email: session.email,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!authorizedBooking) {
        redirect(getRedirectUrl(returnTo, "booking-status-failed"));
      }
    }

    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: nextStatus,
      },
      select: {
        id: true,
        listingId: true,
      },
    });

    revalidateWorkflowPaths(booking.listingId, booking.id);

    const successMessage =
      nextStatus === "APPROVED" ? "booking-approved" : nextStatus === "REJECTED" ? "booking-rejected" : "booking-paid";

    redirect(getRedirectUrl(returnTo, successMessage));
  } catch {
    redirect(getRedirectUrl(returnTo, "booking-status-failed"));
  }
}

export async function updateVerificationStatus(formData: FormData) {
  await requireRole(["ADMIN"], "/admin");

  const bookingId = getString(formData, "bookingId");
  const nextStatus = getString(formData, "nextStatus");
  const returnTo = getString(formData, "returnTo") || `/admin/bookings/${bookingId}`;

  if (!bookingId || !["APPROVED", "REJECTED"].includes(nextStatus)) {
    redirect(getRedirectUrl(returnTo, "verification-status-failed"));
  }

  const prisma = await loadPrismaClient();

  if (!prisma) {
    redirect(getRedirectUrl(returnTo, nextStatus === "APPROVED" ? "verification-approved-demo" : "verification-rejected-demo"));
  }

  try {
    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        verificationStatus: nextStatus,
      },
      select: {
        id: true,
        listingId: true,
      },
    });

    revalidateWorkflowPaths(booking.listingId, booking.id);
    redirect(getRedirectUrl(returnTo, nextStatus === "APPROVED" ? "verification-approved" : "verification-rejected"));
  } catch {
    redirect(getRedirectUrl(returnTo, "verification-status-failed"));
  }
}
