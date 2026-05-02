import { notFound } from "next/navigation";

import { HomepageBannerForm } from "@/components/forms/homepage-banner-form";
import { SettingsForm } from "@/components/forms/settings-form";
import { auth } from "@/lib/auth";
import { canManageSystemSettings } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { HomepageHeroSetting } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || !canManageSystemSettings(session)) {
    notFound();
  }

  const settings = await prisma.setting
    .findMany({
      where: {
        key: {
          in: ["site-branding", "homepage-hero"],
        },
      },
    })
    .catch(() => []);

  const brandingSetting =
    settings.find((setting) => setting.key === "site-branding") ?? null;
  const bannerSetting =
    settings.find((setting) => setting.key === "homepage-hero") ?? null;
  const bannerDefaults: HomepageHeroSetting = {
    isActive: true,
    eyebrow: "العمق النجفي",
    title:
      "منصة ثقافية عربية تجمع بين الذاكرة والمعرفة وجماليات الصحافة الحديثة",
    description:
      "بنر رئيسي قابل للتحكم من لوحة الإدارة بصورة كاملة مع نص موجز وزر انتقال مباشر.",
    imageUrl:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1600&q=80",
    ctaLabel: "استكشف المقالات",
    ctaHref: "/search",
  };
  const bannerValue = {
    ...bannerDefaults,
    ...((bannerSetting?.value as Partial<HomepageHeroSetting> | null) ?? {}),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black sm:text-3xl">الإعدادات</h2>
        <p className="text-muted-foreground text-sm">
          إدارة نصوص الهوية وإعدادات البنر العام والقيم التي تغذي الواجهة
          العامة.
        </p>
      </div>

      <HomepageBannerForm initialValue={bannerValue} />

      <SettingsForm
        initialValue={{
          key: brandingSetting?.key ?? "site-branding",
          label: brandingSetting?.label ?? "إعدادات الهوية البصرية",
          description:
            brandingSetting?.description ?? "هوية المنصة والنصوص الأساسية.",
          value: (brandingSetting?.value as Record<string, unknown> | null) ?? {
            siteName: "العمق النجفي",
            tagline: "معرفة تنبع من الذاكرة وتكتب للمستقبل.",
            primaryColor: "#6B4423",
          },
          isPublic: brandingSetting?.isPublic ?? true,
        }}
      />
    </div>
  );
}
