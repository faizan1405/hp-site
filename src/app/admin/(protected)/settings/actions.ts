"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin";
import { siteSettingsCollection, type CloudinaryImageRef } from "@/lib/db/schema";
import { settingsSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/request";
import { CLOUDINARY_FOLDERS, deleteImage, isOwnedPublicId } from "@/lib/cloudinary";
import { logAdminAction } from "@/lib/audit";

export type SettingsActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Bound to a `<form action>` via `useActionState` in `SettingsForm`. */
export async function updateSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireAdmin();

  const parsed = settingsSchema.safeParse({
    brandName: formData.get("brandName"),
    phone: formData.get("phone"),
    whatsappNumber: formData.get("whatsappNumber"),
    whatsappMessage: formData.get("whatsappMessage"),
    email: formData.get("email"),
    address: formData.get("address"),
    businessHours: formData.get("businessHours"),
    founderName: formData.get("founderName"),
    founderDesignation: formData.get("founderDesignation"),
    contactReceiverEmail: formData.get("contactReceiverEmail"),
    instagram: formData.get("instagram"),
    facebook: formData.get("facebook"),
    youtube: formData.get("youtube"),
    linkedin: formData.get("linkedin"),
    twitter: formData.get("twitter"),
    maintenanceMessage: formData.get("maintenanceMessage"),
  });

  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const v = parsed.data;
  const settings = await siteSettingsCollection();
  const now = new Date();

  await settings.updateOne(
    { _id: "site" },
    {
      $set: {
        brandName: v.brandName ? sanitizeText(v.brandName, 120) : null,
        phone: v.phone ? sanitizeText(v.phone, 20) : null,
        whatsappNumber: v.whatsappNumber ? sanitizeText(v.whatsappNumber, 20) : null,
        whatsappMessage: v.whatsappMessage ? sanitizeText(v.whatsappMessage, 500) : null,
        email: v.email ?? null,
        address: v.address ? sanitizeText(v.address, 300) : null,
        businessHours: v.businessHours ? sanitizeText(v.businessHours, 150) : null,
        founderName: v.founderName ? sanitizeText(v.founderName, 120) : null,
        founderDesignation: v.founderDesignation ? sanitizeText(v.founderDesignation, 120) : null,
        contactReceiverEmail: v.contactReceiverEmail ?? null,
        socialLinks: {
          instagram: v.instagram ?? null,
          facebook: v.facebook ?? null,
          youtube: v.youtube ?? null,
          linkedin: v.linkedin ?? null,
          twitter: v.twitter ?? null,
        },
        maintenanceMessage: v.maintenanceMessage ? sanitizeText(v.maintenanceMessage, 300) : null,
        updatedAt: now,
        updatedBy: new ObjectId(session.user.id),
      },
      $setOnInsert: { founderPortrait: null },
    },
    { upsert: true },
  );

  await logAdminAction({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "SETTINGS_UPDATED",
    targetType: "settings",
    targetId: "site",
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

/**
 * Called directly (not through a `<form>`) once `/api/upload/site` has
 * returned Cloudinary metadata for an already-uploaded founder portrait. The
 * previous portrait, if any, is only deleted after the new one is saved.
 */
export async function setFounderPortrait(image: CloudinaryImageRef): Promise<void> {
  const session = await requireAdmin();

  if (!isOwnedPublicId(image.publicId, CLOUDINARY_FOLDERS.founder)) {
    throw new Error("Invalid image.");
  }

  const settings = await siteSettingsCollection();
  const now = new Date();
  const existing = await settings.findOne({ _id: "site" });

  await settings.updateOne(
    { _id: "site" },
    { $set: { founderPortrait: image, updatedAt: now, updatedBy: new ObjectId(session.user.id) } },
    { upsert: true },
  );

  if (existing?.founderPortrait?.publicId && existing.founderPortrait.publicId !== image.publicId) {
    await deleteImage(existing.founderPortrait.publicId);
  }

  revalidatePath("/admin/settings");
}
