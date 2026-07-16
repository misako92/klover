import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * SimpleBentoGrid - Performance-optimized grid container
 */
export function SimpleBentoGrid({ children, className }) {
  return (
    <div className={cn("grid w-full auto-rows-[22rem] grid-cols-1 gap-4 md:grid-cols-3", className)}>{children}</div>
  );
}

/**
 * SimpleBentoCard - With subtle hover effects
 */
export function SimpleBentoCard({ name, className, background, Icon, description, href, cta }) {
  return (
    <div
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
        // Simple background and border
        "bg-white dark:bg-slate-900",
        "border border-slate-200 dark:border-slate-800",
        // Subtle hover shadow
        "shadow-sm transition-shadow duration-300 hover:shadow-md",
        className,
      )}
    >
      {/* Background image/content */}
      {background}

      {/* Content with subtle lift on hover */}
      <div className="group-hover:-translate-y-1 relative z-10 flex flex-col gap-2 p-6 transition-transform duration-300">
        {Icon && <Icon className="h-12 w-12 text-emerald-600 transition-colors dark:text-emerald-400" />}
        <h3 className="font-semibold text-foreground text-xl">{name}</h3>
        <p className="max-w-lg text-muted-foreground">{description}</p>
      </div>

      {/* CTA with fade in on hover */}
      {cta && href && (
        <div className="relative z-10 px-6 pb-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button variant="ghost" asChild size="sm">
            <Link href={href}>
              {cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Subtle overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}
