import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
for (const t of ["users","folder","kode_arsip","arsip","usulan_pemusnahan","log_aktivitas"]) {
  const r = await p.$queryRawUnsafe(`select count(*)::int as n from "${t}"`);
  console.log(t, r[0].n);
}
await p.$disconnect();