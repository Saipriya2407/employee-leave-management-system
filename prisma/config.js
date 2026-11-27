const dotenv = require("dotenv");
const { defineConfig } = require("prisma/config");

dotenv.config({ path: "./backend/.env" });

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "FOUND" : "MISSING");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});