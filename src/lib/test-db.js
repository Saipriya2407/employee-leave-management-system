import prisma from "./prisma.js";

async function testConnection() {
  console.log("Testing PostgreSQL database connection via Prisma...");
  try {
    await prisma.$connect();
    console.log("Database connection successful!");
    const userCount = await prisma.user.count();
    console.log(`Current users in database: ${userCount}`);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

