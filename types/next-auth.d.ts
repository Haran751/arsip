import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "Admin" | "Operator";
      aktif: boolean;
      must_change_password: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "Admin" | "Operator";
    aktif?: boolean;
    must_change_password?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "Admin" | "Operator";
    aktif?: boolean;
    must_change_password?: boolean;
  }
}
