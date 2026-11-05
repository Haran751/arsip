import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dataUraian = [
  {
    kode: "AR.01.01",
    nama: "Penyusunan Kebijakan Pengelolaan Arsip Dinamis",
    retensi_aktif_thn: 2,
    retensi_inaktif_thn: 3,
    nasib_akhir: "Musnah",
    uraian: [
      "Tata Naskah Dinas",
      "Kode Klasifikasi Arsip",
      "Jadwal Retensi Arsip",
      "Sistem Klasifikasi Keamanan dan Akses Arsip",
      "Pengelolaan Arsip Dinamis",
    ],
  },
  {
    kode: "AR.01.02",
    nama: "Pelaksanaan Kebijakan Pengelolaan Arsip Dinamis",
    retensi_aktif_thn: 1,
    retensi_inaktif_thn: 2,
    nasib_akhir: "Musnah",
    uraian: ["Sosialisasi", "Fasilitasi", "Seminar, dan lain-lain"],
  },
  {
    kode: "AR.02.01",
    nama: "Pengelolaan Surat Masuk",
    retensi_aktif_thn: 2,
    retensi_inaktif_thn: 3,
    nasib_akhir: "Musnah",
    uraian: [
      "Buku Agenda Surat Masuk",
      "Kartu Kendali",
      "Lembar Pengantar/Buku Ekspedisi",
      "Penomoran Surat",
      "Pengarahan, Pencatatan, dan Pendistribusian Surat",
      "Penggunaan Cap/Stempel",
      "Pengiriman Surat/Barang Cetakan",
    ],
  },
  {
    kode: "AR.02.02",
    nama: "Pengelolaan Surat Keluar",
    retensi_aktif_thn: 2,
    retensi_inaktif_thn: 3,
    nasib_akhir: "Musnah",
    uraian: ["Buku Agenda Surat Keluar"],
  },
];

async function main() {
  for (const item of dataUraian) {
    await prisma.kodeArsip.upsert({
      where: { kode: item.kode },
      update: { uraian: item.uraian },
      create: {
        kode: item.kode,
        nama: item.nama,
        retensi_aktif_thn: item.retensi_aktif_thn,
        retensi_inaktif_thn: item.retensi_inaktif_thn,
        nasib_akhir: item.nasib_akhir,
        uraian: item.uraian,
      },
    });
  }

  console.log(`Seed uraian selesai: ${dataUraian.length} kode.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
