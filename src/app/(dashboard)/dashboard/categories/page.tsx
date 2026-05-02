import { notFound } from "next/navigation";

import {
  CategoryForm,
  type CategoryRecord,
} from "@/components/forms/category-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { canDeleteTaxonomy, canManageTaxonomy } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user || !canManageTaxonomy(session)) {
    notFound();
  }

  const categories = await prisma.category
    .findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    })
    .catch(() => []);

  const normalizedCategories: CategoryRecord[] = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? "",
    color: category.color ?? "#6B4423",
    articleCount: category._count.articles,
    createdAt: normalizeDate(category.createdAt),
    updatedAt: normalizeDate(category.updatedAt),
  }));
  const canDelete = canDeleteTaxonomy(session);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-black sm:text-3xl">الأقسام</h2>
          <p className="text-muted-foreground text-sm">
            إضافة وتعديل الأقسام التي تظهر في الصفحة الرئيسية وصفحات التصنيف.
          </p>
        </div>
        <Badge>{normalizedCategories.length} قسم</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <CategoryForm />
        <div className="space-y-4">
          {normalizedCategories.length ? (
            normalizedCategories.map((category) => (
              <CategoryForm
                key={category.id}
                mode="edit"
                initialValue={category}
                canDelete={canDelete}
              />
            ))
          ) : (
            <Card className="text-muted-foreground text-center text-sm">
              لا توجد أقسام بعد. أضف أول قسم من النموذج المجاور.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
