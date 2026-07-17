import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";
import { getCloudinaryConfig } from "@/lib/env";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

/** Kept narrow on purpose — no SVG (script injection risk) and no executables. */
export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const CLOUDINARY_FOLDERS = {
  profile: "himalaya-sparsh/profiles",
  review: "himalaya-sparsh/reviews",
  site: "himalaya-sparsh/site",
  founder: "himalaya-sparsh/founder",
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

/** Folders the admin Media page is allowed to browse, upload to and delete
 * from. Deliberately excludes `profile` and `review` — those images belong to
 * a user-owned record (a profile, a review) and are managed by deleting or
 * editing that record, never as loose files from the general media library. */
export const ADMIN_MEDIA_FOLDERS = [CLOUDINARY_FOLDERS.site, CLOUDINARY_FOLDERS.founder] as const;

/** Minimum pixel dimensions for admin-uploaded site/founder imagery — these
 * are used as hero and portrait imagery, so a thumbnail-sized upload would
 * visibly degrade the page it's placed on. Not applied to customer profile
 * or review photos, which have no such requirement. */
const MIN_ADMIN_IMAGE_DIMENSION = 400;

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
};

export class ImageValidationError extends Error {}

function assertValidImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new ImageValidationError(
      "Unsupported file type. Upload a JPEG, PNG or WebP image.",
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError("File is too large. The limit is 5MB.");
  }
  if (file.size === 0) {
    throw new ImageValidationError("The uploaded file is empty.");
  }
}

/**
 * Uploads a browser `File` straight to Cloudinary from the server — the
 * secret never leaves this process, so nothing but an authenticated request
 * to our own route handler can mint an upload.
 */
export async function uploadImage(
  file: File,
  folder: CloudinaryFolder,
): Promise<UploadedImage> {
  assertValidImageFile(file);
  ensureConfigured();

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }
        resolve(uploadResult);
      },
    );
    Readable.from(buffer).pipe(stream);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

/**
 * Best-effort delete for a replaced or abandoned asset. Never throws — a
 * failed cleanup should not fail the request that triggered it; an orphaned
 * Cloudinary asset costs storage, not correctness.
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Swallowed intentionally — see doc comment above.
  }
}

/** Guards against a client-supplied public ID pointing outside its own folder. */
export function isOwnedPublicId(publicId: string, folder: CloudinaryFolder): boolean {
  return (
    publicId.startsWith(`${folder}/`) && /^[A-Za-z0-9_\-/]+$/.test(publicId)
  );
}

/** True when a public ID sits inside one of the admin-manageable media folders. */
export function isAdminManagedPublicId(publicId: string): boolean {
  return ADMIN_MEDIA_FOLDERS.some((folder) => isOwnedPublicId(publicId, folder));
}

/**
 * Overwrites an existing asset in place — same public ID, same URL — rather
 * than minting a new one. Used by the admin Media "Replace" action so a
 * founder-portrait or site image already referenced elsewhere never has to
 * have that reference updated.
 */
export async function replaceImage(
  file: File,
  existingPublicId: string,
): Promise<UploadedImage> {
  assertValidImageFile(file);
  ensureConfigured();

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: existingPublicId,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }
        resolve(uploadResult);
      },
    );
    Readable.from(buffer).pipe(stream);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

/**
 * Enforces a minimum pixel size for admin site/founder uploads, checked
 * against the dimensions Cloudinary reports back after the upload (there is
 * no reliable way to know an image's pixel size before it has been decoded).
 * Deletes the just-uploaded asset and throws if it's too small, so a
 * rejected upload never leaves an orphaned file behind.
 */
export async function assertMinAdminImageDimensions(image: UploadedImage): Promise<void> {
  if (image.width >= MIN_ADMIN_IMAGE_DIMENSION && image.height >= MIN_ADMIN_IMAGE_DIMENSION) {
    return;
  }
  await deleteImage(image.publicId);
  throw new ImageValidationError(
    `Image is too small. Both sides must be at least ${MIN_ADMIN_IMAGE_DIMENSION}px.`,
  );
}

export type CloudinaryListedAsset = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: string;
};

/** Lists every image whose public ID sits under `folder`, newest first. */
export async function listImages(folder: CloudinaryFolder): Promise<CloudinaryListedAsset[]> {
  ensureConfigured();
  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: "image",
    prefix: `${folder}/`,
    max_results: 200,
  });

  type CloudinaryResource = {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    created_at: string;
  };

  return (result.resources as CloudinaryResource[])
    .map((resource) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      bytes: resource.bytes,
      createdAt: resource.created_at,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
