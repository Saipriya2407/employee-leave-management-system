
// <<<<<<< HEAD
// const { PrismaClient } = require("../generated/prisma");

// const prisma = new PrismaClient();

// async function testDatabase() {
//   try {
//     console.log("Connecting to Neon database...");

//     await prisma.$connect();

//     console.log("Database connected successfully!");

//     const users = await prisma.user.findMany();

//     console.log("Total users:", users.length);
//     console.log("Users:", users);

//   } catch (error) {
//     console.error("Database connection failed:", error.message);
// =======
// import { PrismaClient } from "../generated/prisma/client.ts";
// import { PrismaPg } from "@prisma/adapter-pg";

// const connectionString = process.env.DATABASE_URL;

// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

// async function testDatabase() {
//   console.log("Testing PostgreSQL database connection via Prisma...");

//   try {
//     await prisma.$connect();

//     console.log("Database connection successful!");

//     const userCount = await prisma.user.count();

//     console.log(`Current users in database: ${userCount}`);
//   } catch (error) {
//     console.error("Database connection failed:", error);
// >>>>>>> origin/database
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// testDatabase();
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function testDatabase() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully!");

    const userCount = await prisma.user.count();
    console.log("Total users:", userCount);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();