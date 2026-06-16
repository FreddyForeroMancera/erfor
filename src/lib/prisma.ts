import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// In Vercel, process.cwd() points to the project root where prisma/dev.db should be copied.
const dbUrl = process.env.NODE_ENV === "production" 
  ? `file:${path.join(process.cwd(), "prisma", "dev.db")}` 
  : "file:./dev.db";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
