import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function getActiveListings() {
  try {
    return await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        city: "asc",
      },
    });
  } catch {
    return [];
  }
}
