export type InventoryItem = {
  id: string;
  slug: string;
  title: string;
  city: string;
  state: string;
  dailyRate: number;
  description: string;
};

export type CustomerInventoryData = {
  sourceLabel: string;
  listings: InventoryItem[];
};

export type CustomerListingDetail = {
  sourceLabel: string;
  listing: InventoryItem;
  highlights: string[];
};

export type OperatorListing = {
  id: string;
  slug: string;
  title: string;
  city: string;
  state: string;
  dailyRate: number;
  status: string;
};

export type OperatorBooking = {
  id: string;
  listingId: string;
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

export type OperatorListingDetail = {
  sourceLabel: string;
  listing: OperatorListing & {
    description: string;
    ownerName: string;
  };
  stats: {
    recentBookings: number;
    requestedBookings: number;
    paidBookings: number;
  };
  actionItems: string[];
};

export type OperatorBookingDetail = {
  sourceLabel: string;
  booking: OperatorBooking & {
    customerEmail: string;
  };
  actionItems: string[];
  checklist: string[];
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
  listingId: string;
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

export type AdminListingReviewDetail = {
  sourceLabel: string;
  listing: AdminListingReview & {
    description: string;
    ownerName: string;
    ownerEmail: string;
    dailyRate: number;
  };
  actionItems: string[];
  checklist: string[];
};

export type AdminBookingReviewDetail = {
  sourceLabel: string;
  booking: AdminBookingReview & {
    city: string;
    startDate: string;
    endDate: string;
    customerEmail: string;
  };
  actionItems: string[];
  checklist: string[];
};

type ListingRecord = InventoryItem & {
  status: string;
  ownerName: string;
  ownerEmail: string;
};

type BookingRecord = {
  id: string;
  listingId: string;
  listingTitle: string;
  city: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  verificationStatus: string;
};

type CatalogData = {
  source: "live" | "sample";
  listings: ListingRecord[];
  bookings: BookingRecord[];
};

const fallbackListings: ListingRecord[] = [
  {
    id: "listing-1",
    slug: "2021-ford-f250-work-truck",
    title: "2021 Ford F-250 Work Truck",
    description: "Reliable heavy-duty truck rental in Dallas for hauling, moving, and work-site jobs.",
    city: "Dallas",
    state: "TX",
    dailyRate: 14900,
    status: "ACTIVE",
    ownerName: "Texas Fleet Rentals",
    ownerEmail: "operator@trucksnow.com",
  },
  {
    id: "listing-2",
    slug: "2020-isuzu-npr-box-truck",
    title: "2020 Isuzu NPR Box Truck",
    description: "Popular Houston box truck for deliveries, business rentals, and multi-stop move days.",
    city: "Houston",
    state: "TX",
    dailyRate: 17900,
    status: "ACTIVE",
    ownerName: "Texas Fleet Rentals",
    ownerEmail: "operator@trucksnow.com",
  },
  {
    id: "listing-3",
    slug: "2019-ram-2500-utility-truck",
    title: "2019 Ram 2500 Utility Truck",
    description: "Utility truck listing waiting on final admin approval before it can go live in Austin.",
    city: "Austin",
    state: "TX",
    dailyRate: 15900,
    status: "PENDING_APPROVAL",
    ownerName: "Texas Fleet Rentals",
    ownerEmail: "operator@trucksnow.com",
  },
  {
    id: "listing-4",
    slug: "2022-chevy-silverado-2500hd",
    title: "2022 Chevy Silverado 2500HD",
    description: "Draft listing that still needs photos, delivery rules, and operator notes before review.",
    city: "San Antonio",
    state: "TX",
    dailyRate: 16900,
    status: "DRAFT",
    ownerName: "Texas Fleet Rentals",
    ownerEmail: "operator@trucksnow.com",
  },
];

const fallbackBookings: BookingRecord[] = [
  {
    id: "booking-1",
    listingId: "listing-1",
    listingTitle: "2021 Ford F-250 Work Truck",
    city: "Dallas",
    customerName: "Demo Customer",
    customerEmail: "customer@trucksnow.com",
    startDate: "2026-04-18",
    endDate: "2026-04-20",
    totalAmount: 29800,
    status: "REQUESTED",
    verificationStatus: "PENDING",
  },
  {
    id: "booking-2",
    listingId: "listing-2",
    listingTitle: "2020 Isuzu NPR Box Truck",
    city: "Houston",
    customerName: "Northside Builders",
    customerEmail: "dispatch@northsidebuilders.com",
    startDate: "2026-04-22",
    endDate: "2026-04-25",
    totalAmount: 53700,
    status: "APPROVED",
    verificationStatus: "APPROVED",
  },
  {
    id: "booking-3",
    listingId: "listing-1",
    listingTitle: "2021 Ford F-250 Work Truck",
    city: "Dallas",
    customerName: "Riverfront Moving",
    customerEmail: "ops@riverfrontmoving.com",
    startDate: "2026-04-08",
    endDate: "2026-04-10",
    totalAmount: 29800,
    status: "PAID",
    verificationStatus: "APPROVED",
  },
];

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

function getSourceLabel(source: CatalogData["source"], label: string) {
  return `${source === "live" ? "Live DB" : "Sample"} ${label}`;
}

function mapOperatorListing(listing: ListingRecord): OperatorListing {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    city: listing.city,
    state: listing.state,
    dailyRate: listing.dailyRate,
    status: listing.status,
  };
}

function mapOperatorBooking(booking: BookingRecord): OperatorBooking {
  return {
    id: booking.id,
    listingId: booking.listingId,
    listingTitle: booking.listingTitle,
    city: booking.city,
    customerName: booking.customerName,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    verificationStatus: booking.verificationStatus,
    totalAmount: booking.totalAmount,
  };
}

function mapAdminListingReview(listing: ListingRecord): AdminListingReview {
  return {
    id: listing.id,
    title: listing.title,
    city: listing.city,
    state: listing.state,
    status: listing.status,
  };
}

function mapAdminBookingReview(booking: BookingRecord): AdminBookingReview {
  return {
    id: booking.id,
    listingId: booking.listingId,
    listingTitle: booking.listingTitle,
    customerName: booking.customerName,
    status: booking.status,
    verificationStatus: booking.verificationStatus,
    totalAmount: booking.totalAmount,
  };
}

function getOperatorListingActionItems(status: string) {
  if (status === "PENDING_APPROVAL") {
    return [
      "Confirm the photo set, description, and daily rate are final before nudging admin review.",
      "Double-check pickup instructions and any usage restrictions for the first renter.",
      "Keep the listing warm with a public preview while approval is pending.",
    ];
  }

  if (status === "DRAFT") {
    return [
      "Finish the listing description and add final pickup notes.",
      "Confirm pricing and availability windows before sending for approval.",
      "Review the public preview to make sure the listing reads clearly for renters.",
    ];
  }

  return [
    "Review recent requests and make sure the calendar still reflects actual availability.",
    "Keep photos, pickup notes, and rate guidance current so conversion stays high.",
    "Use the customer preview to sanity-check the live listing experience.",
  ];
}

function getOperatorBookingActionItems(status: string, verificationStatus: string) {
  const actionItems: string[] = [];

  if (status === "REQUESTED") {
    actionItems.push("Review dates, pricing, and pickup details, then respond quickly to hold the renter.");
  }

  if (verificationStatus === "PENDING") {
    actionItems.push("Check verification status before approving keys or delivery instructions.");
  }

  if (status === "APPROVED") {
    actionItems.push("Confirm payment capture and send pickup details once everything clears.");
  }

  if (status === "PAID") {
    actionItems.push("Prepare handoff logistics and keep the return window visible for the operator team.");
  }

  if (actionItems.length === 0) {
    actionItems.push("Review the booking details and make sure the next operator handoff step is assigned.");
  }

  actionItems.push("Use this detail view as the source of truth before messaging the customer.");

  return actionItems;
}

function getAdminListingActionItems(status: string) {
  if (status === "PENDING_APPROVAL") {
    return [
      "Validate the listing copy, location, and pricing so it can move live without another review cycle.",
      "Check for missing photos, prohibited vehicle uses, or unclear pickup instructions.",
      "Approve the listing when the public-facing experience is strong enough to publish.",
    ];
  }

  return [
    "Review the listing state and confirm whether it still belongs in the current queue.",
    "Spot-check pricing and quality before making any manual status change.",
    "Use the public preview if you need a quick customer-side sanity check.",
  ];
}

function getAdminBookingActionItems(status: string, verificationStatus: string) {
  const actionItems: string[] = [];

  if (status === "REQUESTED") {
    actionItems.push("Verify the booking request is complete and route it to the operator for response.");
  }

  if (verificationStatus === "PENDING") {
    actionItems.push("Review the verification lane before the rental window starts.");
  }

  if (status === "APPROVED") {
    actionItems.push("Confirm the renter can move cleanly from approval to payment and handoff.");
  }

  if (actionItems.length === 0) {
    actionItems.push("Review the booking details and confirm no manual admin intervention is still required.");
  }

  actionItems.push("Use this page to keep booking status and verification status aligned.");

  return actionItems;
}

async function loadCatalog(): Promise<CatalogData> {
  try {
    const prisma = await loadPrismaClient();

    if (!prisma) {
      return {
        source: "sample",
        listings: fallbackListings,
        bookings: fallbackBookings,
      };
    }

    const [listings, bookings] = await Promise.all([
      prisma.listing.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          city: true,
          state: true,
          dailyRate: true,
          status: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.booking.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          listingId: true,
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
      slug: string;
      title: string;
      description: string;
      city: string;
      state: string;
      dailyRate: number;
      status: string;
      owner: {
        name: string | null;
        email: string;
      };
    }>;

    const typedBookings = bookings as Array<{
      id: string;
      listingId: string;
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

    return {
      source: "live",
      listings: typedListings.map((listing) => ({
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        city: listing.city,
        state: listing.state,
        dailyRate: listing.dailyRate,
        status: listing.status,
        ownerName: listing.owner.name ?? listing.owner.email,
        ownerEmail: listing.owner.email,
      })),
      bookings: typedBookings.map((booking) => ({
        id: booking.id,
        listingId: booking.listingId,
        listingTitle: booking.listing.title,
        city: booking.listing.city,
        customerName: booking.customer.name ?? booking.customer.email,
        customerEmail: booking.customer.email,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        totalAmount: booking.totalAmount,
        status: booking.status,
        verificationStatus: booking.verificationStatus,
      })),
    };
  } catch {
    return {
      source: "sample",
      listings: fallbackListings,
      bookings: fallbackBookings,
    };
  }
}

export async function getActiveListings(): Promise<InventoryItem[]> {
  const { listings } = await loadCatalog();

  return listings
    .filter((listing) => listing.status === "ACTIVE")
    .map(({ id, slug, title, city, state, dailyRate, description }) => ({
      id,
      slug,
      title,
      city,
      state,
      dailyRate,
      description,
    }));
}

export async function getCustomerInventoryData(): Promise<CustomerInventoryData> {
  const { source, listings } = await loadCatalog();

  return {
    sourceLabel: getSourceLabel(source, "inventory"),
    listings: listings
      .filter((listing) => listing.status === "ACTIVE")
      .map(({ id, slug, title, city, state, dailyRate, description }) => ({
        id,
        slug,
        title,
        city,
        state,
        dailyRate,
        description,
      })),
  };
}

export async function getCustomerListingDetail(id: string): Promise<CustomerListingDetail | null> {
  const { source, listings } = await loadCatalog();
  const listing = listings.find((item) => item.id === id && item.status === "ACTIVE");

  if (!listing) {
    return null;
  }

  return {
    sourceLabel: getSourceLabel(source, "listing detail"),
    listing: {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      city: listing.city,
      state: listing.state,
      dailyRate: listing.dailyRate,
      description: listing.description,
    },
    highlights: [
      "Fast booking requests for short-term truck rentals.",
      "Clear review before approval so the rental window stays organized.",
      "Useful for moves, deliveries, and work-site jobs without a long-term commitment.",
    ],
  };
}

export async function getOperatorDashboardData(): Promise<OperatorDashboardData> {
  const { source, listings, bookings } = await loadCatalog();
  const operatorListings = listings.map(mapOperatorListing);
  const operatorBookings = bookings.slice(0, 8).map(mapOperatorBooking);

  return {
    sourceLabel: getSourceLabel(source, "operator dashboard"),
    stats: {
      activeListings: operatorListings.filter((listing) => listing.status === "ACTIVE").length,
      pendingListings: operatorListings.filter(
        (listing) => listing.status === "PENDING_APPROVAL" || listing.status === "DRAFT",
      ).length,
      requestedBookings: operatorBookings.filter((booking) => booking.status === "REQUESTED").length,
      paidBookings: operatorBookings.filter((booking) => booking.status === "PAID").length,
      revenuePotential: operatorListings
        .filter((listing) => listing.status === "ACTIVE")
        .reduce((sum, listing) => sum + listing.dailyRate, 0),
    },
    listings: operatorListings,
    bookings: operatorBookings,
  };
}

export async function getOperatorListingDetail(id: string): Promise<OperatorListingDetail | null> {
  const { source, listings, bookings } = await loadCatalog();
  const listing = listings.find((item) => item.id === id);

  if (!listing) {
    return null;
  }

  const relatedBookings = bookings.filter((booking) => booking.listingId === listing.id);

  return {
    sourceLabel: getSourceLabel(source, "operator workflow"),
    listing: {
      ...mapOperatorListing(listing),
      description: listing.description,
      ownerName: listing.ownerName,
    },
    stats: {
      recentBookings: relatedBookings.length,
      requestedBookings: relatedBookings.filter((booking) => booking.status === "REQUESTED").length,
      paidBookings: relatedBookings.filter((booking) => booking.status === "PAID").length,
    },
    actionItems: getOperatorListingActionItems(listing.status),
  };
}

export async function getOperatorBookingDetail(id: string): Promise<OperatorBookingDetail | null> {
  const { source, bookings } = await loadCatalog();
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    return null;
  }

  return {
    sourceLabel: getSourceLabel(source, "operator booking workflow"),
    booking: {
      ...mapOperatorBooking(booking),
      customerEmail: booking.customerEmail,
    },
    actionItems: getOperatorBookingActionItems(booking.status, booking.verificationStatus),
    checklist: [
      "Dates and total amount match the intended rental window.",
      "Verification status is appropriate for the next operator action.",
      "Pickup and return instructions are ready before customer communication.",
    ],
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { source, listings, bookings } = await loadCatalog();
  const pendingListings = listings.filter((listing) => listing.status === "PENDING_APPROVAL");
  const activeListings = listings.filter((listing) => listing.status === "ACTIVE");
  const requestedBookings = bookings.filter((booking) => booking.status === "REQUESTED");
  const verificationPending = bookings.filter((booking) => booking.verificationStatus === "PENDING");

  return {
    sourceLabel: getSourceLabel(source, "admin queue"),
    stats: {
      pendingApprovals: pendingListings.length,
      activeListings: activeListings.length,
      requestedBookings: requestedBookings.length,
      verificationPending: verificationPending.length,
    },
    listingReviewQueue: pendingListings.slice(0, 6).map(mapAdminListingReview),
    bookingReviewQueue: requestedBookings.slice(0, 6).map(mapAdminBookingReview),
    verificationQueue: verificationPending.slice(0, 6).map(mapAdminBookingReview),
  };
}

export async function getAdminListingReviewDetail(id: string): Promise<AdminListingReviewDetail | null> {
  const { source, listings } = await loadCatalog();
  const listing = listings.find((item) => item.id === id);

  if (!listing) {
    return null;
  }

  return {
    sourceLabel: getSourceLabel(source, "admin review"),
    listing: {
      ...mapAdminListingReview(listing),
      description: listing.description,
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail,
      dailyRate: listing.dailyRate,
    },
    actionItems: getAdminListingActionItems(listing.status),
    checklist: [
      "Title and description explain the vehicle clearly.",
      "Location, daily rate, and status all match the intended release state.",
      "The listing feels ready for a renter-facing marketplace page.",
    ],
  };
}

export async function getAdminBookingReviewDetail(id: string): Promise<AdminBookingReviewDetail | null> {
  const { source, bookings } = await loadCatalog();
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    return null;
  }

  return {
    sourceLabel: getSourceLabel(source, "admin booking review"),
    booking: {
      ...mapAdminBookingReview(booking),
      city: booking.city,
      startDate: booking.startDate,
      endDate: booking.endDate,
      customerEmail: booking.customerEmail,
    },
    actionItems: getAdminBookingActionItems(booking.status, booking.verificationStatus),
    checklist: [
      "Booking status and verification status do not contradict each other.",
      "The listing, renter, and rental dates look internally consistent.",
      "Any manual admin follow-up is clear before the booking window opens.",
    ],
  };
}
