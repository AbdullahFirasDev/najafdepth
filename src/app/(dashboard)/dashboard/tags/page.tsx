import { notFound } from "next/navigation";

import { TagForm, type TagRecord } from "@/components/forms/tag-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { canDeleteTaxonomy, canManageTaxonomy } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user || !canManageTaxonomy(session)) {
    notFound();
  }

  const tags = await prisma.tag
    .findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    .catch(() => []);

  const records: TagRecord[] = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    articleCount: tag._count.articles,
    createdAt: normalizeDate(tag.createdAt),
    updatedAt: normalizeDate(tag.updatedAt),
  }));
  const canDelete = canDeleteTaxonomy(session);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-black sm:text-3xl">الوسوم</h2>
          <p className="text-muted-foreground text-sm">
            إنشاء وتعديل الوسوم المستخدمة في المقالات والبحث.
          </p>
        </div>
        <Badge>{records.length} وسم</Badge>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <TagForm />
        <div className="grid gap-4 md:grid-cols-2">
          {records.length ? (
            records.map((tag) => (
              <TagForm
                key={tag.id}
                mode="edit"
                initialValue={tag}
                canDelete={canDelete}
              />
            ))
          ) : (
            <Card className="text-muted-foreground text-center text-sm">
              لا توجد وسوم بعد. أضف أول وسم من النموذج.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
