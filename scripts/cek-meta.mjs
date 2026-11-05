import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const r = await p.$queryRawUnsafe("select table_name, column_name, is_nullable, column_default, data_type from information_schema.columns where table_schema='public' and table_name in ('folder','log_aktivitas') order by table_name, ordinal_position");
console.log(r);
await p.$disconnect();