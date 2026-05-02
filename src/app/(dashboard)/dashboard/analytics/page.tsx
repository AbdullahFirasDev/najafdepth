import { notFound } from "next/navigation";

import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { ArticleCard } from "@/components/home/article-card";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { canModerateContent } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || !canModerateContent(session)) {
    notFound();
  }

  const dashboard = await getDashboardData();
  const series = dashboard.series as Array<{
    name: string;
    views: number;
    engagement: number;
  }>;
  const topArticles = (dashboard.topArticles as Array<Record<string, any>>).map(
    (article) => ({
      slug: String(article.slug ?? ""),
      title: String(article.title ?? ""),
      subtitle: article.subtitle ? String(article.subtitle) : undefined,
      excerpt: article.excerpt ? String(article.excerpt) : undefined,
      coverImage: article.coverImage ? String(article.coverImage) : undefined,
      readingTimeMinutes: Number(article.readingTimeMinutes ?? 5),
      viewsCount: Number(article.viewsCount ?? 0),
      publishedAt: article.publishedAt,
      category: article.category
        ? { name: String(article.category.name ?? "") }
        : undefined,
      author: article.author
        ? { name: String(article.author.name ?? "") }
        : undefined,
    }),
  );

  return (
    <div className="space-y-6">
      <AnalyticsChart data={series.map((item) => ({ ...item }))} />
      <Card className="space-y-5 overflow-hidden">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">
            المقالات الأعلى أداءً
          </h2>
          <p className="text-muted-foreground text-sm">
            مقارنة المواد حسب القراءة والتفاعل والانتشار داخل المنصة.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {topArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Card>
    </div>
  );
}
