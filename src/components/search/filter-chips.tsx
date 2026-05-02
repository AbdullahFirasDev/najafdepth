import { cn } from "@/lib/utils";

export type FilterChipOption = {
  slug: string;
  name: string;
  count?: number;
};

interface FilterChipsProps {
  label: string;
  options: FilterChipOption[];
  selectedValue?: string | null;
  allLabel?: string;
  prefix?: string;
  tone?: "primary" | "secondary" | "accent";
  onSelect: (value: string | null) => void;
}

const activeTone = {
  primary: "border-primary bg-primary text-primary-foreground shadow-soft",
  secondary:
    "border-secondary bg-secondary text-secondary-foreground shadow-soft",
  accent: "border-accent bg-accent text-accent-foreground shadow-soft",
};

export function FilterChips({
  label,
  options,
  selectedValue,
  allLabel,
  prefix,
  tone = "primary",
  onSelect,
}: FilterChipsProps) {
  if (!options.length && !allLabel) {
    return null;
  }

  const renderChip = (value: string | null, name: string, count?: number) => {
    const isActive = value === null ? !selectedValue : selectedValue === value;

    return (
      <button
        key={value ?? "all"}
        type="button"
        aria-pressed={isActive}
        onClick={() => onSelect(value)}
        className={cn(
          "focus-visible:ring-ring min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:outline-none",
          "hover:-translate-y-0.5",
          isActive
            ? activeTone[tone]
            : "border-border bg-background/85 text-foreground hover:bg-muted/40",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span>
            {prefix}
            {name}
          </span>
          {typeof count === "number" ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] leading-none",
                isActive ? "bg-white/20" : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground px-1 text-xs font-black">{label}</p>
      <div className="scrollbar-none -mx-1 flex snap-x gap-2 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-1">
        {allLabel ? renderChip(null, allLabel) : null}
        {options.map((option) =>
          renderChip(option.slug, option.name, option.count),
        )}
      </div>
    </div>
  );
}
