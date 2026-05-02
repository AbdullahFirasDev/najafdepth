"use server";

import { ArticleStatus, Prisma, RoleName, UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { sendPlatformEmail } from "@/lib/email";
import {
  removeArticleFromSearchIndex,
  syncArticleToSearchIndex,
} from "@/lib/meilisearch";
import {
  canAssignRole,
  canDeleteArticle,
  canDeleteTaxonomy,
  canEditArticle,
  canManageComments,
  canManageFeaturedArticles,
  canManageSystemSettings,
  canManageTaxonomy,
  canManageUserRole,
  canManageUsers,
  canModerateContent,
  canPublish,
  canReviewWriterApplications,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOptionalEnv } from "@/lib/env";
import { estimateReadingTime, sanitizeArticleHtml, toSlug } from "@/lib/utils";
import {
  articleSchema,
  categorySchema,
  settingSchema,
  tagSchema,
  userManagementSchema,
  userStatusSchema,
  writerApplicationSchema,
} from "@/lib/validations";
import type { RoleKey } from "@/types";

type ActionResult = {
  success: boolean;
  message: string;
  errors?: string[];
  data?: unknown;
};

type ReviewableArticleStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "NEEDS_REVISION"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "REJECTED";

const roleValues: RoleKey[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "WRITER",
  "READER",
];

function revalidateDashboardPaths(...paths: string[]) {
  [
    "/dashboard",
    "/dashboard/articles",
    "/dashboard/analytics",
    "/",
    ...paths,
  ].forEach((path) => revalidatePath(path));
}

async function getRoleId(role: RoleKey) {
  const roleRecord = await prisma.role.findUnique({
    where: { name: role as RoleName },
    select: { id: true },
  });

  return roleRecord?.id ?? null;
}

async function createAuditLog(input: {
  action: string;
  entity: string;
  entityId?: string;
  changes?: unknown;
}) {
  try {
    const session = await auth();
    const requestHeaders = await headers();
    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      requestHeaders.get("x-real-ip") ||
      "";
    const ipHash = ip
      ? createHash("sha256")
          .update(`${ip}:${getOptionalEnv("AUDIT_IP_HASH_SALT") ?? "alkindi"}`)
          .digest("hex")
      : undefined;

    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        changes: input.changes
          ? JSON.parse(JSON.stringify(input.changes))
          : undefined,
        actorId: session?.user.id,
        ipHash,
        userAgent: requestHeaders.get("user-agent")?.slice(0, 500),
      },
    });
  } catch {
    // Audit logging must never block the primary action.
  }
}

async function syncArticleIndex(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      category: true,
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!article) {
    return;
  }

  if (article.status === "PUBLISHED") {
    await syncArticleToSearchIndex(article);
    return;
  }

  await removeArticleFromSearchIndex(article.id);
}

function revalidateArticlePages(slug: string, articleId?: string) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/articles");
  revalidatePath("/search");
  revalidatePath(`/articles/${slug}`);

  if (articleId) {
    revalidatePath(`/dashboard/articles/${articleId}/edit`);
  }
}

export async function subscribeToNewsletter(input: {
  email: string;
  name?: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    return { success: false, message: "يرجى إدخال البريد الإلكتروني." };
  }

  const rate = checkRateLimit(`newsletter:${email}`, 4, 60_000);
  if (!rate.allowed) {
    return {
      success: false,
      message: "تم تجاوز عدد المحاولات المسموح، حاول بعد قليل.",
    };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true, name: input.name },
    create: { email, name: input.name },
  });

  revalidatePath("/");
  return { success: true, message: "تم الاشتراك في النشرة البريدية بنجاح." };
}

