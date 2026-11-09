"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData } from "./data";
import type {
  ActionResult,
  AppUser,
  Arsip,
  ArsipInput,
  FolderInput,
  Instansi,
  KodeInput,
  LogEntry,
  UserInput,
} from "./types";
import {
  catatLogAksi,
  hapusArsipAksi,
  hapusFolderAksi,
  hapusKodeAksi,
  imporKodeAksi,
  muatDataAksi,
  putuskanUsulanAksi,
  simpanArsipAksi,
  simpanFolderAksi,
  simpanKodeAksi,
  tambahUsulanAksi,
} from "./actions/data";
import {
  gantiPasswordSendiri,
  resetPasswordPengguna,
  simpanPengguna,
  simpanProfil,
} from "./actions/user";
import { simpanInstansiAksi } from "./actions/instansi";

export type KodeImportRow = KodeInput & {
  baris: number;
  status: "Baru" | "Diperbarui" | "Error";
  pesan?: string;
};

export type UserActionResult = ActionResult & {
  user?: AppUser;
};

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type DataContextValue = {
  ready: boolean;
  data: AppData;
  currentUser: AppUser;
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
  saveArsip: (input: ArsipInput, id?: string) => Promise<ActionResult>;
  deleteArsip: (id: string) => Promise<ActionResult>;
  saveFolder: (input: FolderInput, id?: string) => Promise<ActionResult>;
  deleteFolder: (id: string) => Promise<ActionResult>;
  saveKode: (input: KodeInput, id?: string) => Promise<ActionResult>;
  deleteKode: (id: string) => Promise<ActionResult>;
  importKode: (rows: KodeInput[]) => Promise<ActionResult & { created?: number; updated?: number }>;
  addUsulan: (itemIds: string[], catatan?: string) => Promise<ActionResult>;
  decideUsulan: (id: string, status: "Disetujui" | "Ditolak") => Promise<ActionResult>;
  saveUser: (input: UserInput, id?: string) => Promise<UserActionResult>;
  saveInstansi: (input: Instansi) => Promise<ActionResult>;
  resetUserPassword: (id: string) => Promise<UserActionResult>;
  updateProfile: (patch: Pick<UserInput, "nama" | "email">) => Promise<UserActionResult>;
  changePassword: (lama: string, baru: string) => Promise<ActionResult>;
  catatLog: (aksi: string, target: string, jenis: LogEntry["jenis"], sumber?: LogEntry["sumber"]) => Promise<void>;
  refreshData: () => Promise<AppData | null>;
  toast: (message: string, tone?: ToastTone) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function DataProvider({
  initialUser,
  initialData,
  children,
}: {
  initialUser: AppUser;
  initialData: AppData;
  children: ReactNode;
}) {
  const [data, setData] = useState<AppData>(initialData);
  const [currentUser, setCurrentUser] = useState<AppUser>(initialUser);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = uid("toast");
    setToasts((current) => [...current, { id, message, tone }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
    timers.current.push(timer);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const next = await muatDataAksi();
      setData(next);
      const saya = next.users.find((user) => user.id === initialUser.id);
      if (saya) setCurrentUser(saya);
      return next;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat data dari server.", "error");
      return null;
    }
  }, [initialUser.id, toast]);

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
    async (input: ArsipInput, id?: string) => {
      const hasil = await simpanArsipAksi(input, id);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const deleteArsip = useCallback(
    async (id: string) => {
      const hasil = await hapusArsipAksi(id);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const saveFolder = useCallback(
    async (input: FolderInput, id?: string) => {
      const hasil = await simpanFolderAksi(input, id);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      const hasil = await hapusFolderAksi(id);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const saveKode = useCallback(
    async (input: KodeInput, id?: string) => {
      const hasil = await simpanKodeAksi(input, id);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const deleteKode = useCallback(
    async (id: string) => {
      const hasil = await hapusKodeAksi(id);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const importKode = useCallback(
    async (rows: KodeInput[]) => {
      const hasil = await imporKodeAksi(rows);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const addUsulan = useCallback(
    async (itemIds: string[], catatan?: string) => {
      const hasil = await tambahUsulanAksi(itemIds, catatan);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const decideUsulan = useCallback(
    async (id: string, status: "Disetujui" | "Ditolak") => {
      const hasil = await putuskanUsulanAksi(id, status);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const saveUser = useCallback(
    async (input: UserInput, id?: string): Promise<UserActionResult> => {
      const hasil = await simpanPengguna(input, id);
      if (hasil.ok) {
        await catatLogAksi(id ? "Edit Pengguna" : "Tambah Pengguna", `${input.nama} (${input.username})`, id ? "ubah" : "buat");
        await refreshData();
      }
      return hasil as UserActionResult;
    },
    [refreshData],
  );

  const saveInstansi = useCallback(
    async (input: Instansi) => {
      const hasil = await simpanInstansiAksi(input);
      if (hasil.ok) await refreshData();
      return hasil;
    },
    [refreshData],
  );

  const resetUserPassword = useCallback(
    async (id: string): Promise<UserActionResult> => {
      const hasil = await resetPasswordPengguna(id);
      if (hasil.ok) {
        await catatLogAksi("Reset Password", hasil.user?.nama ?? id, "ubah");
        await refreshData();
      }
      return hasil as UserActionResult;
    },
    [refreshData],
  );

  const updateProfile = useCallback(
    async (patch: Pick<UserInput, "nama" | "email">): Promise<UserActionResult> => {
      const hasil = await simpanProfil({ nama: patch.nama, email: patch.email });
      if (hasil.ok) {
        await catatLogAksi("Edit Profil", `${patch.nama} - ${patch.email}`, "ubah");
        await refreshData();
      }
      return hasil as UserActionResult;
    },
    [refreshData],
  );

  const changePassword = useCallback(
    async (lama: string, baru: string): Promise<ActionResult> => {
      const hasil = await gantiPasswordSendiri(lama, baru);
      if (hasil.ok) await catatLogAksi("Ganti Password", currentUser.username, "ubah");
      return hasil;
    },
    [currentUser.username],
  );

  const catatLog = useCallback(
    async (aksi: string, target: string, jenis: LogEntry["jenis"], sumber: LogEntry["sumber"] = "Aplikasi") => {
      await catatLogAksi(aksi, target, jenis, sumber);
      await refreshData();
    },
    [refreshData],
  );

  const value: DataContextValue = {
    ready: true,
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
    saveFolder,
    deleteFolder,
    saveKode,
    deleteKode,
    importKode,
    addUsulan,
    decideUsulan,
    saveUser,
    saveInstansi,
    resetUserPassword,
    updateProfile,
    changePassword,
    catatLog,
    refreshData,
    toast,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone}`}>
            <span className="toast-mark" />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData harus digunakan di dalam DataProvider");
  return context;
}
