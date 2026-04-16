export type InventoryItem = {
  id: string;
  title: string;
  city: string;
  dailyRate: number;
  description: string;
};

export type OperatorListing = {
  id: string;
  title: string;
  city: string;
  state: string;
  dailyRate: number;
  status: string;
};

export type OperatorBooking = {
  id: string;
  listingTitle: string;
  city: string;
  customerName: string;
  startDate: string;
  endDate: string;
  status: string;
  verificationStatus: string;
  totalAmount: number;
};

export type OperatorDashboardData = {
  sourceLabel: string;
  stats: {
    activeListings: number;
    pendingListings: number;
    requestedBookings: number;
    paidBookings: number;
    revenuePotential: number;
  };
  listings: OperatorListing[];
  bookings: OperatorBooking[];
};

export type AdminListingReview = {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
};

export type AdminBookingReview = {
  id: string;
  listingTitle: string;
  customerName: string;
  status: string;
  verificationStatus: string;
  totalAmount: number;
};

export type AdminDashboardData = {
  sourceLabel: string;
  stats: {
    pendingApprovals: number;
    activeListings: number;
    requestedBookings: number;
    verificationPending: number;
  };
  listingReviewQueue: AdminListingReview[];
  bookingReviewQueue: AdminBookingReview[];
  verificationQueue: AdminBookingReview[];
};

const fallbackOperatorListings: OperatorListing[] = [
  {
    id: "operator-1",
    title: "2021 Ford F-250 Work Truck",
    city: "Dallas",
    state: "TX",
    dailyRate: 14900,
    status: "ACTIVE",
  },
  {
    id: "operator-2",
    title: "2020 Isuzu NPR Box Truck",
    city: "Houston",
    state: "TX",
    dailyRate: 17900,
    status: "ACTIVE",
  },
  {
    id: "operator-3",
    title: "2019 Ram 2500 Utility Truck",
    city: "Austin",
    state: "TX",
    dailyRate: 15900,
    status: "PENDING_APPROVAL",
  },
  {
    id: "operator-4",
    title: "2022 Chevy Silverado 2500HD",
    city: "San Antonio",
    state: "TX",
    dailyRate: 16900,
    status: "DRAFT",
  },
];

const fallbackOperatorBookings: OperatorBooking[] = [
  {
    id: "booking-1",
    listingTitle: "2021 Ford F-250 Work Truck",
    city: "Dallas",
    customerName: "Demo Customer",
    startDate: "2026-04-18",
    endDate: "2026-04-20",
    status: "REQUESTED",
    verificationStatus: "PENDING",
    totalAmount: 29800,
  },
  {
    id: "booking-2",
    listingTitle: "2020 Isuzu NPR Box Truck",
    city: "Houston",
    customerName: "Northside Builders",
    startDate: "2026-04-22",
    endDate: "2026-04-25",
    status: "APPROVED",
    verificationStatus: "APPROVED",
    totalAmount: 53700,
  },
  {
    id: "booking-3",
    listingTitle: "2021 Ford F-250 Work Truck",
    city: "Dallas",
    customerName: "Riverfront Moving",
    startDate: "2026-04-08",
    endDate: "2026-04-10",
    status: "PAID",
    verificationStatus: "APPROVED",
    totalAmount: 29800,
  },
];

const fallbackAdminData: AdminDashboardData = {
  sourceLabel: "Sample admin queue",
  stats: {
    pendingApprovals: 2,
    activeListings: 2,
    requestedBookings: 1,
    verificationPending: 1,
  },
  listingReviewQueue: [
    {
      id: "admin-listing-1",
      title: "2019 Ram 2500 Utility Truck",
      city: "Austin",
      state: "TX",
      status: "PENDING_APPROVAL",
    },
    {
      id: "admin-listing-2",
      title: "2022 Chevy Silverado 2500HD",
      city: "San Antonio",
      state: "TX",
      status: "PENDING_APPROVAL",
    },
  ],
  bookingReviewQueue: [
    {
      id: "admin-booking-1",
      listingTitle: "2021 Ford F-250 Work Truck",
      customerName: "Demo Customer",
      status: "REQUESTED",
      verificationStatus: "PENDING",
      totalAmount: 29800,
    },
  ],
  verificationQueue: [
    {
      id: "admin-verification-1",
      listingTitle: "2021 Ford F-250 Work Truck",
      customerName: "Demo Customer",
      status: "REQUESTED",
      verificationStatus: "PENDING",
      totalAmount: 29800,
    },
  ],
};

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

function getFallbackOperatorDashboardData(): OperatorDashboardData {
  const activeListings = fallbackOperatorListings.filter((listing) => listing.status === "ACTIVE").length;
  const pendingListings = fallbackOperatorListings.filter(
    (listing) => listing.status === "PENDING_APPROVAL" || listing.status === "DRAFT",
  ).length;
  const requestedBookings = fallbackOperatorBookings.filter((booking) => booking.status === "REQUESTED").length;
  const paidBookings = fallbackOperatorBookings.filter((booking) => booking.status === "PAID").length;
  const revenuePotential = fallbackOperatorListings
    .filter((listing) => listing.status === "ACTIVE")
    .reduce((sum, listing) => sum + listing.dailyRate, 0);

  return {
    sourceLabel: "Sample operator dashboard",
    stats: {
      activeListings,
      pendingListings,
      requestedBookings,
      paidBookings,
      revenuePotential,
    },
    listings: fallbackOperatorListings,
    bookings: fallbackOperatorBookings,
  };
}

