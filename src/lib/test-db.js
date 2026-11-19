
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log("Connecting to Neon database...");

    await prisma.$connect();

    console.log("Database connected successfully!");

    const users = await prisma.user.findMany();

    console.log("Total users:", users.length);
    console.log("Users:", users);

  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