export async function submitWriterApplication(input: {
  name: string;
  email: string;
  bio: string;
  specialty: string;
  writingSamples: string[];
  socialLinks: { label: string; url: string }[];
}): Promise<ActionResult> {
  const parsed = writerApplicationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "تعذر إرسال الطلب. يرجى مراجعة الحقول.",
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const rate = checkRateLimit(
    `writer-application:${parsed.data.email}`,
    3,
    60_000,
  );
  if (!rate.allowed) {
    return {
      success: false,
      message: "تم تجاوز عدد الطلبات المسموح، حاول لاحقًا.",
    };
  }

  const currentApplication = await prisma.writerApplication.findUnique({
    where: { email: parsed.data.email },
    select: { status: true },
  });

  if (currentApplication?.status === "APPROVED") {
    return {
      success: false,
      message: "تمت الموافقة على هذا البريد مسبقًا ككاتب.",
    };
  }

  const application = await prisma.writerApplication.upsert({
    where: { email: parsed.data.email },
    update: {
      name: parsed.data.name,
      bio: parsed.data.bio,
      specialty: parsed.data.specialty,
      writingSamples: parsed.data.writingSamples,
      socialLinks: parsed.data.socialLinks,
      status: "PENDING",
      reviewNotes: null,
      requestedChanges: null,
    },
    create: {
      name: parsed.data.name,
      email: parsed.data.email,
      bio: parsed.data.bio,
      specialty: parsed.data.specialty,
      writingSamples: parsed.data.writingSamples,
      socialLinks: parsed.data.socialLinks,
    },
  });

  await createAuditLog({
    action: "writer_application_submitted",
    entity: "WriterApplication",
    entityId: application.id,
    changes: parsed.data,
  });

  revalidatePath("/apply");
  revalidatePath("/dashboard/writer-requests");
  revalidatePath("/dashboard/users");

  return { success: true, message: "تم إرسال طلب الانضمام إلى الكتّاب بنجاح." };
}

export async function upsertArticle(input: {
  articleId?: string;
  title: string;
  subtitle?: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  tagIds: string[];
  quote?: string;
  contentHtml: string;
  sources?: { title: string; url: string }[];
  status:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "NEEDS_REVISION"
    | "APPROVED"
    | "SCHEDULED"
    | "PUBLISHED"
    | "REJECTED";
  scheduledFor?: string;
}): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, message: "تحتاج إلى تسجيل الدخول أولاً." };
  }

  if (session?.user.role === "READER") {
    return { success: false, message: "لا تملك صلاحية إدارة المقالات." };
  }

  const parsed = articleSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "تعذر حفظ المقال. يرجى مراجعة الحقول.",
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const safeSlug = toSlug(parsed.data.slug || parsed.data.title);
  const isPublisher = canPublish(session);

  const existingArticle = parsed.data.articleId
    ? await prisma.article.findUnique({
        where: { id: parsed.data.articleId },
        select: {
          id: true,
          slug: true,
          authorId: true,
          reviewerId: true,
          publishedAt: true,
          status: true,
          reviewNotes: true,
        },
      })
    : null;

  if (parsed.data.articleId && !existingArticle) {
    return { success: false, message: "المقال المطلوب تعديله غير موجود." };
  }

  if (
    existingArticle &&
    !canEditArticle(session, existingArticle)
  ) {
    return { success: false, message: "لا يمكنك تعديل مقال لا تملكه." };
  }

  const slugOwner = await prisma.article.findUnique({
    where: { slug: safeSlug },
    select: { id: true },
  });

  if (slugOwner && slugOwner.id !== existingArticle?.id) {
    return { success: false, message: "هذا الرابط المختصر مستخدم بالفعل." };
  }

  const uniqueTagIds = Array.from(new Set(parsed.data.tagIds));
  const [categoryExists, tagsCount] = await Promise.all([
    prisma.category.count({ where: { id: parsed.data.categoryId } }),
    prisma.tag.count({ where: { id: { in: uniqueTagIds } } }),
  ]);

  if (!categoryExists) {
    return { success: false, message: "القسم المحدد غير موجود." };
  }

  if (tagsCount !== uniqueTagIds.length) {
    return { success: false, message: "أحد الوسوم المحددة غير موجود." };
  }

  const finalStatus = isPublisher
    ? parsed.data.status
    : parsed.data.status === "DRAFT"
      ? "DRAFT"
      : "PENDING_REVIEW";
  const cleanContentHtml = sanitizeArticleHtml(parsed.data.contentHtml);
  const scheduledFor =
    finalStatus === "SCHEDULED" && parsed.data.scheduledFor
      ? new Date(parsed.data.scheduledFor)
      : null;

  if (finalStatus === "SCHEDULED") {
    if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) {
      return { success: false, message: "يرجى اختيار تاريخ نشر صالح." };
    }

    if (scheduledFor <= new Date()) {
      return { success: false, message: "يجب أن يكون تاريخ النشر المجدول في المستقبل." };
    }
  }
  const publishedAt =
    finalStatus === "PUBLISHED"
      ? (existingArticle?.publishedAt ?? new Date())
      : null;
  const sources =
    parsed.data.sources && parsed.data.sources.length
      ? parsed.data.sources.map((source) => ({
          title: source.title.trim(),
          url: source.url.trim(),
        }))
      : null;
  const normalizedSources = sources
    ? (sources as Prisma.InputJsonValue)
    : Prisma.DbNull;

  const baseArticleData = {
    title: parsed.data.title.trim(),
    subtitle: parsed.data.subtitle?.trim() || null,
    slug: safeSlug,
    excerpt: parsed.data.excerpt.trim(),
    coverImage: parsed.data.coverImage.trim(),
    categoryId: parsed.data.categoryId,
    quote: parsed.data.quote?.trim() || null,
    contentHtml: cleanContentHtml,
    sources: normalizedSources,
    status: finalStatus,
    readingTimeMinutes: estimateReadingTime(cleanContentHtml),
    scheduledFor,
    publishedAt,
    reviewerId: isPublisher
      ? session.user.id
      : (existingArticle?.reviewerId ?? null),
    reviewNotes: existingArticle?.reviewNotes ?? null,
  };

  const updateArticleData = {
    ...baseArticleData,
    tags: {
      deleteMany: {},
      create: uniqueTagIds.map((tagId) => ({ tagId })),
    },
  };

  const createArticleData = {
    ...baseArticleData,
    tags: {
      create: uniqueTagIds.map((tagId) => ({ tagId })),
    },
  };

  const article = existingArticle
    ? await prisma.article.update({
        where: { id: existingArticle.id },
        data: updateArticleData,
      })
    : await prisma.article.create({
        data: {
          ...createArticleData,
          authorId: session.user.id,
        },
      });

  if (article.status !== "PUBLISHED") {
    await prisma.article.update({
      where: { id: article.id },
      data: { featured: false, featuredRank: null },
    });
  }

  await syncArticleIndex(article.id);

  await createAuditLog({
    action: existingArticle ? "article_updated" : "article_created",
    entity: "Article",
    entityId: article.id,
    changes: { ...parsed.data, slug: safeSlug, finalStatus },
  });

  revalidateArticlePages(article.slug, article.id);

  return {
    success: true,
    message: existingArticle
      ? "تم تحديث المقال بنجاح."
      : "تم إنشاء المقال بنجاح.",
  };
}

