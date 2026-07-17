import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import { getClient } from "@/lib/mongodb";
import { env, getAdminEmails } from "@/lib/env";
import { usersCollection, type UserRole } from "@/lib/db/schema";

/**
 * Auth.js v5, Google OAuth only, database sessions via the official MongoDB
 * adapter — the adapter owns `users`/`accounts`/`sessions` and dedupes by
 * provider account, so the same Google account signing in twice updates one
 * row rather than creating a second. `events.createUser` and `events.signIn`
 * extend that same row with the app's own fields (role, isActive, timestamps)
 * rather than standing up a second, conflicting user model — see the note
 * above `UserDoc` in `src/lib/db/schema.ts`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getClient(), { databaseName: env.MONGODB_DB_NAME }),
  session: { strategy: "database" },
  trustHost: true,
  secret: env.AUTH_SECRET,
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    /**
     * Runs on every sign-in attempt, new or returning. A brand-new Google
     * account has no row yet — `existing` is null and sign-in proceeds so the
     * adapter can create it. A returning account that an admin has
     * deactivated is blocked here, independent of anything the client sends.
     */
    async signIn({ user }) {
      if (!user.email) return false;
      const users = await usersCollection();
      const existing = await users.findOne({ email: user.email });
      if (existing && existing.isActive === false) return false;
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role ?? "USER";
      session.user.isActive = user.isActive ?? true;
      return session;
    },
  },
  events: {
    /** Fires once, right after the adapter inserts a brand-new user row. */
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
     * Fires on every successful sign-in, including the first (alongside
     * `createUser`). Also re-checks `ADMIN_EMAILS` on each login, so adding an
     * address to that list promotes an existing account the next time it
     * signs in — bootstrapping doesn't require the account to be deleted and
     * recreated.
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
