import { ArticleForm } from "@/components/forms/article-form";
import { auth } from "@/lib/auth";
import { logDataLoadError } from "@/lib/data";
import { canPublish } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewArticlePage() {
  const session = await auth();
  const [categories, tags] = await Promise.all([
    prisma.category
      .findMany({
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
      })
      .catch((error) => {
        logDataLoadError(
          "NewArticlePage",
          "dashboard article category options",
          error,
        );
        return [];
      }),
    prisma.tag
      .findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      .catch((error) => {
        logDataLoadError(
          "NewArticlePage",
          "dashboard article tag options",
          error,
        );
        return [];
      }),
  ]);

  return (
    <ArticleForm
      categories={categories}
      tags={tags}
      canPublish={canPublish(session)}
    />
  );
}
