import { z } from "zod";

/** Empty-string-tolerant optional text field — HTML forms send "" for a
 * blank input, not undefined, so schemas normalize it to undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().min(1, "Please enter your email.").email("Please enter a valid email address.").max(200),
  phone: optionalText(20),
  subject: optionalText(150),
  message: z.string().trim().min(1, "Please enter a message.").max(4000),
  /** Honeypot — a human never fills this in. */
  company: optionalText(200),
});
export type ContactInput = z.infer<typeof contactSchema>;

const imageRefSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1).max(300),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().min(1).max(20),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Please choose a star rating.").max(5),
  title: optionalText(120),
  text: z.string().trim().min(1, "Please write your review.").max(3000),
  images: z.array(imageRefSchema).max(4, "Up to 4 images.").optional().default([]),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const profileSchema = z.object({
  phone: optionalText(20),
  address: optionalText(300),
  city: optionalText(100),
  state: optionalText(100),
  postalCode: optionalText(20),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const enquiryStatusSchema = z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"]);
export const reviewStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]);
export const userRoleSchema = z.enum(["USER", "ADMIN"]);

export const adminNoteSchema = z.string().trim().max(500);

const optionalUrl = (max = 300) =>
  z
    .string()
    .trim()
    .max(max)
    .url("Enter a full URL, starting with https://")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

/** Backs the admin Settings page. Business/contact details only — see the
 * note above `SiteSettingsDoc` in `src/lib/db/schema.ts` for what this
 * deliberately does NOT cover. */
export const settingsSchema = z.object({
  brandName: optionalText(120),
  phone: optionalText(20),
  whatsappNumber: optionalText(20),
  whatsappMessage: optionalText(500),
  email: z
    .string()
    .trim()
    .max(200)
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  address: optionalText(300),
  businessHours: optionalText(150),
  founderName: optionalText(120),
  founderDesignation: optionalText(120),
  contactReceiverEmail: z
    .string()
    .trim()
    .max(200)
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  instagram: optionalUrl(),
  facebook: optionalUrl(),
  youtube: optionalUrl(),
  linkedin: optionalUrl(),
  twitter: optionalUrl(),
  maintenanceMessage: optionalText(300),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
