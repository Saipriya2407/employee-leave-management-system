
const dotenv = require("dotenv");
const { defineConfig } = require("prisma/config");

dotenv.config({ path: "./.env.local" });

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
