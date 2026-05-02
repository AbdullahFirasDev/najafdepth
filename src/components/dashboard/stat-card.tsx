import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  delta: string;
}

export function StatCard({ title, value, description, delta }: StatCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-semibold">{title}</p>
        <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
          {delta}
        </span>
      </div>
      <p className="text-3xl font-black sm:text-4xl">{value}</p>
      <p className="text-muted-foreground text-sm leading-7">{description}</p>
    </Card>
  );
}
