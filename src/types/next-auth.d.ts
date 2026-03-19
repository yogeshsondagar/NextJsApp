import NextAuth, { DefaultSession } from "next-auth";

// We are "augmenting" the default NextAuth types to include our custom role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      username?: string;
      department_id?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string;
    username?: string;
    department_id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    username?: string;
    department_id?: string;
  }
}