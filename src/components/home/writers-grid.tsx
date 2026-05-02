import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface WritersGridProps {
  writers: ReadonlyArray<Record<string, any>>;
}

export function WritersGrid({ writers }: WritersGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {writers.map((writer) => {
        const expertise = Array.isArray(writer.profile?.expertise)
          ? writer.profile.expertise
          : [];

        return (
          <Card
            key={String(writer.id ?? writer.username ?? writer.name)}
            className="space-y-5"
          >
            <div className="flex items-center gap-4">
              <Avatar
                name={String(writer.name ?? "")}
                src={writer.image ? String(writer.image) : undefined}
                className="size-14"
              />
              <div className="space-y-1">
                <h3 className="text-lg font-bold">
                  {String(writer.name ?? "")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {String(writer.specialty || writer.profile?.headline || "")}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-8">
              {String(writer.bio ?? "")}
            </p>
            <div className="flex flex-wrap gap-2">
              {expertise.slice(0, 3).map((item) => (
                <Badge key={String(item)} variant="outline">
                  {String(item)}
                </Badge>
              ))}
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>
                {formatNumber(writer._count?.authoredArticles ?? 0)} مقال
              </span>
              <span>
                {formatNumber(writer._count?.followerLinks ?? 0)} متابع
              </span>
            </div>
            <Link
              href={`/authors/${String(writer.username ?? writer.name ?? "")}`}
              className="text-primary hover:text-secondary inline-flex font-semibold transition-colors"
            >
              صفحة الكاتب
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
