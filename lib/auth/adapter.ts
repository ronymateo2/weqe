import { randomUUID } from "crypto";
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken
} from "@auth/core/adapters";
import type { Pool } from "pg";

function mapUser(row: {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
}): AdapterUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email as AdapterUser["email"],
    emailVerified: row.emailVerified,
    image: row.image
  };
}

function mapSession(row: {
  sessionToken: string;
  userId: string;
  expires: Date;
}): AdapterSession {
  return {
    sessionToken: row.sessionToken,
    userId: row.userId,
    expires: row.expires
  };
}

function mapAccount(row: {
  userId: string;
  type: AdapterAccount["type"];
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}): AdapterAccount {
  return {
    userId: row.userId,
    type: row.type,
    provider: row.provider,
    providerAccountId: row.providerAccountId,
    refresh_token: row.refresh_token ?? undefined,
    access_token: row.access_token ?? undefined,
    expires_at: row.expires_at ?? undefined,
    token_type: (row.token_type ?? undefined) as AdapterAccount["token_type"],
    scope: row.scope ?? undefined,
    id_token: row.id_token ?? undefined,
    session_state: row.session_state ?? undefined
  };
}

export function DyPostgresAdapter(client: Pool): Adapter {
  return {
    async createUser(user) {
      const id = user.id || randomUUID();
      const result = await client.query(
        `
          insert into dy_users (id, name, email, "emailVerified", image)
          values ($1, $2, $3, $4, $5)
          returning id, name, email, "emailVerified", image
        `,
        [id, user.name ?? null, user.email, user.emailVerified ?? null, user.image ?? null]
      );

      return mapUser(result.rows[0]);
    },
    async getUser(id) {
      const result = await client.query(
        `
          select id, name, email, "emailVerified", image
          from dy_users
          where id = $1
        `,
        [id]
      );

      return result.rowCount ? mapUser(result.rows[0]) : null;
    },
    async getUserByEmail(email) {
      const result = await client.query(
        `
          select id, name, email, "emailVerified", image
          from dy_users
          where email = $1
        `,
        [email]
      );

      return result.rowCount ? mapUser(result.rows[0]) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const result = await client.query(
        `
          select u.id, u.name, u.email, u."emailVerified", u.image
          from dy_users u
          join dy_accounts a on a."userId" = u.id
          where a.provider = $1 and a."providerAccountId" = $2
        `,
        [provider, providerAccountId]
      );

      return result.rowCount ? mapUser(result.rows[0]) : null;
    },
    async updateUser(user) {
      const existing = await client.query(
        `
          select id, name, email, "emailVerified", image
          from dy_users
          where id = $1
        `,
        [user.id]
      );

      if (!existing.rowCount) {
        throw new Error(`Auth user not found: ${user.id}`);
      }

      const nextUser = { ...existing.rows[0], ...user };
      const result = await client.query(
        `
          update dy_users
          set name = $2, email = $3, "emailVerified" = $4, image = $5
          where id = $1
          returning id, name, email, "emailVerified", image
        `,
        [
          nextUser.id,
          nextUser.name ?? null,
          nextUser.email,
          nextUser.emailVerified ?? null,
          nextUser.image ?? null
        ]
      );

      return mapUser(result.rows[0]);
    },
    async deleteUser(userId) {
      await client.query(`delete from dy_users where id = $1`, [userId]);
    },
    async linkAccount(account) {
      const result = await client.query(
        `
          insert into dy_accounts (
            "userId",
            type,
            provider,
            "providerAccountId",
            refresh_token,
            access_token,
            expires_at,
            token_type,
            scope,
            id_token,
            session_state
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          returning
            "userId",
            type,
            provider,
            "providerAccountId",
            refresh_token,
            access_token,
            expires_at,
            token_type,
            scope,
            id_token,
            session_state
        `,
        [
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token ?? null,
          account.access_token ?? null,
          account.expires_at ?? null,
          account.token_type ?? null,
          account.scope ?? null,
          account.id_token ?? null,
          account.session_state ?? null
        ]
      );

      return mapAccount(result.rows[0]);
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await client.query(
        `
          delete from dy_accounts
          where provider = $1 and "providerAccountId" = $2
        `,
        [provider, providerAccountId]
      );
    },
    async createSession(session) {
      const result = await client.query(
        `
          insert into dy_sessions ("sessionToken", "userId", expires)
          values ($1, $2, $3)
          returning "sessionToken", "userId", expires
        `,
        [session.sessionToken, session.userId, session.expires]
      );

      return mapSession(result.rows[0]);
    },
    async getSessionAndUser(sessionToken) {
      const result = await client.query(
        `
          select
            s."sessionToken",
            s."userId",
            s.expires,
            u.id,
            u.name,
            u.email,
            u."emailVerified",
            u.image
          from dy_sessions s
          join dy_users u on u.id = s."userId"
          where s."sessionToken" = $1
        `,
        [sessionToken]
      );

      if (!result.rowCount) {
        return null;
      }

      const row = result.rows[0];

      return {
        session: mapSession(row),
        user: mapUser(row)
      };
    },
    async updateSession(session) {
      const existing = await client.query(
        `
          select "sessionToken", "userId", expires
          from dy_sessions
          where "sessionToken" = $1
        `,
        [session.sessionToken]
      );

      if (!existing.rowCount) {
        return null;
      }

      const nextSession = { ...existing.rows[0], ...session };
      const result = await client.query(
        `
          update dy_sessions
          set expires = $2
          where "sessionToken" = $1
          returning "sessionToken", "userId", expires
        `,
        [nextSession.sessionToken, nextSession.expires]
      );

      return result.rowCount ? mapSession(result.rows[0]) : null;
    },
    async deleteSession(sessionToken) {
      await client.query(
        `
          delete from dy_sessions
          where "sessionToken" = $1
        `,
        [sessionToken]
      );
    },
    async createVerificationToken(verificationToken) {
      await client.query(
        `
          insert into dy_verification_tokens (identifier, token, expires)
          values ($1, $2, $3)
        `,
        [verificationToken.identifier, verificationToken.token, verificationToken.expires]
      );

      return verificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      const result = await client.query(
        `
          delete from dy_verification_tokens
          where identifier = $1 and token = $2
          returning identifier, token, expires
        `,
        [identifier, token]
      );

      return result.rowCount ? (result.rows[0] as VerificationToken) : null;
    },
    async getAccount(providerAccountId, provider) {
      const result = await client.query(
        `
          select
            "userId",
            type,
            provider,
            "providerAccountId",
            refresh_token,
            access_token,
            expires_at,
            token_type,
            scope,
            id_token,
            session_state
          from dy_accounts
          where provider = $1 and "providerAccountId" = $2
        `,
        [provider, providerAccountId]
      );

      return result.rowCount ? mapAccount(result.rows[0]) : null;
    }
  };
}
