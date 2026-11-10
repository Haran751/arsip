import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

export type ErrorContext = {
  aksi?: string;
  userId?: string;
  route?: string;
};

export type HasilError = {
  status: number;
  message: string;
  errorId: string;
  fieldErrors?: FieldErrors;
};

export const PESAN_GENERIK = "Terjadi kesalahan. Silakan coba lagi atau hubungi admin.";

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly userMessage: string;
  readonly fieldErrors?: FieldErrors;
  readonly errorId: string;

  constructor(
    userMessage: string,
    options: { code?: string; status?: number; cause?: unknown; fieldErrors?: FieldErrors } = {},
  ) {
    super(userMessage, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.userMessage = userMessage;
    this.code = options.code ?? "APP_ERROR";
    this.status = options.status ?? 500;
    this.fieldErrors = options.fieldErrors;
    this.errorId = buatErrorId();
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sesi berakhir. Silakan login kembali.", cause?: unknown) {
    super(message, { code: "UNAUTHORIZED", status: 401, cause });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Anda tidak memiliki akses untuk melakukan aksi ini.", cause?: unknown) {
    super(message, { code: "FORBIDDEN", status: 403, cause });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan.", cause?: unknown) {
    super(message, { code: "NOT_FOUND", status: 404, cause });
  }
}

export class ValidationError extends AppError {
  constructor(message = "Data yang dikirim tidak valid.", fieldErrors?: FieldErrors, cause?: unknown) {
    super(message, { code: "VALIDATION", status: 400, fieldErrors, cause });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Data sudah digunakan. Gunakan nilai lain.", cause?: unknown) {
    super(message, { code: "CONFLICT", status: 409, cause });
  }
}

export function buatErrorId() {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

// Kode error Prisma yang dikenali -> pesan ramah. Pesan asli tidak pernah diteruskan.
const PESAN_PRISMA: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "Data dengan nilai tersebut sudah ada. Gunakan nilai lain." },
  P2003: { status: 409, message: "Data masih terhubung dengan data lain sehingga tidak dapat diproses." },
  P2025: { status: 404, message: "Data yang dimaksud tidak ditemukan atau sudah berubah." },
  P1001: { status: 503, message: "Koneksi ke basis data sedang terganggu. Coba beberapa saat lagi." },
  P1002: { status: 503, message: "Koneksi ke basis data sedang terganggu. Coba beberapa saat lagi." },
  P1003: { status: 503, message: "Basis data belum siap. Coba beberapa saat lagi." },
  P1008: { status: 503, message: "Basis data sedang sibuk. Coba beberapa saat lagi." },
  P1010: { status: 503, message: "Akses basis data ditolak. Hubungi admin." },
  P1011: { status: 503, message: "Basis data sedang dibuka di tempat lain. Coba beberapa saat lagi." },
};

function kodePrisma(error: unknown): string | null {
  const kandidat = error as { name?: unknown; code?: unknown; errorCode?: unknown };
  // Gagal inisialisasi (DB tidak bisa dihubungi / env kosong) tanpa errorCode.
  if (kandidat?.name === "PrismaClientInitializationError") return "P1001";
  if (typeof kandidat?.code === "string" && /^P\d{4}$/.test(kandidat.code)) return kandidat.code;
  if (typeof kandidat?.errorCode === "string" && /^P\d{4}$/.test(kandidat.errorCode)) return kandidat.errorCode;
  return null;
}

function teksFieldIssue(issue: ZodError["issues"][number]): string {
  const label = issue.path.join(".") || "data";
  switch (issue.code) {
    case "invalid_type":
      return `Nilai "${label}" tidak sesuai format.`;
    case "too_small":
      return `Nilai "${label}" di bawah batas minimum.`;
    case "too_big":
      return `Nilai "${label}" melebihi batas maksimum.`;
    default:
      return `Nilai "${label}" tidak valid.`;
  }
}

/**
 * Mengubah error apa pun menjadi hasil aman untuk dikirim ke user.
 * Detail lengkap (stack, pesan asli) hanya dicatat di log server dengan errorId yang sama.
 */
export function handleError(error: unknown, konteks: ErrorContext = {}): HasilError {
  const errorId = error instanceof AppError ? error.errorId : buatErrorId();

  let hasil: HasilError;

  if (error instanceof AppError) {
    hasil = {
      status: error.status,
      message: error.userMessage,
      errorId,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    };
  } else if (error instanceof ZodError) {
    const fieldErrors: FieldErrors = {};
    for (const issue of error.issues) {
      const kunci = issue.path.join(".") || "form";
      if (!fieldErrors[kunci]) fieldErrors[kunci] = teksFieldIssue(issue);
    }
    hasil = {
      status: 400,
      message: "Data yang dikirim tidak valid. Periksa kembali isian Anda.",
      errorId,
      fieldErrors,
    };
  } else {
    const kode = kodePrisma(error);
    if (kode && PESAN_PRISMA[kode]) {
      hasil = { status: PESAN_PRISMA[kode].status, message: PESAN_PRISMA[kode].message, errorId };
    } else {
      hasil = { status: 500, message: PESAN_GENERIK, errorId };
    }
  }

  catatServer(error, hasil, konteks);
  return hasil;
}

function catatServer(error: unknown, hasil: HasilError, konteks: ErrorContext) {
  const asli = error instanceof Error ? error : null;
  const lokasi = [konteks.route, konteks.aksi].filter(Boolean).join(" / ") || "tidak diketahui";
  console.error(
    `[ERROR ${hasil.errorId}] status=${hasil.status} lokasi=${lokasi}${konteks.userId ? ` userId=${konteks.userId}` : ""} pesan=${asli?.message ?? String(error)} cause=${asli instanceof AppError && asli.cause instanceof Error ? asli.cause.message : "-"}`,
  );
  if (asli?.stack) console.error(asli.stack);
}

/**
 * Hasil gagal standar untuk Server Action: pesan aman + errorId opsional.
 */
export function gagalAksi(
  error: unknown,
  konteks: ErrorContext = {},
): { ok: false; message: string; errorId: string; fieldErrors?: FieldErrors } {
  const hasil = handleError(error, konteks);
  return {
    ok: false,
    message: hasil.message,
    errorId: hasil.errorId,
    ...(hasil.fieldErrors ? { fieldErrors: hasil.fieldErrors } : {}),
  };
}

/**
 * Wrapper Route Handler: semua error tak tertangani dikembalikan sebagai
 * response JSON seragam tanpa detail teknis.
 */
export function withApiErrorHandling(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      const hasil = handleError(error, { route: req.nextUrl.pathname });
      return NextResponse.json(
        {
          success: false,
          message: hasil.message,
          errorId: hasil.errorId,
          ...(hasil.fieldErrors ? { fieldErrors: hasil.fieldErrors } : {}),
        },
        { status: hasil.status },
      );
    }
  };
}
