import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const r = await p.$queryRawUnsafe("select column_name, data_type from information_schema.columns where table_schema='public' and table_name='folder' order by ordinal_position");
console.log(r);
await p.$disconnect();