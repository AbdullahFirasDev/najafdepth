import { ArticleCard } from "@/components/home/article-card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  const metrics = dashboard.metrics as Array<{
    title: string;
    value: string;
    description: string;
    delta: string;
  }>;
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <StatCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsChart data={series.map((item) => ({ ...item }))} />
        <Card className="space-y-5 overflow-hidden">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">أفضل المواد أداءً</h2>
            <p className="text-muted-foreground text-sm">
              أكثر المقالات قراءة وتفاعلاً خلال الفترة الحالية.
            </p>
          </div>
          <div className="space-y-4">
            {topArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
