import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow = /** @type {string | undefined} */ (undefined),
  title = /** @type {string | undefined} */ (undefined),
  subtitle = /** @type {string | undefined} */ (undefined),
  align = "left",
  className = /** @type {string | undefined} */ (undefined),
  as = "h2",
}) {
  const Tag = as;

  const alignClasses =
    align === "center"
      ? "items-center text-center"
      : align === "right"
        ? "items-end text-right"
        : "items-start text-left";

  return (
    <div className={cn("flex animate-fade-in-up flex-col gap-2", alignClasses, className)}>
      {eyebrow ? <p className="font-semibold text-primary/80 text-xs uppercase tracking-wide">{eyebrow}</p> : null}

      {title ? <Tag className="font-semibold text-2xl tracking-tight md:text-3xl">{title}</Tag> : null}

      {subtitle ? <p className="max-w-2xl text-muted-foreground text-sm sm:text-base">{subtitle}</p> : null}
    </div>
  );
}
