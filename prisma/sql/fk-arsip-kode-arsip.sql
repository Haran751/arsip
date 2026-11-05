ALTER TABLE "arsip" DROP CONSTRAINT IF EXISTS "arsip_kode_arsip_id_fkey";

ALTER TABLE "arsip"
  ADD CONSTRAINT "arsip_kode_arsip_id_fkey"
  FOREIGN KEY ("kode_arsip_id") REFERENCES "kode_arsip"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;
