import { prisma } from "./prisma";
import { emailUntukUsername } from "./supabase-admin";
import type { AppUser } from "./types";

export async function sinkronPengguna(user: AppUser, mustChangePassword = false) {
  // Layanan autentikasi tetap butuh email internal; dibuat otomatis dari username.
  const email = emailUntukUsername(user.username);
  const data = {
    nama: user.nama,
    username: user.username,
    email,
    role: user.role,
    aktif: user.aktif,
    last_login: new Date(),
    must_change_password: mustChangePassword,
  };

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) {
    await prisma.user.update({ where: { id: user.id }, data });
    return;
  }

  // Baris lama dengan username/email sama bisa berasal dari seed sebelumnya.
  const bentrok = await prisma.user.findFirst({
    where: { OR: [{ username: user.username }, { email }] },
  });

  if (bentrok && bentrok.id !== user.id) {
    const [arsipDibuat, arsipDiubah, log, usulan, riwayat, notifikasi] = await Promise.all([
      prisma.arsip.count({ where: { created_by: bentrok.id } }),
      prisma.arsip.count({ where: { updated_by: bentrok.id } }),
      prisma.logAktivitas.count({ where: { user_id: bentrok.id } }),
      prisma.usulanPemusnahan.count({
        where: { OR: [{ diajukan_oleh: bentrok.id }, { disetujui_oleh: bentrok.id }] },
      }),
      prisma.arsipRiwayat.count({ where: { user_id: bentrok.id } }),
      prisma.notifikasi.count({ where: { user_id: bentrok.id } }),
    ]);

    if (arsipDibuat + arsipDiubah + log + usulan + riwayat + notifikasi === 0) {
      await prisma.user.delete({ where: { id: bentrok.id } });
    } else {
      const akhiran = Date.now();
      await prisma.user.update({
        where: { id: bentrok.id },
        data: {
          username: `${bentrok.username}-lama-${akhiran}`,
          email: `lama-${akhiran}-${bentrok.email}`,
          aktif: false,
        },
      });
    }
  }

  await prisma.user.create({
    data: {
      id: user.id,
      ...data,
      password_hash: "supabase-auth",
    },
  });
}
