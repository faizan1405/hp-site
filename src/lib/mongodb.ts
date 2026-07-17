import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "@/lib/env";

/**
 * One MongoClient per process, cached on `globalThis`. Vercel's Node.js
 * functions reuse warm containers (Fluid Compute keeps this even more
 * aggressively), and `next dev`'s module reloads would otherwise open a fresh
 * connection on every edit — both would exhaust Atlas's connection limit
 * without this cache.
 *
 * `new MongoClient(...)` does no network I/O by itself — since driver v4, a
 * client auto-connects on its first real operation, so simply constructing it
 * here is synchronous and side-effect-free. That matters because this module
 * is imported (not necessarily *invoked*) during `next build`'s route
 * analysis; a real connection attempt at import time would make the build
 * depend on live Atlas credentials it doesn't have yet.
 */

type GlobalWithMongo = typeof globalThis & {
  __mongoClient?: MongoClient;
};

export function getClient(): MongoClient {
  const globalWithMongo = globalThis as GlobalWithMongo;
  if (!globalWithMongo.__mongoClient) {
    globalWithMongo.__mongoClient = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      maxIdleTimeMS: 60_000,
    });
  }
  return globalWithMongo.__mongoClient;
}

/** Handed to `@auth/mongodb-adapter`, which requires a `Promise<MongoClient>`. */
export function getClientPromise(): Promise<MongoClient> {
  return Promise.resolve(getClient());
}

export async function getMongoClient(): Promise<MongoClient> {
  return getClient();
}

export async function getDb(): Promise<Db> {
  return getClient().db(env.MONGODB_DB_NAME);
}
