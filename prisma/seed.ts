import { PrismaClient, ListingStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const operator = await prisma.user.create({
    data: {
      email: "operator@trucksnow.com",
      name: "Texas Fleet Rentals",
      role: Role.OPERATOR,
    },
  });

  await prisma.user.create({
    data: {
      email: "customer@trucksnow.com",
      name: "Demo Customer",
      role: Role.CUSTOMER,
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@trucksnow.com",
      name: "Platform Admin",
      role: Role.ADMIN,
    },
  });

  await prisma.listing.createMany({
    data: [
      {
        ownerId: operator.id,
        title: "2021 Ford F-250 Work Truck",
        slug: "2021-ford-f-250-work-truck-dallas",
        description: "Reliable heavy duty truck rental in Dallas for hauling, moving, and work site jobs.",
        city: "Dallas",
        state: "TX",
        dailyRate: 14900,
        status: ListingStatus.ACTIVE,
      },
      {
        ownerId: operator.id,
        title: "2020 Isuzu NPR Box Truck",
        slug: "2020-isuzu-npr-box-truck-houston",
        description: "Popular box truck in Houston for moves, deliveries, and business rentals.",
        city: "Houston",
        state: "TX",
        dailyRate: 17900,
        status: ListingStatus.ACTIVE,
      },
      {
        ownerId: operator.id,
        title: "2019 Ram 2500 Utility Truck",
        slug: "2019-ram-2500-utility-truck-austin",
        description: "Utility truck rental in Austin with flexible day rates and simple pickup.",
        city: "Austin",
        state: "TX",
        dailyRate: 15900,
        status: ListingStatus.ACTIVE,
      },
    ],
  });

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
