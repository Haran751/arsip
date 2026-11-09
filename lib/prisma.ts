import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Default Prisma (maxWait 2 dtk / timeout 5 dtk) terlalu ketat untuk
// Supabase pooler (port 6543). Transaksi bisa ditutup di tengah jalan lalu
// memicu "Transaction not found". Longgarkan batasnya.
const OPSI_TRANSAKSI = { maxWait: 10_000, timeout: 30_000 };

export function transaksi<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  opsi?: { maxWait?: number; timeout?: number },
): Promise<T> {
  return prisma.$transaction(fn, { ...OPSI_TRANSAKSI, ...opsi });
}
