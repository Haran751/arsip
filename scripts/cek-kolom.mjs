import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
for (const t of ["users","kode_arsip","arsip","log_aktivitas","usulan_pemusnahan","notifikasi","arsip_riwayat","pengaturan","usulan_pemusnahan_item"]) {
  try {
    const r = await p.$queryRawUnsafe(`select column_name, data_type from information_schema.columns where table_schema='public' and table_name='${t}' order by ordinal_position`);
    console.log(t, JSON.stringify(r));
  } catch (e) { console.log(t, "ERR", e.message); }
}
const u = await p.$queryRawUnsafe("select id, nama, username, email from users");
console.log("users", u);
await p.$disconnect();