export async function reviewArticle(input: {
  articleId: string;
  status: ReviewableArticleStatus;
  notes?: string;
}): Promise<ActionResult> {
  const session = await auth();

  if (!canModerateContent(session)) {
    return { success: false, message: "لا تملك صلاحية مراجعة المقالات." };
  }

  const article = await prisma.article.findUnique({
    where: { id: input.articleId },
    select: {
      id: true,
      slug: true,
      publishedAt: true,
      featured: true,
      featuredRank: true,
    },
  });

  if (!article) {
    return { success: false, message: "المقال غير موجود." };
  }

  if (!Object.values(ArticleStatus).includes(input.status as ArticleStatus)) {
    return { success: false, message: "حالة المقال غير صالحة." };
  }

  if (input.status === "SCHEDULED") {
    return {
      success: false,
      message: "استخدم نموذج تحرير المقال لتحديد تاريخ نشر مجدول صالح.",
    };
  }

  const shouldPublish = input.status === "PUBLISHED";
  const shouldUnfeature = article.featured && !shouldPublish;

  const reviewedArticle = await prisma.article.update({
    where: { id: input.articleId },
    data: {
      status: input.status,
      reviewerId: session?.user.id,
      reviewNotes: input.notes?.trim() || null,
      scheduledFor: null,
      publishedAt: shouldPublish ? (article.publishedAt ?? new Date()) : null,
      featured: shouldUnfeature ? false : undefined,
      featuredRank: shouldUnfeature ? null : undefined,
    },
  });

  await syncArticleIndex(reviewedArticle.id);

  await createAuditLog({
    action: "article_reviewed",
    entity: "Article",
    entityId: reviewedArticle.id,
    changes: input,
  });

  revalidateArticlePages(reviewedArticle.slug, reviewedArticle.id);

  return { success: true, message: "تم تحديث حالة المقال بنجاح." };
}

