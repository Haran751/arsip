import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/types";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

export type Aktor = {
  id: string;
  nama: string;
  role: Role;
};

export async function sesiPengguna(): Promise<Aktor> {
  const session = await auth();
  if (!session?.user?.id || session.user.aktif === false) {
    throw new UnauthorizedError("Sesi tidak valid. Silakan login ulang.");
  }
  if (session.user.must_change_password) {
    throw new ForbiddenError("Ganti password terlebih dahulu.");
  }

  const role: Role = session.user.role === "Admin" ? session.user.role : "Operator";
  return {
    id: session.user.id,
    nama: session.user.name ?? session.user.email ?? "Pengguna",
    role,
  };
}

export function bolehKelola(aktor: Aktor) {
  return aktor.role === "Admin" || aktor.role === "Operator";
}

type Db = Prisma.TransactionClient | { logAktivitas: Prisma.TransactionClient["logAktivitas"] };

export async function tulisLog(
  db: Db,
  aktor: Aktor,
  aksi: string,
  keterangan: string,
  jenis: "buat" | "ubah" | "hapus" | "setuju" | "login" | "ekspor" | "cron",
  objek?: { type?: string; id?: string; data?: Prisma.InputJsonValue },
  sumber: "Aplikasi" | "Database" = "Aplikasi",
) {
  await db.logAktivitas.create({
    data: {
      user_id: aktor.id,
      aksi,
      objek_type: objek?.type,
      objek_id: objek?.id,
      keterangan,
      sumber,
      data_json: { jenis, ...(objek?.data ? { data: objek.data } : {}) },
    },
  });
}
