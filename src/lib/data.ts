import { Prisma } from "@prisma/client";

import {
  fallbackArticles,
  fallbackCategories,
  fallbackDashboardSeries,
  fallbackWriters,
} from "@/lib/fallback-data";
import { prisma } from "@/lib/prisma";
import type { HomepageHeroSetting } from "@/types";
import type { DashboardMetric, SearchFilters } from "@/types";

export const DATA_LOAD_ERROR_MESSAGE = "تعذر تحميل البيانات حاليًا";

export function canUseFallbackData() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_FALLBACK_DATA === "true"
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export function logDataLoadError(
  route: string,
  purpose: string,
  error: unknown,
) {
  console.error("Data load failed", {
    route,
    purpose,
    message: getErrorMessage(error),
    timestamp: new Date().toISOString(),
  });
}

const homepageArticleInclude = {
  category: true,
  author: {
    include: {
      profile: true,
      _count: {
        select: {
          authoredArticles: true,
          followerLinks: true,
        },
      },
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
  images: true,
  comments: {
    where: {
      status: "APPROVED",
    },
    include: {
      author: true,
    },
  },
} satisfies Prisma.ArticleInclude;

function normalizeHomepageHeroSetting(
  input: unknown,
): HomepageHeroSetting | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const value = input as Record<string, unknown>;

  if (
    typeof value.imageUrl !== "string" ||
    typeof value.title !== "string" ||
    typeof value.description !== "string"
  ) {
    return null;
  }

  return {
    isActive: Boolean(value.isActive),
    eyebrow: typeof value.eyebrow === "string" ? value.eyebrow : undefined,
    title: value.title,
    description: value.description,
    imageUrl: value.imageUrl,
    ctaLabel:
      typeof value.ctaLabel === "string" ? value.ctaLabel : "اكتشف المزيد",
    ctaHref: typeof value.ctaHref === "string" ? value.ctaHref : "/",
  };
}

export async function getHomepageData(): Promise<any> {
  try {
    const [
      featuredArticle,
      latestArticles,
      trendingArticles,
      categories,
      writers,
      heroSetting,
    ] = await Promise.all([
      prisma.article.findFirst({
        where: {
          status: "PUBLISHED",
          OR: [{ featuredRank: 1 }, { featured: true }],
        },
        include: homepageArticleInclude,
        orderBy: [{ featuredRank: "asc" }, { publishedAt: "desc" }],
      }),
      prisma.article.findMany({
        where: {
          status: "PUBLISHED",
        },
        include: homepageArticleInclude,
        orderBy: {
          publishedAt: "desc",
        },
        take: 6,
      }),
      prisma.article.findMany({
        where: {
          status: "PUBLISHED",
        },
        include: homepageArticleInclude,
        orderBy: [{ trendingScore: "desc" }, { publishedAt: "desc" }],
        take: 5,
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              articles: true,
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.user.findMany({
        where: {
          role: {
            name: "WRITER",
          },
        },
        include: {
          profile: true,
          _count: {
            select: {
              authoredArticles: true,
              followerLinks: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
      }),
      prisma.setting.findUnique({
        where: {
          key: "homepage-hero",
        },
      }),
    ]);

    const useFallback = canUseFallbackData();

    return {
      heroBanner: normalizeHomepageHeroSetting(heroSetting?.value),
      featuredArticle:
        featuredArticle ??
        latestArticles[0] ??
        (useFallback ? fallbackArticles[0] : null),
      latestArticles: latestArticles.length
        ? latestArticles
        : useFallback
          ? fallbackArticles
          : [],
      trendingArticles: trendingArticles.length
        ? trendingArticles
        : useFallback
          ? fallbackArticles
          : [],
      categories: categories.length
        ? categories
        : useFallback
          ? fallbackCategories
          : [],
      writers: writers.length ? writers : useFallback ? fallbackWriters : [],
      loadError: null,
    };
  } catch (error) {
    logDataLoadError("getHomepageData", "homepage public data", error);

    if (canUseFallbackData()) {
      return {
        heroBanner: null,
        featuredArticle: fallbackArticles[0],
        latestArticles: fallbackArticles,
        trendingArticles: fallbackArticles,
        categories: fallbackCategories,
        writers: fallbackWriters,
        loadError: DATA_LOAD_ERROR_MESSAGE,
      };
    }

    return {
      heroBanner: null,
      featuredArticle: null,
      latestArticles: [],
      trendingArticles: [],
      categories: [],
      writers: [],
      loadError: DATA_LOAD_ERROR_MESSAGE,
    };
  }
}

export async function getArticleBySlug(slug: string): Promise<any> {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: homepageArticleInclude,
    });

    if (article) {
      return article;
    }

    if (canUseFallbackData()) {
      return (
        fallbackArticles.find((entry) => entry.slug === slug) ??
        fallbackArticles[0]
      );
    }

    return null;
  } catch (error) {
    logDataLoadError(
      "getArticleBySlug",
      `article details for slug ${slug}`,
      error,
    );

    if (canUseFallbackData()) {
      return (
        fallbackArticles.find((entry) => entry.slug === slug) ??
        fallbackArticles[0]
      );
    }

    return { loadError: DATA_LOAD_ERROR_MESSAGE };
  }
}

export async function getCategoryBySlug(slug: string): Promise<any> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        articles: {
          where: { status: "PUBLISHED" },
          include: homepageArticleInclude,
          orderBy: { publishedAt: "desc" },
        },
      },
    });

    if (category) {
      return category;
    }
  } catch (error) {
    logDataLoadError(
      "getCategoryBySlug",
      `category page for slug ${slug}`,
      error,
    );

    if (!canUseFallbackData()) {
      return { loadError: DATA_LOAD_ERROR_MESSAGE };
    }
  }

  if (!canUseFallbackData()) {
    return null;
  }

  const matchedCategory =
    fallbackCategories.find((entry) => entry.slug === slug) ??
    fallbackCategories[0];
  return {
    ...matchedCategory,
    articles: fallbackArticles.filter(
      (article) => article.category.slug === matchedCategory.slug,
    ),
  };
}

