import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import {
  cariPenggunaAuthByUsername,
  emailUntukUsername,
  keUserAplikasi,
  panggilAuth,
  type SupabaseAuthUser,
} from "@/lib/supabase-admin";
import { sinkronPengguna } from "@/lib/user-sync";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type HasilLogin = {
  user?: SupabaseAuthUser;
};

type TokenAplikasi = {
  id?: string;
  role?: "Admin" | "Operator";
  aktif?: boolean;
  must_change_password?: boolean;
  name?: string | null;
};

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        let email = emailUntukUsername(username);
        if (!username.includes("@")) {
          const dicari = await cariPenggunaAuthByUsername(username);
          if (dicari?.email) email = dicari.email;
        }

        const hasil = await panggilAuth<HasilLogin>("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }).catch(() => null);

        const authUser = hasil?.user;
        if (!authUser) return null;

        const user = keUserAplikasi(authUser);
        if (!user || !user.aktif) return null;

        // Pastikan user Supabase Auth tersedia di tabel users untuk relasi foreign key.
        await sinkronPengguna(user, Boolean(authUser.user_metadata?.must_change_password)).catch((error) => {
          console.error("Gagal sinkronisasi user ke database:", error);
        });

        return {
          id: user.id,
          name: user.nama,
          role: user.role,
          aktif: user.aktif,
          must_change_password: Boolean(authUser.user_metadata?.must_change_password),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const data = token as unknown as TokenAplikasi;

      if (user) {
        data.id = user.id;
        data.role = user.role;
        data.aktif = user.aktif;
        data.must_change_password = user.must_change_password;
        data.name = user.name;
      }

      if (trigger === "update" && session) {
        if (session.user?.name) data.name = session.user.name;
        if (typeof session.user?.must_change_password === "boolean") {
          data.must_change_password = session.user.must_change_password;
        }
      }

      return token;
    },
    async session({ session, token }) {
      const data = token as unknown as TokenAplikasi;

      session.user.id = data.id ?? "";
      session.user.role = data.role ?? "Operator";
      session.user.aktif = data.aktif ?? true;
      session.user.must_change_password = data.must_change_password ?? false;

      return session;
    },
  },
});
