"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { requireSession } from "@/lib/admin";
import { customerProfilesCollection, type CloudinaryImageRef } from "@/lib/db/schema";
import { CLOUDINARY_FOLDERS, deleteImage, isOwnedPublicId } from "@/lib/cloudinary";
import { profileSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/request";

export type ProfileActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Bound to a `<form action>` via `useActionState` in `ProfileForm`. */
export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
  });

  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { phone, address, city, state, postalCode } = parsed.data;
  const profiles = await customerProfilesCollection();
  const now = new Date();
  const userId = new ObjectId(session.user.id);

  await profiles.updateOne(
    { userId },
    {
      $set: {
        phone: phone ? sanitizeText(phone, 20) : null,
        address: address ? sanitizeText(address, 300) : null,
        city: city ? sanitizeText(city, 100) : null,
        state: state ? sanitizeText(state, 100) : null,
        postalCode: postalCode ? sanitizeText(postalCode, 20) : null,
        updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), userId, image: null, createdAt: now },
    },
    { upsert: true },
  );

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Called directly (not through a `<form>`) from `ProfileImageUploader` once
 * `/api/upload/profile` has returned Cloudinary metadata for an already
 * validated, already-uploaded image. The previous image, if any, is only
 * deleted after the new one is safely saved.
 */
export async function setProfileImage(image: CloudinaryImageRef): Promise<void> {
  const session = await requireSession();

  if (!isOwnedPublicId(image.publicId, CLOUDINARY_FOLDERS.profile)) {
    throw new Error("Invalid image.");
  }

  const profiles = await customerProfilesCollection();
  const userId = new ObjectId(session.user.id);
  const now = new Date();

  const existing = await profiles.findOne({ userId });

  await profiles.updateOne(
    { userId },
    {
      $set: { image, updatedAt: now },
      $setOnInsert: {
        _id: new ObjectId(),
        userId,
        phone: null,
        address: null,
        city: null,
        state: null,
        postalCode: null,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  if (existing?.image?.publicId && existing.image.publicId !== image.publicId) {
    await deleteImage(existing.image.publicId);
  }

  revalidatePath("/dashboard");
}
