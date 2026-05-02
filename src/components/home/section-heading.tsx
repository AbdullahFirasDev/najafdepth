import { Badge } from "@/components/ui/badge";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <Badge variant="accent" className="w-fit">
        {eyebrow}
      </Badge>
      <div className="space-y-3">
        <h2 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl md:text-4xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm leading-7 sm:text-base sm:leading-8">
          {description}
        </p>
      </div>
    </div>
  );
}
