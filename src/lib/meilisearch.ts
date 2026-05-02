import { Meilisearch } from "meilisearch";

import { prisma } from "@/lib/prisma";

const meiliClient =
  process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_ADMIN_KEY
    ? new Meilisearch({
        host: process.env.MEILISEARCH_HOST,
        apiKey: process.env.MEILISEARCH_ADMIN_KEY,
      })
    : null;

const indexName = "articles";

export async function searchArticles(
  query: string,
  filters?: Record<string, string | undefined>,
) {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  if (meiliClient) {
    const index = meiliClient.index(indexName);
    const filterParts = Object.entries(filters ?? {})
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `${key} = "${value}"`);

    const result = await index.search(trimmed, {
      filter: filterParts.length ? filterParts : undefined,
      limit: 10,
    });

    return result.hits;
  }

  const results = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { subtitle: { contains: trimmed, mode: "insensitive" } },
        { excerpt: { contains: trimmed, mode: "insensitive" } },
        {
          tags: {
            some: {
              tag: { name: { contains: trimmed, mode: "insensitive" } },
            },
          },
        },
      ],
      category: filters?.category ? { slug: filters.category } : undefined,
    },
    include: {
      category: true,
      author: true,
    },
    take: 10,
    orderBy: [{ trendingScore: "desc" }, { publishedAt: "desc" }],
  });

  return results.map((article) => ({
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    slug: article.slug,
    excerpt: article.excerpt,
    category: article.category.name,
    author: article.author.name,
    popularity: article.viewsCount,
    publishedAt: article.publishedAt,
  }));
}

export async function syncArticleToSearchIndex(article: {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  excerpt?: string | null;
  category?: { name: string; slug: string } | null;
  author?: { name: string } | null;
  tags?: { tag: { name: string; slug: string } }[];
  publishedAt?: Date | null;
  viewsCount?: number;
  trendingScore?: number;
}) {
  if (!meiliClient) {
    return;
  }

  const index = meiliClient.index(indexName);

  await index.addDocuments([
    {
      id: article.id,
      title: article.title,
      slug: article.slug,
      subtitle: article.subtitle,
      excerpt: article.excerpt,
      category: article.category?.name,
      categorySlug: article.category?.slug,
      author: article.author?.name,
      tags: article.tags?.map((entry) => entry.tag.name) ?? [],
      publishedAt: article.publishedAt?.toISOString(),
      popularity: article.viewsCount ?? 0,
      trendingScore: article.trendingScore ?? 0,
    },
  ]);
}

export async function removeArticleFromSearchIndex(articleId: string) {
  if (!meiliClient) {
    return;
  }

  const index = meiliClient.index(indexName);
  await index.deleteDocument(articleId);
}
