"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import {
  SIFAT_ARSIP,
  TINGKAT_PERKEMBANGAN,
  type BerkasArsip,
  type BerkasInput,
} from "@/lib/daftar-isi";

type BerkasFormModalProps = {
  initial?: BerkasArsip | null;
  onClose: () => void;
  onSubmit: (values: BerkasInput) => string | null;
};

function today() {
  const value = new Date();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

function formAwal(): BerkasInput {
  return {
    nomor_berkas: "",
    kode_klasifikasi: "",
    indeks_berkas: "",
    jumlah_folder: 0,
    no_item_arsip: "",
    uraian_informasi: "",
    tanggal: today(),
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 0,
    sifat_arsip: "Biasa",
    no_filling_cabinet: "",
    no_laci: "",
    no_folder: "",
    keterangan: "",
  };
}

function dariBerkas(berkas: BerkasArsip): BerkasInput {
  return {
    nomor_berkas: berkas.nomor_berkas,
    kode_klasifikasi: berkas.kode_klasifikasi,
    indeks_berkas: berkas.indeks_berkas,
    jumlah_folder: berkas.jumlah_folder,
    no_item_arsip: berkas.no_item_arsip,
    uraian_informasi: berkas.uraian_informasi,
    tanggal: berkas.tanggal,
    tingkat_perkembangan: berkas.tingkat_perkembangan,
    jumlah_halaman: berkas.jumlah_halaman,
    sifat_arsip: berkas.sifat_arsip,
    no_filling_cabinet: berkas.no_filling_cabinet,
    no_laci: berkas.no_laci,
    no_folder: berkas.no_folder,
    keterangan: berkas.keterangan,
  };
}

export default function BerkasFormModal({ initial, onClose, onSubmit }: BerkasFormModalProps) {
  const [values, setValues] = useState<BerkasInput>(() => (initial ? dariBerkas(initial) : formAwal()));
  const [error, setError] = useState("");

  const ubah = <K extends keyof BerkasInput>(kunci: K, nilai: BerkasInput[K]) => {
    setValues((current) => ({ ...current, [kunci]: nilai }));
  };

  const simpan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.nomor_berkas.trim() || !values.kode_klasifikasi.trim() || !values.uraian_informasi.trim()) {
      setError("Nomor berkas, kode klasifikasi, dan uraian informasi wajib diisi.");
      return;
    }
    if (!values.tanggal) {
      setError("Tanggal berkas wajib diisi.");
      return;
    }

    const pesan = onSubmit({
      ...values,
      nomor_berkas: values.nomor_berkas.trim(),
      kode_klasifikasi: values.kode_klasifikasi.trim(),
      indeks_berkas: values.indeks_berkas.trim(),
      no_item_arsip: values.no_item_arsip.trim(),
      uraian_informasi: values.uraian_informasi.trim(),
      no_filling_cabinet: values.no_filling_cabinet.trim(),
      no_laci: values.no_laci.trim(),
      no_folder: values.no_folder.trim(),
      keterangan: values.keterangan.trim(),
      jumlah_folder: Math.max(0, Number(values.jumlah_folder) || 0),
      jumlah_halaman: Math.max(0, Number(values.jumlah_halaman) || 0),
    });

    if (pesan) {
      setError(pesan);
      return;
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit Arsip" : "Tambah Arsip"}
      subtitle="Lengkapi 14 informasi berkas sesuai daftar isi arsip aktif."
      width={900}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="form-berkas-arsip" className="btn">
            {initial ? "Simpan Perubahan" : "Simpan Arsip"}
          </button>
        </>
      }
    >
      <form id="form-berkas-arsip" onSubmit={simpan}>
        {error ? <div className="error-box">{error}</div> : null}

        <div className="form-grid">
          <div className="doc-form-title">Identitas Berkas</div>
          <div className="field">
            <label htmlFor="nomor-berkas">Nomor Berkas</label>
            <input
              id="nomor-berkas"
              className="input mono"
              value={values.nomor_berkas}
              onChange={(event) => ubah("nomor_berkas", event.target.value)}
              placeholder="Contoh: BKS-2026-013/KEU"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="kode-klasifikasi">Kode Klasifikasi</label>
            <input
              id="kode-klasifikasi"
              className="input mono"
              value={values.kode_klasifikasi}
              onChange={(event) => ubah("kode_klasifikasi", event.target.value)}
              placeholder="Contoh: KEU.01.02"
              required
            />
          </div>
          <div className="field field-full">
            <label htmlFor="indeks-berkas">Indeks Berkas</label>
            <input
              id="indeks-berkas"
              className="input"
              value={values.indeks_berkas}
              onChange={(event) => ubah("indeks_berkas", event.target.value)}
              placeholder="Contoh: Laporan Realisasi Anggaran"
            />
          </div>

          <div className="doc-form-title">Informasi Arsip</div>
          <div className="field">
            <label htmlFor="no-item">No. Item Arsip</label>
            <input
              id="no-item"
              className="input mono"
              value={values.no_item_arsip}
              onChange={(event) => ubah("no_item_arsip", event.target.value)}
              placeholder="Contoh: 001"
            />
          </div>
          <div className="field">
            <label htmlFor="tanggal-berkas">Tanggal</label>
            <input
              id="tanggal-berkas"
              type="date"
              className="input"
              value={values.tanggal}
              onChange={(event) => ubah("tanggal", event.target.value)}
              required
            />
          </div>
          <div className="field field-full">
            <label htmlFor="uraian-informasi">Uraian Informasi Arsip</label>
            <textarea
              id="uraian-informasi"
              className="input"
              value={values.uraian_informasi}
              onChange={(event) => ubah("uraian_informasi", event.target.value)}
              placeholder="Tuliskan uraian lengkap isi berkas arsip"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="tingkat-perkembangan">Tingkat Perkembangan</label>
            <select
              id="tingkat-perkembangan"
              className="select"
              value={values.tingkat_perkembangan}
              onChange={(event) =>
                ubah("tingkat_perkembangan", event.target.value as BerkasInput["tingkat_perkembangan"])
              }
            >
              {TINGKAT_PERKEMBANGAN.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="jumlah-halaman">Jumlah Halaman Surat</label>
            <input
              id="jumlah-halaman"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="input"
              value={values.jumlah_halaman}
              onChange={(event) => ubah("jumlah_halaman", Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="sifat-arsip">Sifat Arsip</label>
            <select
              id="sifat-arsip"
              className="select"
              value={values.sifat_arsip}
              onChange={(event) => ubah("sifat_arsip", event.target.value as BerkasInput["sifat_arsip"])}
            >
              {SIFAT_ARSIP.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="doc-form-title">Lokasi Penyimpanan</div>
          <div className="field">
            <label htmlFor="jumlah-folder">Jumlah Folder</label>
            <input
              id="jumlah-folder"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="input"
              value={values.jumlah_folder}
              onChange={(event) => ubah("jumlah_folder", Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="no-filling-cabinet">No. Filling Cabinet</label>
            <input
              id="no-filling-cabinet"
              className="input mono"
              value={values.no_filling_cabinet}
              onChange={(event) => ubah("no_filling_cabinet", event.target.value)}
              placeholder="Contoh: FC-01"
            />
          </div>
          <div className="field">
            <label htmlFor="no-laci">No. Laci</label>
            <input
              id="no-laci"
              className="input mono"
              value={values.no_laci}
              onChange={(event) => ubah("no_laci", event.target.value)}
              placeholder="Contoh: L-01"
            />
          </div>
          <div className="field">
            <label htmlFor="no-folder">No. Folder</label>
            <input
              id="no-folder"
              className="input mono"
              value={values.no_folder}
              onChange={(event) => ubah("no_folder", event.target.value)}
              placeholder="Contoh: F-01"
            />
          </div>

          <div className="doc-form-title">Keterangan Tambahan</div>
          <div className="field field-full">
            <label htmlFor="keterangan-berkas">Keterangan</label>
            <textarea
              id="keterangan-berkas"
              className="input"
              value={values.keterangan}
              onChange={(event) => ubah("keterangan", event.target.value)}
              placeholder="Catatan tambahan mengenai berkas arsip"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
