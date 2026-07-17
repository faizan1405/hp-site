import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      isActive: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: "USER" | "ADMIN";
    isActive: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
    isActive: boolean;
  }
}