export async function setFeaturedArticle(input: {
  articleId: string;
  featured: boolean;
}): Promise<ActionResult> {
  const session = await auth();
  if (!canManageFeaturedArticles(session)) {
    return { success: false, message: "لا تملك صلاحية اختيار المقال المميز." };
  }

  const article = await prisma.article.findUnique({
    where: { id: input.articleId },
    select: { id: true, slug: true, status: true },
  });

  if (!article) {
    return { success: false, message: "المقال غير موجود." };
  }

  if (input.featured && article.status !== "PUBLISHED") {
    return { success: false, message: "لا يمكن تمييز مقال غير منشور." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.article.updateMany({
      where: { OR: [{ featured: true }, { featuredRank: 1 }] },
      data: { featured: false, featuredRank: null },
    });

    if (input.featured) {
      await tx.article.update({
        where: { id: article.id },
        data: { featured: true, featuredRank: 1 },
      });
    }
  });

  await createAuditLog({
    action: input.featured ? "article_featured" : "article_unfeatured",
    entity: "Article",
    entityId: article.id,
    changes: input,
  });

  revalidateArticlePages(article.slug, article.id);
  return {
    success: true,
    message: input.featured
      ? "تم تعيين المقال كمميز بنجاح."
      : "تم إلغاء تمييز المقال بنجاح.",
  };
}

export async function deleteArticle(articleId: string): Promise<ActionResult> {
  const session = await auth();

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      slug: true,
      authorId: true,
      status: true,
    },
  });

  if (!article) {
    return { success: false, message: "المقال غير موجود." };
  }

  if (!canDeleteArticle(session, article)) {
    return { success: false, message: "لا تملك صلاحية حذف هذا المقال." };
  }

  await prisma.article.delete({ where: { id: article.id } });
  await removeArticleFromSearchIndex(article.id);

  await createAuditLog({
    action: "article_deleted",
    entity: "Article",
    entityId: article.id,
  });

  revalidateDashboardPaths(`/articles/${article.slug}`, "/search");
  return { success: true, message: "تم حذف المقال بنجاح." };
}

export async function toggleArticleLike(slug: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "سجل الدخول أولاً لتسجيل الإعجاب." };
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (!article) {
    return { success: false, message: "المقال غير موجود." };
  }

  const existing = await prisma.articleLike.findUnique({
    where: {
      userId_articleId: {
        userId: session.user.id,
        articleId: article.id,
      },
    },
  });

  const nextCount = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.articleLike.delete({
        where: {
          userId_articleId: {
            userId: session.user.id,
            articleId: article.id,
          },
        },
      });
      const updated = await tx.article.update({
        where: { id: article.id },
        data: { likesCount: { decrement: 1 } },
        select: { likesCount: true },
      });
      return Math.max(0, updated.likesCount);
    }

    await tx.articleLike.create({
      data: {
        userId: session.user.id,
        articleId: article.id,
      },
    });
    const updated = await tx.article.update({
      where: { id: article.id },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    });
    return updated.likesCount;
  });

  revalidateArticlePages(article.slug, article.id);
  revalidatePath("/dashboard/analytics");
  return {
    success: true,
    message: existing ? "تم إلغاء الإعجاب." : "تم تسجيل الإعجاب.",
    data: { liked: !existing, likesCount: nextCount },
  };
}

export async function toggleArticleBookmark(
  slug: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "سجل الدخول أولاً لحفظ المقال." };
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (!article) {
    return { success: false, message: "المقال غير موجود." };
  }

  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_articleId: {
        userId: session.user.id,
        articleId: article.id,
      },
    },
  });

  const nextCount = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.bookmark.delete({
        where: {
          userId_articleId: {
            userId: session.user.id,
            articleId: article.id,
          },
        },
      });
      const updated = await tx.article.update({
        where: { id: article.id },
        data: { bookmarksCount: { decrement: 1 } },
        select: { bookmarksCount: true },
      });
      return Math.max(0, updated.bookmarksCount);
    }

    await tx.bookmark.create({
      data: {
        userId: session.user.id,
        articleId: article.id,
      },
    });
    const updated = await tx.article.update({
      where: { id: article.id },
      data: { bookmarksCount: { increment: 1 } },
      select: { bookmarksCount: true },
    });
    return updated.bookmarksCount;
  });

  revalidateArticlePages(article.slug, article.id);
  return {
    success: true,
    message: existing ? "تم إلغاء حفظ المقال." : "تم حفظ المقال.",
    data: { bookmarked: !existing, bookmarksCount: nextCount },
  };
}

