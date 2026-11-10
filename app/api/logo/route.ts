import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSignedDownloadUrl } from "@/lib/storage";
import { keInstansi } from "@/lib/data";
import { AppError, NotFoundError, UnauthorizedError, withApiErrorHandling } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.aktif === false) {
    throw new UnauthorizedError("Sesi berakhir. Silakan login kembali.");
  }

  const pengaturan = await prisma.pengaturan.findUnique({ where: { kunci: "instansi" } });
  const logo = keInstansi(pengaturan?.nilai).logo_path;
  if (!logo) throw new NotFoundError("Logo belum diatur.");

  try {
    const url = await createSignedDownloadUrl(logo, 60);
    return NextResponse.redirect(url, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Gagal memuat logo.", { code: "LOGO", status: 503, cause: error });
  }
});
