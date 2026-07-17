import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getClient } from "@/lib/mongodb";
import { env, getAdminEmails, isAdminCredentialsConfigured } from "@/lib/env";
import { usersCollection, type UserRole } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractClientIp } from "@/lib/request";

/**
 * Timing-safety padding only — the hash of a throwaway string, never a real
 * password's hash. `authorize()` always runs a bcrypt comparison against
 * *something*, even when the submitted email is already known to be wrong,
 * so a "wrong email" rejection and a "wrong password" rejection take the
 * same amount of time and an attacker can't use response time to confirm
 * the admin email is correct before brute-forcing the password.
 */
const TIMING_GUARD_HASH = "$2b$10$1g.KTtPp5I9JyiqdrypI8umN0KWZfRVtz/mBFQWUG2VMotpmz/q2m";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().min(1).max(200),
});

/**
 * Auth.js v5, two providers:
 *
 *  - Google OAuth (unchanged) — any Google account can sign in; it gets
 *    `role: "ADMIN"` only if its email is in `ADMIN_EMAILS`, otherwise `USER`.
 *  - Credentials, admin-only — a single fixed account (`ADMIN_LOGIN_EMAIL`),
 *    checked against a bcrypt hash (`ADMIN_LOGIN_PASSWORD_HASH`). This is not
 *    a public registration path: `authorize()` accepts only that one email,
 *    and there is no sign-up flow anywhere that creates a credentials user.
 *
 * Session strategy is JWT, not the adapter's database sessions. This is a
 * hard Auth.js constraint, not a preference: Credentials sign-in never goes
 * through the adapter (there is no OAuth account for it to link via
 * `createSession`), so it "can only be used if JSON Web Tokens are enabled
 * for sessions" (Auth.js's own docs) — and the session strategy is one
 * setting for the whole app, so Google has to use the same one.
 *
 * The adapter is still passed to `NextAuth()` and still does everything it
 * did before for the Google flow — `createUser`, `linkAccount`,
 * `getUserByAccount` all still run, so the same email never produces two
 * rows and existing Google users/sessions/dashboard access are unaffected.
 * Only *session storage* moves from a `sessions` collection to a signed
 * cookie. Freshness is preserved by re-reading `role`/`isActive` from Mongo
 * on every `jwt` callback call below (not just at sign-in), so a role change
 * or deactivation still takes effect on the very next request — the same
 * guarantee the old database-session strategy gave, implemented differently.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getClient(), { databaseName: env.MONGODB_DB_NAME }),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: env.AUTH_SECRET,
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials, request) {
        // Rate-limited by IP, read straight off the raw request — `authorize`
        // does not run inside `next/headers`'s request-scoped context, so
        // `headers()` isn't available here the way it is in a Server Action.
        const ip = extractClientIp((name) => request.headers.get(name));
        const limit = checkRateLimit(`admin-credentials-login:${ip}`, {
          limit: 8,
          windowMs: 10 * 60_000,
        });
        if (!limit.success) return null;

        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (!isAdminCredentialsConfigured()) return null;

        const emailMatches = email === env.ADMIN_LOGIN_EMAIL;
        const hashToCompare =
          emailMatches && env.ADMIN_LOGIN_PASSWORD_HASH
            ? env.ADMIN_LOGIN_PASSWORD_HASH
            : TIMING_GUARD_HASH;

        // Always awaited, regardless of `emailMatches` — see TIMING_GUARD_HASH.
        const passwordMatches = await bcrypt.compare(password, hashToCompare);
        if (!emailMatches || !passwordMatches) return null;

        // Create-or-update the SAME `users` collection Google sign-in uses —
        // never a second, parallel user model for credentials accounts.
        const users = await usersCollection();
        const now = new Date();

        await users.updateOne(
          { email },
          {
            $set: {
              role: "ADMIN" satisfies UserRole,
              isActive: true,
              updatedAt: now,
              lastLoginAt: now,
            },
            $setOnInsert: {
              _id: new ObjectId(),
              email,
              name: "Admin",
              emailVerified: null,
              image: null,
              createdAt: now,
            },
          },
          { upsert: true },
        );

        const doc = await users.findOne({ email });
        if (!doc || !doc.isActive) return null;

        return {
          id: doc._id.toString(),
          email: doc.email,
          name: doc.name,
          image: doc.image,
          role: doc.role,
          isActive: doc.isActive,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    /**
     * Runs on every sign-in attempt, from either provider. A deactivated
     * account is blocked here independent of anything the client sends.
     * `authorize()` above already checks `isActive` for Credentials, but
     * this callback is what protects the Google path.
     */
    async signIn({ user }) {
      if (!user.email) return false;
      const users = await usersCollection();
      const existing = await users.findOne({ email: user.email });
      if (existing && existing.isActive === false) return false;
      return true;
    },
    /**
     * Runs at sign-in (`user` present) and again on every subsequent request
     * that checks the session (`user` absent). Re-reading `role`/`isActive`
     * from Mongo each time — rather than trusting whatever was embedded in
     * the token at sign-in — is what keeps a role change or deactivation
     * effective on the next request instead of only the next login.
     */
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (typeof token.id !== "string") return token;

      const users = await usersCollection();
      const doc = await users.findOne({ _id: new ObjectId(token.id) });
      if (doc) {
        token.role = doc.role;
        token.isActive = doc.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role ?? "USER";
      session.user.isActive = token.isActive ?? true;
      return session;
    },
  },
  events: {
    /** Fires once, right after the adapter inserts a brand-new Google user row. */
    async createUser({ user }) {
      if (!user.id) return;
      const users = await usersCollection();
      const now = new Date();
      const role: UserRole =
        user.email && getAdminEmails().has(user.email.toLowerCase())
          ? "ADMIN"
          : "USER";
      await users.updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            role,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
          },
        },
      );
    },
    /**
     * Fires on every successful sign-in, from either provider. Also
     * re-checks `ADMIN_EMAILS` on each Google login, so adding an address to
     * that list promotes an existing account the next time it signs in.
     */
    async signIn({ user }) {
      if (!user.id) return;
      const users = await usersCollection();
      const now = new Date();
      const update: { updatedAt: Date; lastLoginAt: Date; role?: UserRole } = {
        updatedAt: now,
        lastLoginAt: now,
      };
      if (user.email && getAdminEmails().has(user.email.toLowerCase())) {
        update.role = "ADMIN";
      }
      await users.updateOne({ _id: new ObjectId(user.id) }, { $set: update });
    },
  },
});
