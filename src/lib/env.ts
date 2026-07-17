import "server-only";
import { z } from "zod";

/**
 * Server-only environment validation. Importing this from a Client Component
 * fails the build (via the `server-only` package) rather than leaking a
 * secret into the client bundle at runtime.
 *
 * Required variables throw a clear error the first time they're read, not at
 * module load — this file is only imported by code that runs on request
 * (auth, db, cloudinary, routes), never by a statically-generated page, so a
 * missing var surfaces as a runtime configuration error instead of failing
 * `npm run build` when an optional service isn't configured yet.
 */

/**
 * An unset optional var (e.g. `CLOUDINARY_CLOUD_NAME=` with nothing after
 * the `=`) reaches `process.env` as `""`, not `undefined` — plain
 * `.optional()` only tolerates the latter, so every optional var here is
 * pre-processed to treat an empty string as absent.
 */
const optionalString = (max?: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    max ? z.string().min(1).max(max).optional() : z.string().min(1).optional(),
  );

const optionalEmail = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().email().optional(),
  );

const rawEnvSchema = z.object({
  MONGODB_URI: optionalString(),
  MONGODB_DB_NAME: z.string().min(1).default("himalaya_sparsh"),

  AUTH_SECRET: optionalString(),
  AUTH_GOOGLE_ID: optionalString(),
  AUTH_GOOGLE_SECRET: optionalString(),
  AUTH_TRUST_HOST: optionalString(),

  NEXT_PUBLIC_SITE_URL: optionalString(),

  CLOUDINARY_CLOUD_NAME: optionalString(),
  CLOUDINARY_API_KEY: optionalString(),
  CLOUDINARY_API_SECRET: optionalString(),

  ADMIN_EMAILS: optionalString(),
  CONTACT_RECEIVER_EMAIL: optionalEmail(),

  RESEND_API_KEY: optionalString(),
  EMAIL_FROM: optionalString(),
});

type RawEnv = z.infer<typeof rawEnvSchema>;

let cachedRawEnv: RawEnv | null = null;

function readRawEnv(): RawEnv {
  if (cachedRawEnv) return cachedRawEnv;
  const parsed = rawEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }
  cachedRawEnv = parsed.data;
  return cachedRawEnv;
}

/** Throws a clear, single-line configuration error for a missing required var. */
function required<K extends keyof RawEnv>(key: K): NonNullable<RawEnv[K]> {
  const value = readRawEnv()[key];
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${key}. See .env.example.`,
    );
  }
  return value as NonNullable<RawEnv[K]>;
}

/** Lazily-validated, required-at-use-time environment access. */
export const env = {
  get MONGODB_URI() {
    return required("MONGODB_URI");
  },
  get MONGODB_DB_NAME() {
    return readRawEnv().MONGODB_DB_NAME;
  },

  get AUTH_SECRET() {
    return required("AUTH_SECRET");
  },
  get AUTH_GOOGLE_ID() {
    return required("AUTH_GOOGLE_ID");
  },
  get AUTH_GOOGLE_SECRET() {
    return required("AUTH_GOOGLE_SECRET");
  },

  get NEXT_PUBLIC_SITE_URL() {
    return readRawEnv().NEXT_PUBLIC_SITE_URL ?? null;
  },

  get CONTACT_RECEIVER_EMAIL() {
    return readRawEnv().CONTACT_RECEIVER_EMAIL ?? null;
  },
  get RESEND_API_KEY() {
    return readRawEnv().RESEND_API_KEY ?? null;
  },
  get EMAIL_FROM() {
    return readRawEnv().EMAIL_FROM ?? null;
  },
} as const;

/** True once every variable email notifications need is present. */
export function isEmailConfigured(): boolean {
  const raw = readRawEnv();
  return Boolean(raw.RESEND_API_KEY && raw.EMAIL_FROM && raw.CONTACT_RECEIVER_EMAIL);
}

/** True once every variable Cloudinary uploads need is present. */
export function isCloudinaryConfigured(): boolean {
  const raw = readRawEnv();
  return Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET,
  );
}

export function getCloudinaryConfig() {
  const raw = readRawEnv();
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }
  return {
    cloudName: raw.CLOUDINARY_CLOUD_NAME as string,
    apiKey: raw.CLOUDINARY_API_KEY as string,
    apiSecret: raw.CLOUDINARY_API_SECRET as string,
  };
}

/** Parses ADMIN_EMAILS into a lowercase, de-duplicated set. Empty when unset. */
export function getAdminEmails(): Set<string> {
  const raw = readRawEnv().ADMIN_EMAILS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