export async function getAuthorBySlug(slug: string): Promise<any> {
  try {
    const author = await prisma.user.findFirst({
      where: {
        OR: [{ username: slug }, { username: slug.replaceAll("-", ".") }],
      },
      include: {
        profile: true,
        authoredArticles: {
          where: { status: "PUBLISHED" },
          include: homepageArticleInclude,
          orderBy: {
            publishedAt: "desc",
          },
        },
        _count: {
          select: {
            authoredArticles: true,
            followerLinks: true,
          },
        },
      },
    });

    if (author) {
      return author;
    }
  } catch (error) {
    logDataLoadError("getAuthorBySlug", `author page for slug ${slug}`, error);

    if (!canUseFallbackData()) {
      return { loadError: DATA_LOAD_ERROR_MESSAGE };
    }
  }

  if (!canUseFallbackData()) {
    return null;
  }

  const author =
    fallbackWriters.find((entry) => entry.username === slug) ??
    fallbackWriters[0];
  return {
    ...author,
    authoredArticles: fallbackArticles.filter(
      (article) => article.author.username === author.username,
    ),
  };
}

export async function getSearchPageData(
  query: string,
  filters?: SearchFilters,
): Promise<any> {
  try {
    const results = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: query
          ? [
              { title: { contains: query, mode: "insensitive" } },
              { subtitle: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
              { author: { name: { contains: query, mode: "insensitive" } } },
              {
                tags: {
                  some: {
                    tag: { name: { contains: query, mode: "insensitive" } },
                  },
                },
              },
            ]
          : undefined,
        author: filters?.author ? { username: filters.author } : undefined,
        category: filters?.category ? { slug: filters.category } : undefined,
        tags: filters?.tag
          ? { some: { tag: { slug: filters.tag } } }
          : undefined,
      },
      include: homepageArticleInclude,
      orderBy:
        filters?.popularity === "most_viewed"
          ? [{ viewsCount: "desc" }]
          : filters?.popularity === "trending"
            ? [{ trendingScore: "desc" }]
            : [{ publishedAt: "desc" }],
      take: 20,
    });

    const hasSearchIntent = Boolean(
      query.trim() ||
      filters?.category ||
      filters?.author ||
      filters?.tag ||
      filters?.popularity,
    );

    if (results.length || hasSearchIntent) {
      return results;
    }

    return canUseFallbackData() ? fallbackArticles : [];
  } catch (error) {
    logDataLoadError("getSearchPageData", "search article results", error);

    if (canUseFallbackData()) {
      return fallbackArticles;
    }

    return { results: [], loadError: DATA_LOAD_ERROR_MESSAGE };
  }
}

