"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  arsipList,
  demoUsers,
  kodeArsipList,
  logList,
  usulanList,
  type Arsip,
  type DemoUser,
  type KodeArsip,
  type LogEntry,
  type Role,
  type StatusRetensi,
  type Usulan,
} from "./demo-data";
import { hitungRetensi } from "./retensi";

const STORAGE_KEY = "earsip-demo-v1";

export type DemoStore = {
  arsip: Arsip[];
  kodeArsip: KodeArsip[];
  users: DemoUser[];
  usulan: Usulan[];
  logs: LogEntry[];
};

export type ArsipInput = {
  nomor_arsip: string;
  judul: string;
  kode: string;
  tanggal_arsip: string;
  keterangan?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
};

export type KodeInput = {
  kode: string;
  nama: string;
  retensi_aktif_thn: number;
  retensi_inaktif_thn: number;
  nasib_akhir: KodeArsip["nasib_akhir"];
};

export type KodeImportRow = KodeInput & {
  baris: number;
  status: "Baru" | "Diperbarui" | "Error";
  pesan?: string;
};

export type UserInput = {
  nama: string;
  username: string;
  email: string;
  role: Role;
  aktif: boolean;
};

export type ActionResult = {
  ok: boolean;
  message?: string;
};

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type DemoContextValue = {
  ready: boolean;
  data: DemoStore;
  currentUser: DemoUser;
  isAdmin: boolean;
  canManage: boolean;
  stats: {
    total: number;
    aktif: number;
    inaktif: number;
    permanen: number;
    due: number;
    usulanDiajukan: number;
    usulanDisetujui: number;
    totalItemUsulan: number;
    totalKode: number;
    totalPengguna: number;
    penggunaAktif: number;
  };
  dueArsip: Arsip[];
  countArsip: (kode: string) => number;
  nextNomorArsip: (tanggal: string) => string;
  saveArsip: (input: ArsipInput, id?: string) => ActionResult;
  deleteArsip: (id: string) => ActionResult;
  saveKode: (input: KodeInput, id?: string) => ActionResult;
  deleteKode: (id: string) => ActionResult;
  importKode: (rows: KodeInput[]) => ActionResult & { created?: number; updated?: number };
  addUsulan: (itemIds: string[], catatan?: string) => ActionResult;
  decideUsulan: (id: string, status: "Disetujui" | "Ditolak") => ActionResult;
  saveUser: (input: UserInput, id?: string) => ActionResult;
  resetUserPassword: (id: string) => ActionResult;
  updateProfile: (patch: Pick<UserInput, "nama" | "email">) => ActionResult;
  changePassword: (lama: string, baru: string) => ActionResult;
  catatLog: (aksi: string, target: string, jenis: LogEntry["jenis"], sumber?: LogEntry["sumber"]) => void;
  resetDemo: () => void;
  toast: (message: string, tone?: ToastTone) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function seedStore(): DemoStore {
  return {
    arsip: clone(arsipList),
    kodeArsip: clone(kodeArsipList),
    users: clone(demoUsers),
    usulan: clone(usulanList),
    logs: clone(logList),
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function isoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nowIso() {
  return new Date().toISOString();
}

function makeLog(user: string, aksi: string, target: string, jenis: LogEntry["jenis"], sumber: LogEntry["sumber"] = "Aplikasi"): LogEntry {
  return {
    id: uid("log"),
    waktu: nowIso(),
    user,
    aksi,
    target,
    sumber,
    jenis,
  };
}

function appendLog(store: DemoStore, log: LogEntry): DemoStore {
  return { ...store, logs: [log, ...store.logs] };
}

function hitungStatusArsip(tanggal: string, kode: KodeArsip) {
  const mulai = new Date(`${tanggal}T00:00:00`);
  const { akhirAktif, akhirRetensi } = hitungRetensi(mulai, kode.retensi_aktif_thn, kode.retensi_inaktif_thn);
  const now = new Date();
  let status: StatusRetensi = "Aktif";

  if (kode.nasib_akhir === "Permanen") {
    status = "Permanen";
  } else if (now >= akhirAktif) {
    status = "Inaktif";
  }

  return { status, akhirRetensi: isoDate(akhirRetensi) };
}

function normalisasiKode(value: string) {
  return value.trim().toUpperCase();
}

export function DemoProvider({ initialUser, children }: { initialUser: DemoUser; children: ReactNode }) {
  const [data, setData] = useState<DemoStore>(seedStore);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<DemoStore>;
          if (parsed && Array.isArray(parsed.arsip) && Array.isArray(parsed.kodeArsip)) {
            setData({ ...seedStore(), ...parsed });
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = uid("toast");
    setToasts((current) => [...current, { id, message, tone }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
    timers.current.push(timer);
  }, []);

  const currentUser = useMemo(() => {
    return data.users.find((user) => user.id === initialUser.id) ?? data.users[0] ?? initialUser;
  }, [data.users, initialUser]);

  const isAdmin = currentUser.role === "Admin";
  const canManage = currentUser.role === "Admin" || currentUser.role === "Operator";

  const countArsip = useCallback(
    (kode: string) => data.arsip.filter((arsip) => arsip.kode === kode).length,
    [data.arsip],
  );

  const dueArsip = useMemo(() => {
    return data.arsip
      .filter((arsip) => arsip.status_retensi === "Inaktif")
      .sort((a, b) => a.akhir_retensi.localeCompare(b.akhir_retensi));
  }, [data.arsip]);

  const stats = useMemo(
    () => ({
      total: data.arsip.length,
      aktif: data.arsip.filter((arsip) => arsip.status_retensi === "Aktif").length,
      inaktif: data.arsip.filter((arsip) => arsip.status_retensi === "Inaktif").length,
      permanen: data.arsip.filter((arsip) => arsip.status_retensi === "Permanen").length,
      due: dueArsip.length,
      usulanDiajukan: data.usulan.filter((usulan) => usulan.status === "Diajukan").length,
      usulanDisetujui: data.usulan.filter((usulan) => usulan.status === "Disetujui").length,
      totalItemUsulan: data.usulan.reduce((total, usulan) => total + usulan.jumlah_item, 0),
      totalKode: data.kodeArsip.length,
      totalPengguna: data.users.length,
      penggunaAktif: data.users.filter((user) => user.aktif).length,
    }),
    [data, dueArsip.length],
  );

  const nextNomorArsip = useCallback(
    (tanggal: string) => {
      const tahun = tanggal.slice(0, 4) || String(new Date().getFullYear());
      const prefix = `ARS-${tahun}-`;
      const urutan = data.arsip
        .filter((arsip) => arsip.nomor_arsip.startsWith(prefix))
        .map((arsip) => Number(arsip.nomor_arsip.slice(prefix.length)))
        .filter((value) => Number.isFinite(value));
      const berikutnya = (urutan.length ? Math.max(...urutan) : 0) + 1;
      return `${prefix}${String(berikutnya).padStart(3, "0")}`;
    },
    [data.arsip],
  );

  const saveArsip = useCallback(
    (input: ArsipInput, id?: string): ActionResult => {
      const nomor = input.nomor_arsip.trim().toUpperCase();
      const judul = input.judul.trim();
      const kode = normalisasiKode(input.kode);

      if (!nomor || !judul || !input.tanggal_arsip || !kode) {
        return { ok: false, message: "Nomor, judul, tanggal, dan kode arsip wajib diisi." };
      }
      if (data.arsip.some((arsip) => arsip.nomor_arsip.toUpperCase() === nomor && arsip.id !== id)) {
        return { ok: false, message: "Nomor arsip sudah digunakan." };
      }

      const kodeData = data.kodeArsip.find((item) => item.kode === kode);
      if (!kodeData) {
        return { ok: false, message: "Kode arsip tidak ditemukan." };
      }

      const hitung = hitungStatusArsip(input.tanggal_arsip, kodeData);
      const existing = id ? data.arsip.find((arsip) => arsip.id === id) : undefined;
      if (id && !existing) {
        return { ok: false, message: "Arsip tidak ditemukan." };
      }

      const arsip: Arsip = {
        id: existing?.id ?? uid("ars"),
        nomor_arsip: nomor,
        judul,
        kode,
        tanggal_arsip: input.tanggal_arsip,
        status_retensi: hitung.status,
        akhir_retensi: hitung.akhirRetensi,
        pembuat: existing?.pembuat ?? currentUser.nama,
        keterangan: input.keterangan?.trim() || undefined,
        file_name: input.file_name || existing?.file_name,
        file_size: input.file_size ?? existing?.file_size,
        file_type: input.file_type ?? existing?.file_type,
      };

      const nextArsip = existing
        ? data.arsip.map((item) => (item.id === existing.id ? arsip : item))
        : [arsip, ...data.arsip];

      const log = makeLog(
        currentUser.nama,
        existing ? "Memperbarui arsip" : "Menambahkan arsip",
        `${arsip.nomor_arsip} - ${arsip.judul}`,
        existing ? "ubah" : "buat",
      );

      setData(appendLog({ ...data, arsip: nextArsip }, log));
      return { ok: true, message: existing ? "Arsip berhasil diperbarui." : "Arsip berhasil ditambahkan." };
    },
    [currentUser.nama, data],
  );

  const deleteArsip = useCallback(
    (id: string): ActionResult => {
      const arsip = data.arsip.find((item) => item.id === id);
      if (!arsip) return { ok: false, message: "Arsip tidak ditemukan." };

      const nextUsulan = data.usulan.map((usulan) => {
        if (!usulan.item_ids?.includes(id)) return usulan;
        const itemIds = usulan.item_ids.filter((itemId) => itemId !== id);
        return { ...usulan, item_ids: itemIds, jumlah_item: itemIds.length };
      });

      const log = makeLog(currentUser.nama, "Menghapus arsip", `${arsip.nomor_arsip} - ${arsip.judul}`, "hapus");
      setData(
        appendLog(
          {
            ...data,
            arsip: data.arsip.filter((item) => item.id !== id),
            usulan: nextUsulan,
          },
          log,
        ),
      );
      return { ok: true, message: "Arsip berhasil dihapus." };
    },
    [currentUser.nama, data],
  );

  const saveKode = useCallback(
    (input: KodeInput, id?: string): ActionResult => {
      const kode = normalisasiKode(input.kode);
      const nama = input.nama.trim();
      if (!kode || !nama) return { ok: false, message: "Kode dan nama wajib diisi." };
      if (data.kodeArsip.some((item) => item.kode === kode && item.id !== id)) {
        return { ok: false, message: "Kode arsip sudah digunakan." };
      }

      const existing = id ? data.kodeArsip.find((item) => item.id === id) : undefined;
      if (id && !existing) return { ok: false, message: "Kode arsip tidak ditemukan." };

      const kodeBaru: KodeArsip = {
        id: existing?.id ?? uid("kode"),
        kode,
        nama,
        retensi_aktif_thn: Math.max(0, Number(input.retensi_aktif_thn) || 0),
        retensi_inaktif_thn: Math.max(0, Number(input.retensi_inaktif_thn) || 0),
        nasib_akhir: input.nasib_akhir,
        jumlah: existing?.jumlah ?? 0,
      };

      const nextKode = existing
        ? data.kodeArsip.map((item) => (item.id === existing.id ? kodeBaru : item))
        : [kodeBaru, ...data.kodeArsip];
      const kodeLama = existing?.kode;
      const nextArsip = data.arsip.map((arsip) => {
        const cocok = arsip.kode === kodeLama || arsip.kode === kode;
        if (!cocok) return arsip;
        const hitung = hitungStatusArsip(arsip.tanggal_arsip, kodeBaru);
        return { ...arsip, kode, status_retensi: hitung.status, akhir_retensi: hitung.akhirRetensi };
      });

      const log = makeLog(
        currentUser.nama,
        existing ? "Memperbarui kode arsip" : "Menambahkan kode arsip",
        `${kode} - ${nama}`,
        existing ? "ubah" : "buat",
      );

      setData(appendLog({ ...data, kodeArsip: nextKode, arsip: nextArsip }, log));
      return { ok: true, message: existing ? "Kode arsip berhasil diperbarui." : "Kode arsip berhasil ditambahkan." };
    },
    [currentUser.nama, data],
  );

  const deleteKode = useCallback(
    (id: string): ActionResult => {
      const kode = data.kodeArsip.find((item) => item.id === id);
      if (!kode) return { ok: false, message: "Kode arsip tidak ditemukan." };
      const jumlah = data.arsip.filter((arsip) => arsip.kode === kode.kode).length;
      if (jumlah > 0) {
        return { ok: false, message: `Kode masih dipakai oleh ${jumlah} arsip. Pindahkan arsip terlebih dahulu.` };
      }

      const log = makeLog(currentUser.nama, "Menghapus kode arsip", `${kode.kode} - ${kode.nama}`, "hapus");
      setData(appendLog({ ...data, kodeArsip: data.kodeArsip.filter((item) => item.id !== id) }, log));
      return { ok: true, message: "Kode arsip berhasil dihapus." };
    },
    [currentUser.nama, data],
  );

  const importKode = useCallback(
    (rows: KodeInput[]): ActionResult & { created?: number; updated?: number } => {
      let created = 0;
      let updated = 0;
      const next = [...data.kodeArsip];

      for (const row of rows) {
        const kode = normalisasiKode(row.kode);
        const nama = row.nama.trim();
        if (!kode || !nama) continue;
        const index = next.findIndex((item) => item.kode === kode);
        if (index >= 0) {
          next[index] = {
            ...next[index],
            nama,
            retensi_aktif_thn: Math.max(0, Number(row.retensi_aktif_thn) || 0),
            retensi_inaktif_thn: Math.max(0, Number(row.retensi_inaktif_thn) || 0),
            nasib_akhir: row.nasib_akhir,
          };
          updated += 1;
        } else {
          next.unshift({
            id: uid("kode"),
            kode,
            nama,
            retensi_aktif_thn: Math.max(0, Number(row.retensi_aktif_thn) || 0),
            retensi_inaktif_thn: Math.max(0, Number(row.retensi_inaktif_thn) || 0),
            nasib_akhir: row.nasib_akhir,
            jumlah: 0,
          });
          created += 1;
        }
      }

      if (!created && !updated) {
        return { ok: false, message: "Tidak ada baris valid untuk diimpor." };
      }

      const nextArsip = data.arsip.map((arsip) => {
        const kodeData = next.find((item) => item.kode === arsip.kode);
        if (!kodeData) return arsip;
        const hitung = hitungStatusArsip(arsip.tanggal_arsip, kodeData);
        return { ...arsip, status_retensi: hitung.status, akhir_retensi: hitung.akhirRetensi };
      });

      const log = makeLog(
        currentUser.nama,
        "Mengimpor master kode arsip",
        `${created} baru, ${updated} diperbarui`,
        "buat",
      );

      setData(appendLog({ ...data, kodeArsip: next, arsip: nextArsip }, log));
      return { ok: true, created, updated, message: `Impor selesai: ${created} baru, ${updated} diperbarui.` };
    },
    [currentUser.nama, data],
  );

  const addUsulan = useCallback(
    (itemIds: string[], catatan?: string): ActionResult => {
      const ids = Array.from(new Set(itemIds.filter((id) => data.arsip.some((arsip) => arsip.id === id))));
      if (!ids.length) return { ok: false, message: "Pilih minimal satu arsip yang akan diusulkan." };

      const pending = new Set(
        data.usulan
          .filter((usulan) => usulan.status === "Diajukan")
          .flatMap((usulan) => usulan.item_ids ?? []),
      );
      if (ids.some((id) => pending.has(id))) {
        return { ok: false, message: "Sebagian arsip sudah ada pada usulan yang masih diajukan." };
      }

      const tahun = new Date().getFullYear();
      const prefix = `USUL-${tahun}-`;
      const urutan = data.usulan
        .filter((usulan) => usulan.nomor.startsWith(prefix))
        .map((usulan) => Number(usulan.nomor.slice(prefix.length)))
        .filter((value) => Number.isFinite(value));
      const nomor = `${prefix}${String((urutan.length ? Math.max(...urutan) : 0) + 1).padStart(3, "0")}`;

      const usulan: Usulan = {
        id: uid("usul"),
        nomor,
        diajukan_oleh: currentUser.nama,
        tanggal: isoDate(new Date()),
        status: "Diajukan",
        jumlah_item: ids.length,
        item_ids: ids,
        catatan: catatan?.trim() || undefined,
      };

      const log = makeLog(currentUser.nama, "Mengajukan usulan pemusnahan", `${nomor} - ${ids.length} arsip`, "buat");
      setData(appendLog({ ...data, usulan: [usulan, ...data.usulan] }, log));
      return { ok: true, message: `Usulan ${nomor} berhasil dibuat.` };
    },
    [currentUser.nama, data],
  );

  const decideUsulan = useCallback(
    (id: string, status: "Disetujui" | "Ditolak"): ActionResult => {
      if (!isAdmin) return { ok: false, message: "Hanya Admin yang dapat memutuskan usulan." };
      const usulan = data.usulan.find((item) => item.id === id);
      if (!usulan) return { ok: false, message: "Usulan tidak ditemukan." };
      if (usulan.status !== "Diajukan") return { ok: false, message: "Usulan sudah diputuskan." };

      const nextUsulan = data.usulan.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              disetujui_oleh: status === "Disetujui" ? currentUser.nama : undefined,
              diputuskan_pada: isoDate(new Date()),
            }
          : item,
      );
      const log = makeLog(
        currentUser.nama,
        status === "Disetujui" ? "Menyetujui usulan pemusnahan" : "Menolak usulan pemusnahan",
        usulan.nomor,
        status === "Disetujui" ? "setuju" : "hapus",
      );
      setData(appendLog({ ...data, usulan: nextUsulan }, log));
      return { ok: true, message: status === "Disetujui" ? "Usulan disetujui." : "Usulan ditolak." };
    },
    [currentUser.nama, data, isAdmin],
  );

  const saveUser = useCallback(
    (input: UserInput, id?: string): ActionResult => {
      const nama = input.nama.trim();
      const username = input.username.trim().toLowerCase();
      const email = input.email.trim();
      if (!nama || !username || !email) return { ok: false, message: "Nama, username, dan email wajib diisi." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Format email tidak valid." };
      if (data.users.some((user) => user.username === username && user.id !== id)) {
        return { ok: false, message: "Username sudah digunakan." };
      }

      const existing = id ? data.users.find((user) => user.id === id) : undefined;
      if (id && !existing) return { ok: false, message: "Pengguna tidak ditemukan." };
      if (
        existing?.role === "Admin" &&
        existing.aktif &&
        (input.role !== "Admin" || !input.aktif) &&
        data.users.filter((user) => user.role === "Admin" && user.aktif).length <= 1
      ) {
        return { ok: false, message: "Minimal harus ada satu Admin aktif." };
      }

      const user: DemoUser = {
        id: existing?.id ?? uid("usr"),
        nama,
        username,
        email,
        role: input.role,
        aktif: input.aktif,
        last_login: existing?.last_login ?? nowIso(),
      };
      const nextUsers = existing
        ? data.users.map((item) => (item.id === existing.id ? user : item))
        : [user, ...data.users];
      const log = makeLog(
        currentUser.nama,
        existing ? "Memperbarui pengguna" : "Menambahkan pengguna",
        `${user.nama} (${user.username})`,
        existing ? "ubah" : "buat",
      );
      setData(appendLog({ ...data, users: nextUsers }, log));
      return { ok: true, message: existing ? "Pengguna berhasil diperbarui." : "Pengguna berhasil ditambahkan." };
    },
    [currentUser.nama, data],
  );

  const resetUserPassword = useCallback(
    (id: string): ActionResult => {
      if (!isAdmin) return { ok: false, message: "Hanya Admin yang dapat mereset password." };
      const user = data.users.find((item) => item.id === id);
      if (!user) return { ok: false, message: "Pengguna tidak ditemukan." };
      const log = makeLog(currentUser.nama, "Mereset password pengguna", `${user.nama} (${user.username})`, "ubah");
      setData(appendLog(data, log));
      return { ok: true, message: `Password ${user.nama} direset ke: EArsip#2026` };
    },
    [currentUser.nama, data, isAdmin],
  );

  const updateProfile = useCallback(
    (patch: Pick<UserInput, "nama" | "email">): ActionResult => {
      const nama = patch.nama.trim();
      const email = patch.email.trim();
      if (!nama || !email) return { ok: false, message: "Nama dan email wajib diisi." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Format email tidak valid." };

      const nextUsers = data.users.map((user) =>
        user.id === currentUser.id ? { ...user, nama, email } : user,
      );
      const log = makeLog(currentUser.nama, "Memperbarui profil", `${nama} - ${email}`, "ubah");
      setData(appendLog({ ...data, users: nextUsers }, log));
      return { ok: true, message: "Profil berhasil diperbarui." };
    },
    [currentUser, data],
  );

  const changePassword = useCallback(
    (lama: string, baru: string): ActionResult => {
      if (!lama) return { ok: false, message: "Password lama wajib diisi." };
      if (baru.length < 6) return { ok: false, message: "Password baru minimal 6 karakter." };

      const log = makeLog(currentUser.nama, "Mengganti password", currentUser.username, "ubah");
      setData(appendLog(data, log));
      return { ok: true, message: "Password berhasil diganti (mode demo)." };
    },
    [currentUser, data],
  );

  const catatLog = useCallback(
    (aksi: string, target: string, jenis: LogEntry["jenis"], sumber: LogEntry["sumber"] = "Aplikasi") => {
      setData(appendLog(data, makeLog(currentUser.nama, aksi, target, jenis, sumber)));
    },
    [currentUser.nama, data],
  );

  const resetDemo = useCallback(() => {
    setData(seedStore());
    toast("Data demo dikembalikan ke kondisi awal.", "info");
  }, [toast]);

  const value: DemoContextValue = {
    ready,
    data,
    currentUser,
    isAdmin,
    canManage,
    stats,
    dueArsip,
    countArsip,
    nextNomorArsip,
    saveArsip,
    deleteArsip,
    saveKode,
    deleteKode,
    importKode,
    addUsulan,
    decideUsulan,
    saveUser,
    resetUserPassword,
    updateProfile,
    changePassword,
    catatLog,
    resetDemo,
    toast,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone}`}>
            <span className="toast-mark" />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo harus digunakan di dalam DemoProvider");
  return context;
}
