import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function withAuditContext<T>(
  userId: string | null | undefined,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (userId) {
      const safe = String(userId).replace(/'/g, "''");
      await tx.$executeRawUnsafe("SET LOCAL app.current_user_id = '" + safe + "'");
    } else {
      await tx.$executeRawUnsafe("SET LOCAL app.current_user_id = ''");
    }
    return fn(tx);
  });
}
