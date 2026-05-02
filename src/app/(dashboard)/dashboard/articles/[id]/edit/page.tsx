import { notFound } from "next/navigation";

import { ArticleForm } from "@/components/forms/article-form";
import { auth } from "@/lib/auth";
import { logDataLoadError } from "@/lib/data";
import {
  canEditArticle,
  canModerateContent,
  canPublish,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const session = await auth();
  const { id } = await params;
  const isModerator = canModerateContent(session);

  const [categories, tags, article] = await Promise.all([
    prisma.category
      .findMany({
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
      })
      .catch((error) => {
        logDataLoadError(
          "EditArticlePage",
          "dashboard article category options",
          error,
        );
        return [];
      }),
    prisma.tag
      .findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      .catch((error) => {
        logDataLoadError(
          "EditArticlePage",
          "dashboard article tag options",
          error,
        );
        return [];
      }),
    prisma.article.findFirst({
      where: isModerator ? { id } : { id, authorId: session?.user.id },
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        categoryId: true,
        quote: true,
        contentHtml: true,
        status: true,
        scheduledFor: true,
        reviewNotes: true,
        sources: true,
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    }),
  ]);

  if (!article) {
    notFound();
  }

  if (!canEditArticle(session, article)) {
    notFound();
  }

  return (
    <ArticleForm
      categories={categories}
      tags={tags}
      canPublish={canPublish(session)}
      initialArticle={{
        ...article,
        sources: Array.isArray(article.sources)
          ? (article.sources as Array<{ title: string; url: string }>)
          : [],
      }}
    />
  );
}
