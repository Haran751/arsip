import { NextRequest, NextResponse } from "next/server";
import { arsipList, statistik } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    mode: "demo",
    diperiksa: arsipList.length,
    diperbarui: 0,
    jatuhTempo: statistik.jatuhTempo,
    pesan: "Mode demo: status retensi dihitung dari data contoh, tidak ada perubahan database.",
    dijalankan_pada: new Date().toISOString(),
  });
}
