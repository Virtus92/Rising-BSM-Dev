import NextAuth, { DefaultSession, User } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    role: string;
    id: string;
  }
}
