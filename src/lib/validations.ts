import { z } from "zod";

import { isSafeImageSrc } from "@/lib/image-safety";

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "يرجى رفع صورة أولاً.")
  .refine(
    (value) => isSafeImageSrc(value),
    "رابط الصورة غير صالح.",
  );

const sourceLinkSchema = z.object({
  title: z.string().trim().min(2, "أضف عنوانًا مختصرًا للمصدر."),
  url: z.url("رابط المصدر غير صالح."),
});

export const signInSchema = z.object({
  email: z.email("يرجى إدخال بريد إلكتروني صالح."),
  password: z.string().min(8, "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل."),
});

export const userManagementSchema = z.object({
  userId: z.string().optional(),
  name: z.string().trim().min(2, "اسم المستخدم مطلوب."),
  email: z.email("يرجى إدخال بريد إلكتروني صالح.").transform((value) =>
    value.toLowerCase(),
  ),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "WRITER", "READER"]),
  isActive: z.boolean(),
  password: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .pipe(z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.").optional()),
});

export const userStatusSchema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
});

export const writerApplicationSchema = z.object({
  name: z.string().min(3, "الاسم مطلوب."),
  email: z.email("يرجى إدخال بريد صحيح."),
  bio: z.string().min(40, "يجب أن تكون النبذة أكثر تفصيلاً."),
  specialty: z.string().min(2, "يرجى تحديد التخصص."),
  writingSamples: z
    .array(z.url("يجب أن يكون كل رابط صالحًا."))
    .min(1, "أضف نموذج كتابة واحدًا على الأقل.")
    .max(5, "الحد الأقصى خمسة نماذج."),
  socialLinks: z
    .array(
      z.object({
        label: z.string().min(2),
        url: z.url("يرجى إدخال رابط صالح."),
      }),
    )
    .max(5, "الحد الأقصى خمسة روابط اجتماعية."),
});

export const categorySchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(2, "اسم القسم مطلوب."),
  slug: z.string().trim().optional(),
  description: z.string().min(10, "الوصف مطلوب."),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "اختر لونًا صحيحًا."),
});

export const tagSchema = z.object({
  tagId: z.string().optional(),
  name: z.string().min(2, "اسم الوسم مطلوب."),
  slug: z.string().trim().optional(),
});

export const articleSchema = z.object({
  articleId: z.string().optional(),
  title: z.string().min(6, "عنوان المقال يجب أن يكون أوضح."),
  subtitle: z.string().optional(),
  slug: z.string().min(3, "الرابط المختصر مطلوب."),
  excerpt: z.string().min(30, "أضف ملخصًا معرفيًا للمقال."),
  coverImage: imageUrlSchema,
  categoryId: z.string().min(1, "اختر قسمًا."),
  tagIds: z.array(z.string()).min(1, "اختر وسمًا واحدًا على الأقل."),
  quote: z.string().optional(),
  contentHtml: z.string().min(80, "محتوى المقال قصير جدًا."),
  sources: z
    .array(sourceLinkSchema)
    .max(8, "الحد الأقصى ثمانية مصادر.")
    .default([]),
  status: z.enum([
    "DRAFT",
    "PENDING_REVIEW",
    "NEEDS_REVISION",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "REJECTED",
  ]),
  scheduledFor: z.string().optional(),
});

export const commentSchema = z.object({
  articleId: z.string().min(1),
  content: z
    .string()
    .min(5, "التعليق قصير جدًا.")
    .max(1000, "التعليق طويل للغاية."),
});

export const settingSchema = z.object({
  key: z.string().min(2),
  label: z.string().min(2),
  description: z.string().optional(),
  value: z.record(z.string(), z.any()),
  isPublic: z.boolean(),
});

export const homepageBannerSchema = z.object({
  isActive: z.boolean(),
  eyebrow: z.string().trim().max(80, "النص التعريفي طويل جدًا.").optional(),
  title: z.string().trim().min(6, "عنوان البنر مطلوب."),
  description: z.string().trim().min(20, "أضف وصفًا أوفى للبنر."),
  imageUrl: imageUrlSchema,
  ctaLabel: z.string().trim().min(2, "نص الزر مطلوب."),
  ctaHref: z.string().trim().min(1, "رابط الزر مطلوب."),
});
