"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin";
import {
  contactEnquiriesCollection,
  ordersCollection,
  reviewsCollection,
  usersCollection,
  type ContactEnquiryStatus,
  type OrderStatus,
  type ReviewStatus,
  type UserRole,
} from "@/lib/db/schema";
import { deleteImage } from "@/lib/cloudinary";
import { sanitizeText } from "@/lib/request";
import {
  adminNoteSchema,
  enquiryStatusSchema,
  orderStatusSchema,
  reviewStatusSchema,
  userRoleSchema,
} from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit";

/**
 * Every action here re-verifies admin access itself via `requireAdmin()` —
 * the admin UI hiding a button from a non-admin is not a security boundary,
 * only these checks are.
 */

/** Shared throttle for admin mutations — generous enough not to interrupt
 * normal moderation, tight enough to stop a runaway client or script. */
function assertAdminRateLimit(adminId: string): void {
  const limit = checkRateLimit(`admin-action:${adminId}`, { limit: 60, windowMs: 5 * 60_000 });
  if (!limit.success) {
    throw new Error("Too many admin actions in a short time. Please slow down and try again.");
  }
}

async function countActiveAdmins(): Promise<number> {
  const users = await usersCollection();
  return users.countDocuments({ role: "ADMIN", isActive: true });
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: ContactEnquiryStatus,
): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);
  const parsedStatus = enquiryStatusSchema.parse(status);

  const enquiries = await contactEnquiriesCollection();
  await enquiries.updateOne(
    { _id: new ObjectId(enquiryId) },
    { $set: { status: parsedStatus, updatedAt: new Date() } },
  );

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}

export async function updateEnquiryNote(enquiryId: string, note: string): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);
  const parsedNote = adminNoteSchema.parse(note);

  const enquiries = await contactEnquiriesCollection();
  await enquiries.updateOne(
    { _id: new ObjectId(enquiryId) },
    { $set: { adminNote: parsedNote ? sanitizeText(parsedNote, 500) : null, updatedAt: new Date() } },
  );

  revalidatePath("/admin/enquiries");
}

export async function deleteEnquiry(enquiryId: string): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);

  const enquiries = await contactEnquiriesCollection();
  const result = await enquiries.deleteOne({ _id: new ObjectId(enquiryId) });

  if (result.deletedCount > 0) {
    await logAdminAction({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "ENQUIRY_DELETED",
      targetType: "enquiry",
      targetId: enquiryId,
    });
  }

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}

export async function moderateReview(
  reviewId: string,
  status: ReviewStatus,
  adminNote?: string,
): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);
  const parsedStatus = reviewStatusSchema.parse(status);

  const reviews = await reviewsCollection();
  const now = new Date();

  await reviews.updateOne(
    { _id: new ObjectId(reviewId) },
    {
      $set: {
        status: parsedStatus,
        adminNote: adminNote ? sanitizeText(adminNote, 500) : null,
        updatedAt: now,
        ...(parsedStatus === "APPROVED"
          ? { approvedAt: now, approvedBy: new ObjectId(session.user.id) }
          : {}),
      },
    },
  );

  await logAdminAction({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "REVIEW_MODERATED",
    targetType: "review",
    targetId: reviewId,
    meta: { status: parsedStatus },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/reviews");
}

export async function deleteReview(reviewId: string): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);

  const reviews = await reviewsCollection();
  const review = await reviews.findOne({ _id: new ObjectId(reviewId) });
  if (!review) return;

  await reviews.deleteOne({ _id: review._id });
  await Promise.all(review.images.map((image) => deleteImage(image.publicId)));

  await logAdminAction({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "REVIEW_DELETED",
    targetType: "review",
    targetId: reviewId,
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/reviews");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);
  const parsedStatus = orderStatusSchema.parse(status);

  const orders = await ordersCollection();
  await orders.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: { status: parsedStatus, updatedAt: new Date() } },
  );

  await logAdminAction({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "ORDER_STATUS_CHANGED",
    targetType: "order",
    targetId: orderId,
    meta: { status: parsedStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);

  if (session.user.id === userId && !isActive) {
    throw new Error("You can't deactivate your own account.");
  }

  const users = await usersCollection();

  if (!isActive) {
    const target = await users.findOne({ _id: new ObjectId(userId) });
    if (target?.role === "ADMIN" && target.isActive && (await countActiveAdmins()) <= 1) {
      throw new Error("You can't deactivate the last active admin.");
    }
  }

  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isActive, updatedAt: new Date() } },
  );

  await logAdminAction({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "USER_ACTIVATION_CHANGED",
    targetType: "user",
    targetId: userId,
    meta: { isActive },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const session = await requireAdmin();
  assertAdminRateLimit(session.user.id);
  const parsedRole = userRoleSchema.parse(role);

  if (session.user.id === userId && parsedRole !== "ADMIN") {
    throw new Error("You can't remove your own admin access.");
  }

  const users = await usersCollection();

  if (parsedRole !== "ADMIN") {
    const target = await users.findOne({ _id: new ObjectId(userId) });
    if (target?.role === "ADMIN" && target.isActive && (await countActiveAdmins()) <= 1) {
      throw new Error("You can't remove the last active admin's access.");
    }
  }

  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { role: parsedRole, updatedAt: new Date() } },
  );

  await logAdminAction({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "USER_ROLE_CHANGED",
    targetType: "user",
    targetId: userId,
    meta: { role: parsedRole },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