export async function getDashboardData(): Promise<any> {
  try {
    const [
      usersCount,
      writerApplications,
      articlesCount,
      commentsPending,
      likesAggregate,
      topArticles,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true, status: "ACTIVE" } }),
      prisma.writerApplication.count({ where: { status: "PENDING" } }),
      prisma.article.count(),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.article.aggregate({ _sum: { likesCount: true } }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ viewsCount: "desc" }, { trendingScore: "desc" }],
        include: homepageArticleInclude,
        take: 5,
      }),
    ]);

    const metrics: DashboardMetric[] = [
      {
        title: "المستخدمون",
        value: usersCount.toString(),
        description: "إجمالي الحسابات النشطة داخل المنصة",
        delta: "+12%",
      },
      {
        title: "الطلبات الجديدة",
        value: writerApplications.toString(),
        description: "طلبات كتاب بانتظار المراجعة",
        delta: "+4 هذا الأسبوع",
      },
      {
        title: "المقالات",
        value: articlesCount.toString(),
        description: "مواد منشورة ومسودات داخل سير العمل",
        delta: "+8%",
      },
      {
        title: "الإعجابات",
        value: (likesAggregate._sum.likesCount ?? 0).toString(),
        description: "إجمالي الإعجابات المسجلة على المقالات",
        delta: "مباشر",
      },
      {
        title: "التعليقات المعلقة",
        value: commentsPending.toString(),
        description: "تعليقات تنتظر المراجعة الإدارية",
        delta: "-3 اليوم",
      },
    ];

    return {
      metrics,
      series: canUseFallbackData() ? fallbackDashboardSeries : [],
      topArticles: topArticles.length
        ? topArticles
        : canUseFallbackData()
          ? fallbackArticles
          : [],
      loadError: null,
    };
  } catch (error) {
    logDataLoadError(
      "getDashboardData",
      "dashboard metrics and top articles",
      error,
    );

    if (!canUseFallbackData()) {
      return {
        metrics: [],
        series: [],
        topArticles: [],
        loadError: DATA_LOAD_ERROR_MESSAGE,
      };
    }

    return {
      metrics: [
        {
          title: "المستخدمون",
          value: "245",
          description: "إجمالي الحسابات النشطة داخل المنصة",
          delta: "+12%",
        },
        {
          title: "الطلبات الجديدة",
          value: "12",
          description: "طلبات كتاب بانتظار المراجعة",
          delta: "+4 هذا الأسبوع",
        },
        {
          title: "المقالات",
          value: "86",
          description: "مواد منشورة ومسودات داخل سير العمل",
          delta: "+8%",
        },
        {
          title: "التعليقات المعلّقة",
          value: "17",
          description: "تعليقات تنتظر المراجعة الإدارية",
          delta: "-3 اليوم",
        },
      ],
      series: fallbackDashboardSeries,
      topArticles: fallbackArticles,
      loadError: DATA_LOAD_ERROR_MESSAGE,
    };
  }
}
