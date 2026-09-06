// PrismaClient singleton. In dev, Next.js hot-reloads modules, which would
// otherwise create a new client (and new DB connections) on every reload.
// Caching it on globalThis avoids exhausting the connection pool.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__hikereadyPrisma ??
  new PrismaClient({
    // Keep logs quiet in normal runs; errors still surface via our fallback.
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__hikereadyPrisma = prisma;
}
