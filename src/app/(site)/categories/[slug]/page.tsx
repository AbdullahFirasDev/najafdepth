import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/home/article-card";
import { SectionHeading } from "@/components/home/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCategoryBySlug } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || category.loadError) {
    return buildMetadata({
      title: "القسم",
      description: "تعذر تحميل البيانات حاليًا",
      path: `/categories/${slug}`,
    });
  }

  return buildMetadata({
    title: category.name,
    description: category.description || `مقالات قسم ${category.name}`,
    path: `/categories/${slug}`,
    image: category.coverImage || undefined,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (category?.loadError) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16 text-center md:px-6">
        <Card className="space-y-3 p-8">
          <h1 className="text-2xl font-black">تعذر تحميل البيانات حاليًا</h1>
          <p className="text-muted-foreground text-sm leading-7">
            يرجى المحاولة لاحقًا.
          </p>
          <Button asChild>
            <Link href="/search">العودة إلى البحث</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const articles = (category.articles || []) as Array<Record<string, any>>;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-5 md:px-6 md:py-8">
      <SectionHeading
        eyebrow="قسم"
        title={category.name}
        description={category.description || "مواد منشورة ضمن هذا القسم."}
      />

      {articles.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={String(article.id ?? article.slug)}
              article={article}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold">لا توجد نتائج</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            لم تُنشر مقالات ضمن هذا القسم بعد.
          </p>
          <Button asChild className="mt-5">
            <Link href="/search">العودة إلى البحث</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
