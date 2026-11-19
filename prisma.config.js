
const dotenv = require("dotenv");
const { defineConfig } = require("prisma/config");

dotenv.config({ path: "./.env.local" });

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
