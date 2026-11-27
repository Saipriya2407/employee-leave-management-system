
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const leaveTypes = [
    {
      name: "Casual Leave",
      code: "CASUAL",
      annualQuota: 12,
      quarterlyQuota: 3,
      carryForwardAllowed: false,
    },
    {
      name: "Sick Leave",
      code: "SICK",
      annualQuota: 12,
      quarterlyQuota: 3,
      carryForwardAllowed: true,
    },
    {
      name: "Work From Home",
      code: "WFH",
      annualQuota: 12,
      quarterlyQuota: 3,
      carryForwardAllowed: false,
    },
  ];

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: leaveType.code },
      update: {
        name: leaveType.name,
        annualQuota: leaveType.annualQuota,
        quarterlyQuota: leaveType.quarterlyQuota,
        carryForwardAllowed: leaveType.carryForwardAllowed,
        isActive: true,
      },
      create: leaveType,
    });
  }

  console.log("Leave types seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
