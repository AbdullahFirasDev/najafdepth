import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Card className="h-28 animate-pulse bg-muted/20" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-40 animate-pulse bg-muted/20" />
        <Card className="h-40 animate-pulse bg-muted/20" />
      </div>
      <Card className="h-64 animate-pulse bg-muted/20" />
    </div>
  );
}
