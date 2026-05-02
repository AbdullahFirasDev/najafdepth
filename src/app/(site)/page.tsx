import { ArticleCard } from "@/components/home/article-card";
import { CategoryGrid } from "@/components/home/category-grid";
import { HeroBanner } from "@/components/home/hero-banner";
import { NewsletterCard } from "@/components/home/newsletter-card";
import { SectionHeading } from "@/components/home/section-heading";
import { TrendingList } from "@/components/home/trending-list";
import { WritersGrid } from "@/components/home/writers-grid";
import { SearchDiscovery } from "@/components/search/search-discovery";
import { getHomepageData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const {
    heroBanner,
    featuredArticle,
    latestArticles,
    trendingArticles,
    categories,
    writers,
    loadError,
  } = await getHomepageData();
  const latest = (latestArticles || []) as Array<Record<string, any>>;
  const trending = (trendingArticles || []) as Array<Record<string, any>>;
  const categoryCards = (categories || []) as Array<Record<string, any>>;
  const writerCards = (writers || []) as Array<Record<string, any>>;
  const tagOptions = Array.from(
    new Map(
      latest.flatMap((article) =>
        (article.tags || []).map((entry: any) => [
          entry.tag?.slug ?? "",
          { slug: entry.tag?.slug ?? "", name: entry.tag?.name ?? "" },
        ]),
      ),
    ).values(),
  ).filter((tag: any) => tag.slug && tag.name) as Array<{
    slug: string;
    name: string;
  }>;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-5 sm:gap-12 md:px-6 md:py-8">
      {loadError ? (
        <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-2xl border p-4 text-center text-sm">
          تعذر تحميل البيانات حاليًا. يرجى المحاولة لاحقًا.
        </p>
      ) : null}

      <div className="order-1 md:order-2">
        <HeroBanner heroBanner={heroBanner} featuredArticle={featuredArticle} />
      </div>

      <SearchDiscovery
        className="order-2 md:order-1"
        categories={categoryCards
          .filter((category) => category.slug && category.name)
          .map((category) => ({
            slug: String(category.slug),
            name: String(category.name),
            count: Number(category._count?.articles ?? 0),
          }))}
        tags={tagOptions}
      />

      <section className="order-3 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="المقالات"
            title="أحدث المواد المنشورة"
            description="اختيارات تحريرية موجزة وواضحة للقراءة اليومية."
          />
          {latest.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {latest.map((article) => (
                <ArticleCard
                  key={String(article.id ?? article.slug)}
                  article={article}
                />
              ))}
            </div>
          ) : (
            <p className="border-border bg-card/80 text-muted-foreground rounded-2xl border p-6 text-center text-sm">
              لا توجد نتائج
            </p>
          )}
        </div>
        <TrendingList articles={trending} />
      </section>

      <section id="categories" className="order-4 scroll-mt-24 space-y-6">
        <SectionHeading
          eyebrow="الأقسام"
          title="تصفّح حسب الموضوع"
          description="مسارات واضحة للوصول إلى المقالات حسب الاهتمام."
        />
        <CategoryGrid categories={categoryCards} />
      </section>

      <section className="order-5 space-y-6">
        <SectionHeading
          eyebrow="الكتّاب"
          title="أصوات المنصة"
          description="كتّاب وباحثون يقدّمون معرفة عربية رصينة."
        />
        <WritersGrid writers={writerCards} />
      </section>

      <div className="order-6">
        <NewsletterCard />
      </div>
    </div>
  );
}