export async function upsertCategory(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!canManageTaxonomy(session)) {
    return { success: false, message: "لا تملك صلاحية تعديل الأقسام." };
  }

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى مراجعة بيانات القسم.",
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const safeSlug = toSlug(parsed.data.slug || parsed.data.name);

  if (!safeSlug) {
    return { success: false, message: "تعذر توليد رابط مختصر صالح من اسم القسم." };
  }

  const existingCategory = parsed.data.categoryId
    ? await prisma.category.findUnique({
        where: { id: parsed.data.categoryId },
        select: { id: true, slug: true },
      })
    : null;

  if (parsed.data.categoryId && !existingCategory) {
    return { success: false, message: "القسم المطلوب تعديله غير موجود." };
  }

  const slugOwner = await prisma.category.findUnique({
    where: { slug: safeSlug },
    select: { id: true },
  });

  if (slugOwner && slugOwner.id !== existingCategory?.id) {
    return {
      success: false,
      message: "هذا الرابط المختصر مستخدم بالفعل. اختر رابطًا آخر.",
    };
  }

  const data = {
    name: parsed.data.name.trim(),
    slug: safeSlug,
    description: parsed.data.description.trim(),
    color: parsed.data.color,
  };

  const category = existingCategory
    ? await prisma.category.update({
        where: { id: existingCategory.id },
        data,
      })
    : await prisma.category.create({
        data,
      });

  await createAuditLog({
    action: existingCategory ? "category_updated" : "category_created",
    entity: "Category",
    entityId: category.id,
    changes: { ...data, previousSlug: existingCategory?.slug },
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/categories/${category.slug}`);
  if (existingCategory?.slug && existingCategory.slug !== category.slug) {
    revalidatePath(`/categories/${existingCategory.slug}`);
  }
  return { success: true, message: "تم حفظ القسم بنجاح." };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const session = await auth();
  if (!canDeleteTaxonomy(session)) {
    return { success: false, message: "لا تملك صلاحية حذف الأقسام." };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      slug: true,
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  if (!category) {
    return { success: false, message: "القسم غير موجود." };
  }

  if (category._count.articles > 0) {
    return {
      success: false,
      message: "This category cannot be deleted because it contains articles.",
    };
  }

  await prisma.category.delete({
    where: { id: category.id },
  });

  await createAuditLog({
    action: "category_deleted",
    entity: "Category",
    entityId: category.id,
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/categories/${category.slug}`);
  return { success: true, message: "تم حذف القسم بنجاح." };
}

export async function upsertTag(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!canManageTaxonomy(session)) {
    return { success: false, message: "لا تملك صلاحية تعديل الوسوم." };
  }

  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى مراجعة بيانات الوسم.",
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const safeSlug = toSlug(parsed.data.slug || parsed.data.name);
  if (!safeSlug) {
    return { success: false, message: "تعذر توليد رابط مختصر صالح من اسم الوسم." };
  }

  const existingTag = parsed.data.tagId
    ? await prisma.tag.findUnique({
        where: { id: parsed.data.tagId },
        select: { id: true, slug: true },
      })
    : null;

  if (parsed.data.tagId && !existingTag) {
    return { success: false, message: "الوسم المطلوب تعديله غير موجود." };
  }

  const slugOwner = await prisma.tag.findUnique({
    where: { slug: safeSlug },
    select: { id: true },
  });

  if (slugOwner && slugOwner.id !== existingTag?.id) {
    return {
      success: false,
      message: "هذا الرابط المختصر مستخدم بالفعل. اختر رابطًا آخر.",
    };
  }

  const data = {
    name: parsed.data.name.trim(),
    slug: safeSlug,
  };

  const tag = existingTag
    ? await prisma.tag.update({
        where: { id: existingTag.id },
        data,
      })
    : await prisma.tag.create({ data });

  await createAuditLog({
    action: existingTag ? "tag_updated" : "tag_created",
    entity: "Tag",
    entityId: tag.id,
    changes: { ...data, previousSlug: existingTag?.slug },
  });

  revalidatePath("/dashboard/tags");
  revalidatePath("/");
  revalidatePath("/search");
  return { success: true, message: "تم حفظ الوسم بنجاح." };
}

