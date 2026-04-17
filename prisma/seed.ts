import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.bookingTimelineEvent.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const operator = await prisma.user.create({
    data: {
      email: "operator@trucksnow.com",
      name: "Texas Fleet Rentals",
      role: "OPERATOR",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@trucksnow.com",
      name: "Demo Customer",
      role: "CUSTOMER",
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@trucksnow.com",
      name: "Platform Admin",
      role: "ADMIN",
    },
  });

  await prisma.listing.createMany({
    data: [
      {
        ownerId: operator.id,
        title: "2021 Ford F-250 Work Truck",
        slug: "2021-ford-f-250-work-truck-dallas",
        vehicleType: "PICKUP",
        description: "Reliable heavy duty truck rental in Dallas for hauling, moving, and work site jobs.",
        photoUrls: [
          "https://placehold.co/1200x800/1e293b/f8fafc?text=Ford+F-250+Front",
          "https://placehold.co/1200x800/334155/f8fafc?text=Ford+F-250+Bed",
        ],
        passengerCapacity: 5,
        hasRamp: false,
        city: "Dallas",
        state: "TX",
        dailyRate: 14900,
        status: "ACTIVE",
      },
      {
        ownerId: operator.id,
        title: "2020 Isuzu NPR Box Truck",
        slug: "2020-isuzu-npr-box-truck-houston",
        vehicleType: "BOX_TRUCK",
        description: "Popular box truck in Houston for moves, deliveries, and business rentals.",
        photoUrls: [
          "https://placehold.co/1200x800/0f172a/f8fafc?text=Isuzu+NPR+Exterior",
          "https://placehold.co/1200x800/475569/f8fafc?text=Isuzu+NPR+Cargo+Box",
        ],
        boxSizeFeet: 16,
        passengerCapacity: 3,
        hasRamp: true,
        city: "Houston",
        state: "TX",
        dailyRate: 17900,
        status: "ACTIVE",
      },
      {
        ownerId: operator.id,
        title: "2019 Ram 2500 Utility Truck",
        slug: "2019-ram-2500-utility-truck-austin",
        vehicleType: "PICKUP",
        description: "Utility truck rental in Austin with flexible day rates and simple pickup.",
        photoUrls: ["https://placehold.co/1200x800/1f2937/f8fafc?text=Ram+2500+Utility+Truck"],
        passengerCapacity: 5,
        hasRamp: false,
        city: "Austin",
        state: "TX",
        dailyRate: 15900,
        status: "ACTIVE",
      },
    ],
  });

  const listings = await prisma.listing.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      dailyRate: true,
    },
  });

  if (listings.length >= 2) {
    await prisma.booking.createMany({
      data: [
        {
          listingId: listings[0].id,
          customerId: customer.id,
          startDate: new Date("2026-04-18T00:00:00.000Z"),
          endDate: new Date("2026-04-20T00:00:00.000Z"),
          totalAmount: listings[0].dailyRate * 2,
          status: "REQUESTED",
          verificationStatus: "PENDING",
          paymentStatus: "NOT_READY",
          customerNotificationKind: "REQUEST_RECEIVED",
          customerNotificationState: "SENT",
          customerNotificationSentAt: new Date("2026-04-16T14:05:00.000Z"),
          opsNotificationKind: "REQUEST_REVIEW",
          opsNotificationState: "PENDING",
        },
        {
          listingId: listings[1].id,
          customerId: customer.id,
          startDate: new Date("2026-04-22T00:00:00.000Z"),
          endDate: new Date("2026-04-25T00:00:00.000Z"),
          totalAmount: listings[1].dailyRate * 3,
          status: "APPROVED",
          verificationStatus: "APPROVED",
          paymentStatus: "PENDING_CAPTURE",
          customerNotificationKind: "BOOKING_APPROVED",
          customerNotificationState: "PENDING",
          opsNotificationKind: "PAYMENT_FOLLOW_UP",
          opsNotificationState: "SENT",
          opsNotificationSentAt: new Date("2026-04-16T15:10:00.000Z"),
        },
      ],
    });

    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (bookings[0]) {
      await prisma.bookingTimelineEvent.createMany({
        data: [
          {
            bookingId: bookings[0].id,
            eventType: "BOOKING_REQUESTED",
            title: "Booking requested",
            detail: "Demo Customer requested the Dallas Ford F-250 for a two-day rental window.",
            actorRole: "CUSTOMER",
            actorName: "Demo Customer",
            occurredAt: new Date("2026-04-16T14:00:00.000Z"),
          },
          {
            bookingId: bookings[0].id,
            eventType: "CUSTOMER_NOTIFICATION_SENT",
            title: "Customer confirmation sent",
            detail: "The booking confirmation email was marked sent to customer@trucksnow.com.",
            actorRole: "SYSTEM",
            actorName: "Workflow automation",
            occurredAt: new Date("2026-04-16T14:05:00.000Z"),
          },
        ],
      });
    }

    if (bookings[1]) {
      await prisma.bookingTimelineEvent.createMany({
        data: [
          {
            bookingId: bookings[1].id,
            eventType: "BOOKING_REQUESTED",
            title: "Booking requested",
            detail: "Demo Customer requested the Houston Isuzu NPR for a three-day rental window.",
            actorRole: "CUSTOMER",
            actorName: "Demo Customer",
            occurredAt: new Date("2026-04-16T14:20:00.000Z"),
          },
          {
            bookingId: bookings[1].id,
            eventType: "BOOKING_APPROVED",
            title: "Booking approved",
            detail: "Platform Admin approved the booking and moved it into payment capture.",
            actorRole: "ADMIN",
            actorName: "Platform Admin",
            occurredAt: new Date("2026-04-16T15:00:00.000Z"),
          },
          {
            bookingId: bookings[1].id,
            eventType: "OPS_NOTIFICATION_SENT",
            title: "Ops update sent",
            detail: "The ops payment follow-up update was marked sent.",
            actorRole: "SYSTEM",
            actorName: "Workflow automation",
            occurredAt: new Date("2026-04-16T15:10:00.000Z"),
          },
        ],
      });
    }
  }

  console.log("Seeded demo users and listings for Trucks Now.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
