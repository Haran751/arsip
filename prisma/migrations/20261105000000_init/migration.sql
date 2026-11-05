-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Operator',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kode_arsip" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "parent_id" TEXT,
    "retensi_aktif_thn" INTEGER NOT NULL DEFAULT 0,
    "retensi_inaktif_thn" INTEGER NOT NULL DEFAULT 0,
    "nasib_akhir" TEXT NOT NULL DEFAULT 'Musnah',
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kode_arsip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "keterangan" TEXT,
    "pembuat" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arsip" (
    "id" TEXT NOT NULL,
    "nomor_arsip" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "kode_arsip_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "tanggal_arsip" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "file_path" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "akhir_aktif" TIMESTAMP(3),
    "akhir_retensi" TIMESTAMP(3),
    "status_retensi" TEXT NOT NULL DEFAULT 'Aktif',
    "retensi_override_thn" INTEGER,
    "alasan_override" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arsip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arsip_riwayat" (
    "id" TEXT NOT NULL,
    "arsip_id" TEXT NOT NULL,
    "user_id" TEXT,
    "aksi" TEXT NOT NULL,
    "keterangan" TEXT,
    "data_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arsip_riwayat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usulan_pemusnahan" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "diajukan_oleh" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Diajukan',
    "disetujui_oleh" TEXT,
    "catatan" TEXT,
    "diputuskan_pada" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usulan_pemusnahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usulan_pemusnahan_item" (
    "id" TEXT NOT NULL,
    "usulan_id" TEXT NOT NULL,
    "arsip_id" TEXT NOT NULL,

    CONSTRAINT "usulan_pemusnahan_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_aktivitas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "aksi" TEXT NOT NULL,
    "objek_type" TEXT,
    "objek_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "keterangan" TEXT,
    "data_json" JSONB,
    "sumber" TEXT NOT NULL DEFAULT 'Aplikasi',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_aktivitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "dibaca" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaturan" (
    "id" TEXT NOT NULL,
    "kunci" TEXT NOT NULL,
    "nilai" JSONB,

    CONSTRAINT "pengaturan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kode_arsip_kode_key" ON "kode_arsip"("kode");

-- CreateIndex
CREATE INDEX "kode_arsip_kode_idx" ON "kode_arsip"("kode");

-- CreateIndex
CREATE INDEX "kode_arsip_parent_id_idx" ON "kode_arsip"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "folder_nama_key" ON "folder"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "arsip_nomor_arsip_key" ON "arsip"("nomor_arsip");

-- CreateIndex
CREATE INDEX "arsip_kode_arsip_id_idx" ON "arsip"("kode_arsip_id");

-- CreateIndex
CREATE INDEX "arsip_folder_id_idx" ON "arsip"("folder_id");

-- CreateIndex
CREATE INDEX "arsip_tanggal_arsip_idx" ON "arsip"("tanggal_arsip");

-- CreateIndex
CREATE INDEX "arsip_akhir_retensi_idx" ON "arsip"("akhir_retensi");

-- CreateIndex
CREATE INDEX "arsip_status_retensi_idx" ON "arsip"("status_retensi");

-- CreateIndex
CREATE INDEX "arsip_created_by_idx" ON "arsip"("created_by");

-- CreateIndex
CREATE INDEX "arsip_riwayat_arsip_id_idx" ON "arsip_riwayat"("arsip_id");

-- CreateIndex
CREATE UNIQUE INDEX "usulan_pemusnahan_nomor_key" ON "usulan_pemusnahan"("nomor");

-- CreateIndex
CREATE INDEX "usulan_pemusnahan_item_arsip_id_idx" ON "usulan_pemusnahan_item"("arsip_id");

-- CreateIndex
CREATE UNIQUE INDEX "usulan_pemusnahan_item_usulan_id_arsip_id_key" ON "usulan_pemusnahan_item"("usulan_id", "arsip_id");

-- CreateIndex
CREATE INDEX "log_aktivitas_created_at_idx" ON "log_aktivitas"("created_at");

-- CreateIndex
CREATE INDEX "log_aktivitas_user_id_idx" ON "log_aktivitas"("user_id");

-- CreateIndex
CREATE INDEX "notifikasi_user_id_dibaca_idx" ON "notifikasi"("user_id", "dibaca");

-- CreateIndex
CREATE UNIQUE INDEX "pengaturan_kunci_key" ON "pengaturan"("kunci");

-- AddForeignKey
ALTER TABLE "kode_arsip" ADD CONSTRAINT "kode_arsip_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "kode_arsip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_kode_arsip_id_fkey" FOREIGN KEY ("kode_arsip_id") REFERENCES "kode_arsip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsip_riwayat" ADD CONSTRAINT "arsip_riwayat_arsip_id_fkey" FOREIGN KEY ("arsip_id") REFERENCES "arsip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsip_riwayat" ADD CONSTRAINT "arsip_riwayat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usulan_pemusnahan" ADD CONSTRAINT "usulan_pemusnahan_diajukan_oleh_fkey" FOREIGN KEY ("diajukan_oleh") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usulan_pemusnahan" ADD CONSTRAINT "usulan_pemusnahan_disetujui_oleh_fkey" FOREIGN KEY ("disetujui_oleh") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usulan_pemusnahan_item" ADD CONSTRAINT "usulan_pemusnahan_item_usulan_id_fkey" FOREIGN KEY ("usulan_id") REFERENCES "usulan_pemusnahan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usulan_pemusnahan_item" ADD CONSTRAINT "usulan_pemusnahan_item_arsip_id_fkey" FOREIGN KEY ("arsip_id") REFERENCES "arsip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_aktivitas" ADD CONSTRAINT "log_aktivitas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