export async function deleteTag(tagId: string): Promise<ActionResult> {
  const session = await auth();
  if (!canDeleteTaxonomy(session)) {
    return { success: false, message: "لا تملك صلاحية حذف الوسوم." };
  }

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: {
      id: true,
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  if (!tag) {
    return { success: false, message: "الوسم غير موجود." };
  }

  if (tag._count.articles > 0) {
    return {
      success: false,
      message: "لا يمكن حذف هذا الوسم لأنه مرتبط بمقالات.",
    };
  }

  await prisma.tag.delete({ where: { id: tag.id } });

  await createAuditLog({
    action: "tag_deleted",
    entity: "Tag",
    entityId: tag.id,
  });

  revalidatePath("/dashboard/tags");
  revalidatePath("/");
  revalidatePath("/search");
  return { success: true, message: "تم حذف الوسم بنجاح." };
}

export async function updateWriterApplicationStatus(input: {
  applicationId: string;
  status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  notes?: string;
}): Promise<ActionResult> {
  const session = await auth();

  if (!canReviewWriterApplications(session)) {
    return { success: false, message: "لا تملك صلاحية مراجعة طلبات الكتّاب." };
  }

  const application = await prisma.writerApplication.findUnique({
    where: { id: input.applicationId },
  });

  if (!application) {
    return { success: false, message: "لم يتم العثور على الطلب." };
  }

  if (["APPROVED", "REJECTED"].includes(application.status)) {
    return { success: false, message: "تمت معالجة هذا الطلب بالفعل." };
  }

  let approvedUserId = application.approvedUserId ?? undefined;
  let emailMessage = "تم تحديث حالة طلبك في العمق النجفي.";

  if (input.status === "APPROVED" && !application.approvedUserId) {
    const writerRole = await prisma.role.findUnique({
      where: { name: "WRITER" },
    });

    if (writerRole) {
      const temporaryPassword = `Najaf!${randomUUID().slice(0, 8)}`;
      const existingUser = await prisma.user.findUnique({
        where: { email: application.email },
        select: { id: true, passwordHash: true },
      });
      const user = await prisma.user.upsert({
        where: { email: application.email },
        update: {
          status: UserStatus.ACTIVE,
          isActive: true,
          roleId: writerRole.id,
          specialty: application.specialty,
          bio: application.bio,
          passwordHash: existingUser?.passwordHash
            ? undefined
            : await hash(temporaryPassword, 12),
        },
        create: {
          email: application.email,
          name: application.name,
          roleId: writerRole.id,
          specialty: application.specialty,
          bio: application.bio,
          isActive: true,
          status: UserStatus.ACTIVE,
          passwordHash: await hash(temporaryPassword, 12),
        },
      });

      approvedUserId = user.id;
      emailMessage = existingUser?.passwordHash
        ? "تمت الموافقة على طلبك وتم ربط حسابك الحالي بدور الكاتب."
        : `تمت الموافقة على طلبك، ويمكنك تسجيل الدخول مؤقتًا بكلمة المرور: ${temporaryPassword}`;
    }
  }

  await prisma.writerApplication.update({
    where: { id: input.applicationId },
    data: {
      status: input.status,
      reviewerId: session?.user.id,
      reviewNotes: input.notes,
      requestedChanges:
        input.status === "CHANGES_REQUESTED" ? input.notes : null,
      approvedUserId,
    },
  });

  try {
    await sendPlatformEmail({
    to: application.email,
    subject: "تحديث طلب الكتابة في العمق النجفي",
    html: `<div dir="rtl"><p>${emailMessage}</p><p>${input.notes ?? ""}</p></div>`,
    });
  } catch {
    // Email delivery should not roll back a completed moderation decision.
  }

  await createAuditLog({
    action: "writer_application_reviewed",
    entity: "WriterApplication",
    entityId: application.id,
    changes: input,
  });

  revalidatePath("/dashboard/writer-requests");
  revalidatePath("/dashboard/users");
  return { success: true, message: "تم تحديث حالة طلب الكاتب." };
}

export async function moderateComment(input: {
  commentId: string;
  status: "APPROVED" | "REJECTED" | "SPAM";
}): Promise<ActionResult> {
  const session = await auth();
  if (!canManageComments(session)) {
    return { success: false, message: "لا تملك صلاحية مراجعة التعليقات." };
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id: input.commentId },
    select: { id: true },
  });

  if (!existingComment) {
    return { success: false, message: "التعليق غير موجود." };
  }

  const comment = await prisma.comment.update({
    where: { id: existingComment.id },
    data: { status: input.status },
    include: { article: { select: { slug: true } } },
  });

  await createAuditLog({
    action: "comment_moderated",
    entity: "Comment",
    entityId: comment.id,
    changes: input,
  });

  revalidatePath("/dashboard/comments");
  revalidatePath(`/articles/${comment.article.slug}`);
  revalidatePath("/dashboard");
  return { success: true, message: "تم تحديث حالة التعليق." };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!canManageComments(session)) {
    return { success: false, message: "لا تملك صلاحية حذف التعليقات." };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, article: { select: { slug: true } } },
  });

  if (!comment) {
    return { success: false, message: "التعليق غير موجود." };
  }

  await prisma.comment.delete({ where: { id: commentId } });

  await createAuditLog({
    action: "comment_deleted",
    entity: "Comment",
    entityId: comment.id,
  });

  revalidatePath("/dashboard/comments");
  revalidatePath(`/articles/${comment.article.slug}`);
  revalidatePath("/dashboard");
  return { success: true, message: "تم حذف التعليق بنجاح." };
}

