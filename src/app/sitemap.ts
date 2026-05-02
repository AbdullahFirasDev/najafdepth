import type { MetadataRoute } from "next";

import { logDataLoadError } from "@/lib/data";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, priority: 1 },
    { url: `${baseUrl}/search`, priority: 0.9 },
    { url: `${baseUrl}/apply`, priority: 0.8 },
  ];

  try {
    const [articles, categories, authors] = await Promise.all([
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.user.findMany({
        where: { role: { name: "WRITER" } },
        select: { username: true, updatedAt: true },
      }),
    ]);

    return [
      ...entries,
      ...articles.map((article) => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified: article.updatedAt,
        priority: 0.8,
      })),
      ...categories.map((category) => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        priority: 0.75,
      })),
      ...authors
        .filter((author) => Boolean(author.username))
        .map((author) => ({
          url: `${baseUrl}/authors/${author.username}`,
          lastModified: author.updatedAt,
          priority: 0.7,
        })),
    ];
  } catch (error) {
    logDataLoadError("sitemap", "published sitemap entries", error);
    return entries;
  }
}
