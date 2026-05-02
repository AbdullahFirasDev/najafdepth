"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getSafeImageSrc } from "@/lib/utils";
import type { HomepageHeroSetting } from "@/types";

interface HeroBannerProps {
  heroBanner?: HomepageHeroSetting | null;
  featuredArticle?: {
    title: string;
    subtitle?: string | null;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    publishedAt?: string | Date | null;
    author?: {
      name: string;
    };
    category?: {
      name: string;
    };
  } | null;
}

export function HeroBanner({ heroBanner, featuredArticle }: HeroBannerProps) {
  const isCustomBanner = Boolean(heroBanner?.isActive && heroBanner.imageUrl);
  const hasFeaturedArticle = Boolean(featuredArticle?.slug);
  const imageUrl = getSafeImageSrc(
    heroBanner?.imageUrl || featuredArticle?.coverImage || null,
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1800&q=80",
  );
  const title = isCustomBanner
    ? (heroBanner?.title ?? "العمق النجفي")
    : (featuredArticle?.title ?? "العمق النجفي");
  const description = isCustomBanner
    ? (heroBanner?.description ?? "منصة ثقافية عربية للقراءة والتحرير والنشر.")
    : (featuredArticle?.excerpt ??
      featuredArticle?.subtitle ??
      "لا توجد مواد منشورة حاليًا.");
  const eyebrow = isCustomBanner
    ? (heroBanner?.eyebrow ?? "منصة ثقافية")
    : (featuredArticle?.category?.name ?? "مواد المنصة");
  const primaryHref = isCustomBanner
    ? (heroBanner?.ctaHref ?? "/")
    : hasFeaturedArticle
      ? `/articles/${featuredArticle?.slug}`
      : "/search";
  const primaryLabel = isCustomBanner
    ? (heroBanner?.ctaLabel ?? "استكشاف")
    : hasFeaturedArticle
      ? "قراءة المقال"
      : "العودة إلى البحث";

  return (
    <section className="border-border/70 shadow-soft relative isolate overflow-hidden rounded-2xl border">
      <Image
        src={imageUrl}
        alt={title}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(18,12,8,0.86),rgba(54,33,18,0.54),rgba(18,12,8,0.88))]" />

      <div className="relative grid min-h-[360px] gap-5 px-4 py-5 sm:min-h-[420px] sm:px-6 sm:py-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-8 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-primary-foreground flex max-w-3xl flex-col justify-end gap-4 self-end"
        >
          <Badge className="w-fit bg-white/14 text-white">{eyebrow}</Badge>
          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-black sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/86 sm:text-base sm:leading-8">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            {isCustomBanner && hasFeaturedArticle ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/25 bg-white/10 text-white hover:bg-white/15"
              >
                <Link href={`/articles/${featuredArticle?.slug}`}>
                  المقال المميز
                </Link>
              </Button>
            ) : null}
          </div>
        </motion.div>

        {featuredArticle ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="self-end"
          >
            <div className="rounded-2xl border border-white/12 bg-black/28 p-4 text-white backdrop-blur-md sm:p-5">
              <div className="text-accent mb-3 flex items-center gap-2">
                <Sparkles className="size-4" />
                <span className="text-sm font-semibold">مادة مختارة</span>
              </div>
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="w-fit border-white/15 text-white/75"
                >
                  {featuredArticle.category?.name ?? "مقال"}
                </Badge>
                <h2 className="text-xl leading-8 font-bold sm:text-2xl">
                  {featuredArticle.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-7 text-white/80">
                  {featuredArticle.subtitle || featuredArticle.excerpt}
                </p>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-white/60">الكاتب</p>
                  <p className="font-semibold">
                    {featuredArticle.author?.name ?? "هيئة التحرير"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-white/60">النشر</p>
                  <p className="font-semibold">
                    {featuredArticle.publishedAt
                      ? formatDate(featuredArticle.publishedAt)
                      : "قريبًا"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
