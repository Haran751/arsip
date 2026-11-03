"use client";

import Drawer from "@/components/drawer";
import Icon from "@/components/icon";
import {
  formatTanggalPanjang,
  kelasSifat,
  type BerkasArsip,
} from "@/lib/daftar-isi";

type BerkasDetailDrawerProps = {
  berkas: BerkasArsip | null;
  onClose: () => void;
  onEdit: (berkas: BerkasArsip) => void;
  onDelete: (berkas: BerkasArsip) => void;
};

export default function BerkasDetailDrawer({ berkas, onClose, onEdit, onDelete }: BerkasDetailDrawerProps) {
  return (
    <Drawer
      open={Boolean(berkas)}
      onClose={onClose}
      title="Detail Arsip"
      subtitle={berkas?.nomor_berkas}
      footer={
        berkas ? (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Tutup
            </button>
            <button type="button" className="btn btn-danger" onClick={() => onDelete(berkas)}>
              <Icon name="trash" size={15} /> Hapus
            </button>
            <button type="button" className="btn" onClick={() => onEdit(berkas)}>
              <Icon name="edit" size={15} /> Edit
            </button>
          </>
        ) : null
      }
    >
      {berkas ? (
        <>
          <div className="preview">
            <span className="preview-icon">
              <Icon name="file" size={26} />
            </span>
            <strong>{berkas.indeks_berkas || "Tanpa indeks berkas"}</strong>
            <small className="mono">{berkas.kode_klasifikasi}</small>
            <span className={`badge ${kelasSifat(berkas.sifat_arsip)}`}>
              <span className="badge-dot" />
              {berkas.sifat_arsip}
            </span>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Identitas Berkas</div>
            <div className="meta-grid">
              <div className="meta-item">
                <span>Nomor Berkas</span>
                <strong className="mono">{berkas.nomor_berkas}</strong>
              </div>
              <div className="meta-item">
                <span>Kode Klasifikasi</span>
                <strong className="mono">{berkas.kode_klasifikasi}</strong>
              </div>
              <div className="meta-item meta-wide">
                <span>Indeks Berkas</span>
                <strong>{berkas.indeks_berkas || "-"}</strong>
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Informasi Arsip</div>
            <div className="meta-grid">
              <div className="meta-item">
                <span>No. Item Arsip</span>
                <strong className="mono">{berkas.no_item_arsip || "-"}</strong>
              </div>
              <div className="meta-item">
                <span>Tanggal</span>
                <strong>{formatTanggalPanjang(berkas.tanggal)}</strong>
              </div>
              <div className="meta-item">
                <span>Tingkat Perkembangan</span>
                <strong>{berkas.tingkat_perkembangan}</strong>
              </div>
              <div className="meta-item">
                <span>Jumlah Halaman Surat</span>
                <strong>{berkas.jumlah_halaman} halaman</strong>
              </div>
              <div className="meta-item">
                <span>Sifat Arsip</span>
                <strong>
                  <span className={`badge ${kelasSifat(berkas.sifat_arsip)}`}>
                    <span className="badge-dot" />
                    {berkas.sifat_arsip}
                  </span>
                </strong>
              </div>
              <div className="meta-item meta-wide">
                <span>Uraian Informasi Arsip</span>
                <strong style={{ fontWeight: 500, lineHeight: 1.6 }}>{berkas.uraian_informasi}</strong>
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Lokasi Penyimpanan</div>
            <div className="meta-grid">
              <div className="meta-item">
                <span>Jumlah Folder</span>
                <strong>{berkas.jumlah_folder} folder</strong>
              </div>
              <div className="meta-item">
                <span>No. Filling Cabinet</span>
                <strong className="mono">{berkas.no_filling_cabinet || "-"}</strong>
              </div>
              <div className="meta-item">
                <span>No. Laci</span>
                <strong className="mono">{berkas.no_laci || "-"}</strong>
              </div>
              <div className="meta-item">
                <span>No. Folder</span>
                <strong className="mono">{berkas.no_folder || "-"}</strong>
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Keterangan Tambahan</div>
            <p className="sub" style={{ marginTop: 0, fontSize: 12.5 }}>
              {berkas.keterangan || "Tidak ada keterangan tambahan."}
            </p>
          </div>
        </>
      ) : null}
    </Drawer>
  );
}
