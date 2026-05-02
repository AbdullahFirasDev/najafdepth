import { ArticleForm } from "@/components/forms/article-form";
import { auth } from "@/lib/auth";
import { fallbackCategories } from "@/lib/fallback-data";
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
      .catch(() =>
        fallbackCategories.map((category) => ({
          id: category.id,
          name: category.name,
        })),
      ),
    prisma.tag
      .findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      .catch(() => [
        { id: "tag-1", name: "النجف" },
        { id: "tag-2", name: "الهوية" },
        { id: "tag-3", name: "الكتّاب" },
      ]),
  ]);

  return (
    <ArticleForm
      categories={categories}
      tags={tags}
      canPublish={canPublish(session)}
    />
  );
}
