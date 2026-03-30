import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { Pool } from "pg";
import { DyPostgresAdapter } from "@/lib/auth/adapter";
import { env } from "@/lib/env";

const authPool = env.AUTH_POSTGRES_URL
  ? new Pool({
      connectionString: env.AUTH_POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    })
  : null;

export const authConfig = {
  adapter: authPool ? DyPostgresAdapter(authPool) : undefined,
  providers:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET
          })
        ]
      : [],
  session: {
    strategy: authPool ? "database" : "jwt"
  },
  pages: {
    signIn: "/register"
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }

      return session;
    }
  }
} satisfies NextAuthConfig;
