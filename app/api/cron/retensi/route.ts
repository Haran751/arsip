import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hitungRetensi } from "@/lib/retensi";
import { UnauthorizedError, withApiErrorHandling } from "@/lib/errors";

function statusRetensi(nasib: string, akhirAktif: Date, akhirRetensi: Date, now: Date) {
  if (nasib === "Permanen") return "Permanen";
  if (now >= akhirAktif || now >= akhirRetensi) return "Inaktif";
  return "Aktif";
}

function awalHari(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new UnauthorizedError("Akses cron tidak sah.");
  }

  const now = new Date();
  const daftar = await prisma.arsip.findMany({
    where: { deleted_at: null },
    include: { kode_arsip: true },
  });

  let diperbarui = 0;
  let jatuhTempo = 0;
  let notifikasi = 0;

  for (const arsip of daftar) {
    const { akhirAktif, akhirRetensi } = hitungRetensi(
      arsip.tanggal_arsip,
      arsip.kode_arsip.retensi_aktif_thn,
      arsip.kode_arsip.retensi_inaktif_thn,
    );
    const status = statusRetensi(arsip.kode_arsip.nasib_akhir, akhirAktif, akhirRetensi, now);

    if (
      arsip.status_retensi !== status ||
      arsip.akhir_aktif?.getTime() !== akhirAktif.getTime() ||
      arsip.akhir_retensi?.getTime() !== akhirRetensi.getTime()
    ) {
      await prisma.arsip.update({
        where: { id: arsip.id },
        data: {
          akhir_aktif: akhirAktif,
          akhir_retensi: akhirRetensi,
          status_retensi: status,
        },
      });
      diperbarui += 1;
    }

    const sisaHari = Math.ceil((akhirRetensi.getTime() - now.getTime()) / 86_400_000);
    if (sisaHari >= 0 && sisaHari <= 90) {
      jatuhTempo += 1;
      for (const ambang of [30, 90]) {
        if (sisaHari > ambang) continue;
        const judul = `Jatuh tempo ${ambang} hari: ${arsip.nomor_arsip}`;
        const sudahAda = await prisma.notifikasi.findFirst({
          where: { judul, created_at: { gte: awalHari(now) } },
        });
        if (sudahAda) continue;
        await prisma.notifikasi.create({
          data: {
            judul,
            pesan: `Arsip "${arsip.judul}" akan jatuh tempo pada ${akhirRetensi.toLocaleDateString("id-ID")}.`,
          },
        });
        notifikasi += 1;
      }
    }
  }

  if (diperbarui > 0) {
    await prisma.logAktivitas.create({
      data: {
        aksi: "Cron Retensi",
        objek_type: "arsip",
        keterangan: `Memperbarui status retensi ${diperbarui} arsip.`,
        sumber: "Aplikasi",
        data_json: { jenis: "cron", diperbarui, jatuhTempo },
      },
    });
  }

  return NextResponse.json({
    ok: true,
    diperiksa: daftar.length,
    diperbarui,
    jatuhTempo,
    notifikasi,
    dijalankan_pada: now.toISOString(),
  });
});
