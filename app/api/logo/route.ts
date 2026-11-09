import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSignedDownloadUrl } from "@/lib/storage";
import { keInstansi } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.aktif === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pengaturan = await prisma.pengaturan.findUnique({ where: { kunci: "instansi" } });
  const logo = keInstansi(pengaturan?.nilai).logo_path;
  if (!logo) return NextResponse.json({ error: "Logo belum diatur." }, { status: 404 });

  try {
    const url = await createSignedDownloadUrl(logo, 60);
    return NextResponse.redirect(url, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat logo." }, { status: 500 });
  }
}
