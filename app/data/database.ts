import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Crear el cliente de Prisma
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada");
  }

  // Crear el pool de conexiones
  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }

  // Crear el adaptador de Prisma
  const adapter = new PrismaPg(pool);

  // Crear el cliente de Prisma
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Crear el cliente de Prisma
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  // Asignar el cliente de Prisma al global
  globalForPrisma.prisma = db;
}
