import Link from "next/link";

import { mainNavigation, siteConfig } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-border/70 bg-card/60 mt-12 border-t md:mt-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-black sm:text-3xl">{siteConfig.name}</h3>
          <p className="text-muted-foreground max-w-2xl text-sm leading-7">
            {siteConfig.description}
          </p>
          <p className="text-primary text-sm font-semibold">
            {siteConfig.slogan}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-bold">التنقل</h4>
            <div className="text-muted-foreground flex flex-col gap-2 text-sm">
              {mainNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-primary focus-visible:ring-ring rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold">عن المنصة</h4>
            <p className="text-muted-foreground text-sm leading-7">
              مساحة للنشر الثقافي العربي، تجمع المقالات والملفات والكتّاب ضمن
              تجربة قراءة واضحة.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