export async function getActiveListings(): Promise<InventoryItem[]> {
  try {
    const prisma = await loadPrismaClient();

    if (!prisma) {
      return [];
    }

    return await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        city: "asc",
      },
      select: {
        id: true,
        title: true,
        city: true,
        dailyRate: true,
        description: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getOperatorDashboardData(): Promise<OperatorDashboardData> {
  const fallback = getFallbackOperatorDashboardData();

  try {
    const prisma = await loadPrismaClient();

    if (!prisma) {
      return fallback;
    }

    const [listings, bookings] = await Promise.all([
      prisma.listing.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          dailyRate: true,
          status: true,
        },
      }),
      prisma.booking.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalAmount: true,
          status: true,
          verificationStatus: true,
          listing: {
            select: {
              title: true,
              city: true,
            },
          },
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const typedListings = listings as Array<{
      id: string;
      title: string;
      city: string;
      state: string;
      dailyRate: number;
      status: string;
    }>;

    const typedBookings = bookings as Array<{
      id: string;
      startDate: Date;
      endDate: Date;
      totalAmount: number;
      status: string;
      verificationStatus: string;
      listing: {
        title: string;
        city: string;
      };
      customer: {
        name: string | null;
        email: string;
      };
    }>;

    const mappedListings: OperatorListing[] = typedListings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      city: listing.city,
      state: listing.state,
      dailyRate: listing.dailyRate,
      status: listing.status,
    }));

    const mappedBookings: OperatorBooking[] = typedBookings.map((booking) => ({
      id: booking.id,
      listingTitle: booking.listing.title,
      city: booking.listing.city,
      customerName: booking.customer.name ?? booking.customer.email,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      status: booking.status,
      verificationStatus: booking.verificationStatus,
      totalAmount: booking.totalAmount,
    }));

    return {
      sourceLabel: "Live DB operator dashboard",
      stats: {
        activeListings: mappedListings.filter((listing) => listing.status === "ACTIVE").length,
        pendingListings: mappedListings.filter(
          (listing) => listing.status === "PENDING_APPROVAL" || listing.status === "DRAFT",
        ).length,
        requestedBookings: mappedBookings.filter((booking) => booking.status === "REQUESTED").length,
        paidBookings: mappedBookings.filter((booking) => booking.status === "PAID").length,
        revenuePotential: mappedListings
          .filter((listing) => listing.status === "ACTIVE")
          .reduce((sum, listing) => sum + listing.dailyRate, 0),
      },
      listings: mappedListings,
      bookings: mappedBookings,
    };
  } catch {
    return fallback;
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const prisma = await loadPrismaClient();

    if (!prisma) {
      return fallbackAdminData;
    }

    const [pendingApprovals, activeListings, requestedBookings, verificationPending, listingReviewQueue, bookingReviewQueue, verificationQueue] =
      await Promise.all([
        prisma.listing.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.listing.count({ where: { status: "ACTIVE" } }),
        prisma.booking.count({ where: { status: "REQUESTED" } }),
        prisma.booking.count({ where: { verificationStatus: "PENDING" } }),
        prisma.listing.findMany({
          where: { status: "PENDING_APPROVAL" },
          take: 6,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            status: true,
          },
        }),
        prisma.booking.findMany({
          where: { status: "REQUESTED" },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            verificationStatus: true,
            totalAmount: true,
            listing: { select: { title: true } },
            customer: { select: { name: true, email: true } },
          },
        }),
        prisma.booking.findMany({
          where: { verificationStatus: "PENDING" },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            verificationStatus: true,
            totalAmount: true,
            listing: { select: { title: true } },
            customer: { select: { name: true, email: true } },
          },
        }),
      ]);

    const mapBookingReview = (booking: {
      id: string;
      status: string;
      verificationStatus: string;
      totalAmount: number;
      listing: { title: string };
      customer: { name: string | null; email: string };
    }): AdminBookingReview => ({
      id: booking.id,
      listingTitle: booking.listing.title,
      customerName: booking.customer.name ?? booking.customer.email,
      status: booking.status,
      verificationStatus: booking.verificationStatus,
      totalAmount: booking.totalAmount,
    });

    return {
      sourceLabel: "Live DB admin queue",
      stats: {
        pendingApprovals,
        activeListings,
        requestedBookings,
        verificationPending,
      },
      listingReviewQueue: (listingReviewQueue as Array<{
        id: string;
        title: string;
        city: string;
        state: string;
        status: string;
      }>).map((listing) => ({
        id: listing.id,
        title: listing.title,
        city: listing.city,
        state: listing.state,
        status: listing.status,
      })),
      bookingReviewQueue: (bookingReviewQueue as Array<{
        id: string;
        status: string;
        verificationStatus: string;
        totalAmount: number;
        listing: { title: string };
        customer: { name: string | null; email: string };
      }>).map(mapBookingReview),
      verificationQueue: (verificationQueue as Array<{
        id: string;
        status: string;
        verificationStatus: string;
        totalAmount: number;
        listing: { title: string };
        customer: { name: string | null; email: string };
      }>).map(mapBookingReview),
    };
  } catch {
    return fallbackAdminData;
  }
}
