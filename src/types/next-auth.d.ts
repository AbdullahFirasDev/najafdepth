import type { RoleKey } from "@/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: RoleKey;
      status: string;
      isActive: boolean;
    };
  }

  interface User {
    role?: RoleKey;
    status?: string;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: RoleKey;
    status?: string;
    isActive?: boolean;
  }
}
