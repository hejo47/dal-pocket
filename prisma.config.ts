import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // The local placeholder permits client generation without database credentials.
  // Runtime database access always requires DATABASE_URL.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://localhost:5432/dal_pocket" },
});
