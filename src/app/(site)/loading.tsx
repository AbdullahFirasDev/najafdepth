import { Card } from "@/components/ui/card";

export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <Card className="h-80 animate-pulse bg-muted/20" />
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="h-56 animate-pulse bg-muted/20" />
        <Card className="h-56 animate-pulse bg-muted/20" />
      </div>
    </div>
  );
}
