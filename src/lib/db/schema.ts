import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";

/* -------------------------------------------------------------------------- *
 * Shared shapes.
 * -------------------------------------------------------------------------- */

export type CloudinaryImageRef = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
};

/* -------------------------------------------------------------------------- *
 * User — the SAME `users` collection Auth.js's MongoDB adapter reads and
 * writes (see src/lib/auth.ts). There is deliberately no separate app-level
 * user model: the adapter owns creation and account linking (so the same
 * Google account never produces two rows), and `events.createUser` /
 * `events.signIn` extend the adapter's document with the fields below.
 * -------------------------------------------------------------------------- */

export type UserRole = "USER" | "ADMIN";

export type UserDoc = {
  _id: ObjectId;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

/* -------------------------------------------------------------------------- *
 * CustomerProfile
 * -------------------------------------------------------------------------- */

export type CustomerProfileDoc = {
  _id: ObjectId;
  userId: ObjectId;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  image: CloudinaryImageRef | null;
  createdAt: Date;
  updatedAt: Date;
};

/* -------------------------------------------------------------------------- *
 * ContactEnquiry
 * -------------------------------------------------------------------------- */

export type ContactEnquiryStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM";

export type ContactEnquiryDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactEnquiryStatus;
  /** Admin-only note, never shown to the visitor who sent the enquiry. */
  adminNote: string | null;
  userId: ObjectId | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

/* -------------------------------------------------------------------------- *
 * Review
 * -------------------------------------------------------------------------- */

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";

export type ReviewDoc = {
  _id: ObjectId;
  userId: ObjectId;
  /** Snapshot of the author's name at submission time, so a later name change
   * (or account deletion) never rewrites what a published review says. */
  customerName: string;
  rating: number;
  title: string | null;
  text: string;
  images: CloudinaryImageRef[];
  status: ReviewStatus;
  /** Only ever true when a real order backend confirms the purchase — this
   * project has none yet, so every review is created with this `false`. */
  isVerifiedPurchase: boolean;
  adminNote: string | null;
  approvedAt: Date | null;
  approvedBy: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

/* -------------------------------------------------------------------------- *
 * Order — the "Buy Now" checkout's own record. Created as `PENDING_PAYMENT`
 * the moment a Razorpay order is opened, then flipped to `PAID` or
 * `PAYMENT_FAILED` once the client reports back and the signature is
 * verified server-side (see src/app/api/checkout/verify/route.ts). Delivery
 * details are snapshotted onto the order itself — never joined from
 * `CustomerProfileDoc` at read time — so a later profile edit never rewrites
 * what a past order shipped to.
 * -------------------------------------------------------------------------- */

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PAYMENT_FAILED" | "CANCELLED";

export type OrderDoc = {
  _id: ObjectId;
  userId: ObjectId;
  /** Short, human-readable reference shown to the customer and in admin. */
  orderNumber: string;
  productName: string;
  /** Smallest currency unit (paise for INR) — what Razorpay actually charged. */
  amount: number;
  currency: string;
  status: OrderStatus;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/* -------------------------------------------------------------------------- *
 * SiteSettings — a single document (`_id: "site"`) the admin Settings page
 * reads and writes. Deliberately narrow: business/contact details only, never
 * the animation timeline, ingredient copy or claims-safety wording that lives
 * in `src/config/content.ts` and is guarded by the rules documented there.
 * -------------------------------------------------------------------------- */

export type SiteSettingsDoc = {
  _id: "site";
  brandName: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  email: string | null;
  address: string | null;
  businessHours: string | null;
  founderName: string | null;
  founderDesignation: string | null;
  founderPortrait: CloudinaryImageRef | null;
  contactReceiverEmail: string | null;
  socialLinks: {
    instagram: string | null;
    facebook: string | null;
    youtube: string | null;
    linkedin: string | null;
    twitter: string | null;
  };
  maintenanceMessage: string | null;
  updatedAt: Date;
  updatedBy: ObjectId | null;
};

/* -------------------------------------------------------------------------- *
 * AuditLog — a best-effort record of sensitive admin actions. Written after
 * the action it describes has already succeeded, so a logging failure never
 * blocks the action itself (see `logAdminAction` in src/lib/audit.ts).
 * -------------------------------------------------------------------------- */

export type AuditAction =
  | "REVIEW_MODERATED"
  | "REVIEW_DELETED"
  | "USER_ROLE_CHANGED"
  | "USER_ACTIVATION_CHANGED"
  | "ENQUIRY_DELETED"
  | "MEDIA_DELETED"
  | "MEDIA_REPLACED"
  | "SETTINGS_UPDATED"
  | "ORDER_STATUS_CHANGED";

export type AuditLogDoc = {
  _id: ObjectId;
  actorId: ObjectId;
  actorEmail: string;
  action: AuditAction;
  targetType: "review" | "user" | "enquiry" | "media" | "settings" | "order";
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
};

/* -------------------------------------------------------------------------- *
 * Collection getters.
 * -------------------------------------------------------------------------- */

export async function usersCollection(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}

export async function customerProfilesCollection(): Promise<
  Collection<CustomerProfileDoc>
> {
  return (await getDb()).collection<CustomerProfileDoc>("customerProfiles");
}

export async function contactEnquiriesCollection(): Promise<
  Collection<ContactEnquiryDoc>
> {
  return (await getDb()).collection<ContactEnquiryDoc>("contactEnquiries");
}

export async function reviewsCollection(): Promise<Collection<ReviewDoc>> {
  return (await getDb()).collection<ReviewDoc>("reviews");
}

export async function ordersCollection(): Promise<Collection<OrderDoc>> {
  return (await getDb()).collection<OrderDoc>("orders");
}

export async function siteSettingsCollection(): Promise<Collection<SiteSettingsDoc>> {
  return (await getDb()).collection<SiteSettingsDoc>("siteSettings");
}

export async function auditLogsCollection(): Promise<Collection<AuditLogDoc>> {
  return (await getDb()).collection<AuditLogDoc>("auditLogs");
}

/* -------------------------------------------------------------------------- *
 * Indexes — created once per warm process. `createIndex` is idempotent (a
 * repeat call with the same spec is a no-op against Atlas), so memoizing this
 * on `globalThis` only saves the round trip, not correctness.
 * -------------------------------------------------------------------------- */

type GlobalWithIndexes = typeof globalThis & {
  __indexesEnsured?: Promise<void>;
};

async function createIndexes(): Promise<void> {
  const [users, profiles, enquiries, reviews, auditLogs, orders] = await Promise.all([
    usersCollection(),
    customerProfilesCollection(),
    contactEnquiriesCollection(),
    reviewsCollection(),
    auditLogsCollection(),
    ordersCollection(),
  ]);

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    profiles.createIndex({ userId: 1 }, { unique: true }),
    enquiries.createIndex({ status: 1, createdAt: -1 }),
    enquiries.createIndex({ userId: 1, createdAt: -1 }),
    reviews.createIndex({ status: 1, createdAt: -1 }),
    reviews.createIndex({ userId: 1, createdAt: -1 }),
    auditLogs.createIndex({ createdAt: -1 }),
    orders.createIndex({ razorpayOrderId: 1 }, { unique: true }),
    orders.createIndex({ userId: 1, createdAt: -1 }),
    orders.createIndex({ status: 1, createdAt: -1 }),
    orders.createIndex({ orderNumber: 1 }, { unique: true }),
  ]);
}

/** Call once at the start of any code path that writes to these collections. */
export function ensureIndexes(): Promise<void> {
  const globalWithIndexes = globalThis as GlobalWithIndexes;
  if (!globalWithIndexes.__indexesEnsured) {
    globalWithIndexes.__indexesEnsured = createIndexes();
  }
  return globalWithIndexes.__indexesEnsured;
}
