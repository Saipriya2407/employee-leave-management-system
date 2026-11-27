
// import { PrismaClient } from "@/generated/prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { Pool } from "pg";

// const globalForPrisma = globalThis;

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL is missing from the .env file.");
// }

// const pool =
//   globalForPrisma.pgPool ??
//   new Pool({
//     connectionString: process.env.DATABASE_URL,
//   });

// const adapter = new PrismaPg(pool);

// const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     adapter,
//     log:
//       process.env.NODE_ENV === "development"
//         ? ["error", "warn"]
//         : ["error"],
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.pgPool = pool;
//   globalForPrisma.prisma = prisma;
// }

// export default prisma;
// export { prisma };

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
  });

globalForPrisma.pgPool = pool;
globalForPrisma.prisma = prisma;

export default prisma;
export { prisma };
