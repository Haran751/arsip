import { prisma } from "../lib/prisma";
import { handleError } from "../lib/errors";

async function main() {
  try {
    await prisma.arsip.findMany({ take: 1 });
  } catch (error) {
    const hasil = handleError(error, { aksi: "tes" });
    console.log(JSON.stringify(hasil, null, 2));
    const e = error as { name?: string; code?: string; errorCode?: string; cause?: unknown };
    console.log("name:", e?.name, "| code:", e?.code, "| errorCode:", e?.errorCode);
    if (e?.cause instanceof Error) console.log("cause.name:", e.cause.name, "cause.message:", e.cause.message.slice(0, 100));
  }
  process.exit(0);
}

void main();