async function wouldAffectLastSuperAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });

  if (user?.role.name !== "SUPER_ADMIN") {
    return false;
  }

  const superAdmins = await prisma.user.count({
    where: {
      role: { name: "SUPER_ADMIN" },
      isActive: true,
      status: UserStatus.ACTIVE,
    },
  });

  return superAdmins <= 1;
}

export async function upsertUser(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!canManageUsers(session)) {
    return { success: false, message: "لا تملك صلاحية إدارة المستخدمين." };
  }

  const parsed = userManagementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "يرجى مراجعة بيانات المستخدم.",
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const targetRole = parsed.data.role as RoleKey;
  if (!roleValues.includes(targetRole)) {
    return { success: false, message: "الدور المحدد غير صالح." };
  }

  const existingUser = parsed.data.userId
    ? await prisma.user.findUnique({
        where: { id: parsed.data.userId },
        include: { role: true },
      })
    : null;

  if (parsed.data.userId && !existingUser) {
    return { success: false, message: "المستخدم غير موجود." };
  }

  if (
    existingUser &&
    !canManageUserRole(session, existingUser.role.name as RoleKey)
  ) {
    return { success: false, message: "لا يمكنك تعديل هذا المستخدم." };
  }

  if (!canAssignRole(session, targetRole, existingUser?.role.name as RoleKey)) {
    return { success: false, message: "لا يمكنك تعيين هذا الدور." };
  }

  if (
    existingUser &&
    existingUser.role.name === "SUPER_ADMIN" &&
    (targetRole !== "SUPER_ADMIN" || !parsed.data.isActive) &&
    (await wouldAffectLastSuperAdmin(existingUser.id))
  ) {
    return {
      success: false,
      message: "لا يمكن تعطيل أو تغيير دور آخر مدير أعلى في النظام.",
    };
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (emailOwner && emailOwner.id !== existingUser?.id) {
    return { success: false, message: "هذا البريد مستخدم من حساب آخر." };
  }

  if (!existingUser && !parsed.data.password) {
    return { success: false, message: "كلمة المرور مطلوبة عند إنشاء مستخدم جديد." };
  }

  const roleId = await getRoleId(targetRole);
  if (!roleId) {
    return { success: false, message: "الدور المحدد غير موجود في قاعدة البيانات." };
  }

  const passwordHash = parsed.data.password
    ? await hash(parsed.data.password, 12)
    : undefined;
  const status = parsed.data.isActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          roleId,
          isActive: parsed.data.isActive,
          status,
          passwordHash,
        },
      })
    : await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          roleId,
          isActive: parsed.data.isActive,
          status,
          passwordHash,
        },
      });

  await createAuditLog({
    action: existingUser ? "user_updated" : "user_created",
    entity: "User",
    entityId: user.id,
    changes: { ...parsed.data, password: undefined },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: existingUser
      ? "تم تحديث المستخدم بنجاح."
      : "تم إنشاء المستخدم بنجاح.",
  };
}

