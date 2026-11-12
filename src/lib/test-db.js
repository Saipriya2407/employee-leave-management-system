
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function testDatabase() {
  console.log("Testing PostgreSQL database connection via Prisma...");

  try {
    await prisma.$connect();

    console.log("Database connection successful!");

    const userCount = await prisma.user.count();

    console.log(`Current users in database: ${userCount}`);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
