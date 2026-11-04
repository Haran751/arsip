import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import {
  autentikasiLokal,
  cariPenggunaAuthByUsername,
  emailUntukUsername,
  keDemoUserAuth,
  panggilAuth,
  supabaseTerkonfigurasi,
  type SupabaseAuthUser,
} from "@/lib/supabase-admin";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type HasilLogin = {
  user?: SupabaseAuthUser;
};

type TokenAplikasi = {
  id?: string;
  role?: "Admin" | "Operator" | "Pimpinan";
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

        // Mode lokal: dipakai saat Supabase belum dikonfigurasi.
        if (!supabaseTerkonfigurasi()) {
          const lokal = autentikasiLokal(username, password);
          if (!lokal) return null;
          const userLokal = keDemoUserAuth(lokal);
          if (!userLokal || !userLokal.aktif) return null;
          return {
            id: userLokal.id,
            name: userLokal.nama,
            email: userLokal.email,
            role: userLokal.role,
            aktif: userLokal.aktif,
            must_change_password: false,
          };
        }

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

        const user = keDemoUserAuth(authUser);
        if (!user || !user.aktif) return null;

        return {
          id: user.id,
          name: user.nama,
          email: user.email,
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