export async function setUserActive(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!canManageUsers(session)) {
    return { success: false, message: "لا تملك صلاحية إدارة المستخدمين." };
  }

  const parsed = userStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "بيانات حالة المستخدم غير صالحة." };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { role: true },
  });

  if (!user) {
    return { success: false, message: "المستخدم غير موجود." };
  }

  if (!canManageUserRole(session, user.role.name as RoleKey)) {
    return { success: false, message: "لا يمكنك تعديل هذا المستخدم." };
  }

  if (
    user.id === session?.user.id &&
    !parsed.data.isActive &&
    user.role.name !== "SUPER_ADMIN"
  ) {
    return { success: false, message: "لا يمكنك تعطيل حسابك الحالي." };
  }

  if (!parsed.data.isActive && (await wouldAffectLastSuperAdmin(user.id))) {
    return { success: false, message: "لا يمكن تعطيل آخر مدير أعلى في النظام." };
  }

  const nextStatus = parsed.data.isActive
    ? UserStatus.ACTIVE
    : UserStatus.SUSPENDED;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isActive: parsed.data.isActive,
      status: nextStatus,
    },
  });

  await createAuditLog({
    action: "user_active_changed",
    entity: "User",
    entityId: user.id,
    changes: { isActive: parsed.data.isActive, status: nextStatus },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return { success: true, message: "تم تحديث حالة المستخدم." };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!canManageUsers(session)) {
    return { success: false, message: "لا تملك صلاحية حذف المستخدمين." };
  }

  if (userId === session?.user.id) {
    return { success: false, message: "لا يمكنك حذف حسابك الحالي." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      _count: {
        select: {
          authoredArticles: true,
          reviewedArticles: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    return { success: false, message: "المستخدم غير موجود." };
  }

  if (!canManageUserRole(session, user.role.name as RoleKey)) {
    return { success: false, message: "لا يمكنك حذف هذا المستخدم." };
  }

  if (await wouldAffectLastSuperAdmin(user.id)) {
    return { success: false, message: "لا يمكن حذف آخر مدير أعلى في النظام." };
  }

  if (
    user._count.authoredArticles > 0 ||
    user._count.reviewedArticles > 0 ||
    user._count.comments > 0
  ) {
    return {
      success: false,
      message:
        "لا يمكن حذف هذا المستخدم لأنه مرتبط بمحتوى أو تعليقات. عطّل الحساب بدلاً من حذفه.",
    };
  }

  await prisma.user.delete({ where: { id: user.id } });

  await createAuditLog({
    action: "user_deleted",
    entity: "User",
    entityId: user.id,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return { success: true, message: "تم حذف المستخدم بنجاح." };
}

export async function toggleUserSuspension(
  userId: string,
): Promise<ActionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });
  if (!user) {
    return { success: false, message: "المستخدم غير موجود." };
  }

  return setUserActive({ userId, isActive: !user.isActive });
}

export async function upsertSetting(input: {
  key: string;
  label: string;
  description?: string;
  value: Record<string, unknown>;
  isPublic: boolean;
}): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId || !canManageSystemSettings(session)) {
    return { success: false, message: "لا تملك صلاحية تعديل الإعدادات." };
  }

  const parsed = settingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "يرجى مراجعة بيانات الإعداد." };
  }

  const setting = await prisma.setting.upsert({
    where: { key: parsed.data.key },
    update: {
      label: parsed.data.label,
      description: parsed.data.description,
      value: parsed.data.value,
      isPublic: parsed.data.isPublic,
      updatedById: userId,
    },
    create: {
      key: parsed.data.key,
      label: parsed.data.label,
      description: parsed.data.description,
      value: parsed.data.value,
      isPublic: parsed.data.isPublic,
      updatedById: userId,
    },
  });

  await createAuditLog({
    action: "setting_upserted",
    entity: "Setting",
    entityId: setting.id,
    changes: parsed.data,
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true, message: "تم حفظ الإعداد بنجاح." };
}
