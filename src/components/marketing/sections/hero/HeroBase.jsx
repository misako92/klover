import Image from "next/image";
import Link from "next/link";

import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * HeroBase — premium hero with centered text + floating dashboard mockup below.
 * Inspired by Linear / Vercel / Stripe hero patterns.
 * @param {{ id?: string, eyebrow?: string, title?: string, subtitle?: string, primaryCta?: any, secondaryCta?: any, stats?: any[], mockupImage?: { src: string, alt?: string, priority?: boolean } | null, className?: string }} props
 */
export function HeroBase({
  id,
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  stats = /** @type {any[]} */ ([]),
  mockupImage = /** @type {{ src: string, alt?: string, priority?: boolean } | null} */ (null),
  className = /** @type {string | undefined} */ (undefined),
}) {
  return (
    <section id={id} className={cn("relative w-full", "pt-28 pb-0 md:pt-36", className)}>
      {/* Animated gradient mesh background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] animate-blob-slow rounded-full bg-emerald-200/30 blur-[120px]" />
        <div className="absolute top-20 right-1/4 h-[500px] w-[500px] animate-blob-medium rounded-full bg-teal-200/20 blur-[100px]" />
        <div className="-bottom-32 -translate-x-1/2 absolute left-1/2 h-[400px] w-[800px] rounded-full bg-emerald-100/20 blur-[140px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Text block */}
        <div className="flex animate-fade-in-up flex-col items-center text-center">
          {/* Eyebrow badge */}
          {eyebrow && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/60 px-4 py-2 font-semibold text-emerald-800 text-xs shadow-sm backdrop-blur-sm">
              <Sparkles className="size-3.5 text-emerald-600" />
              <span className="uppercase tracking-wide">{eyebrow}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="max-w-4xl font-bold text-4xl text-slate-900 leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && <p className="mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed sm:text-xl">{subtitle}</p>}

          {/* CTAs */}
          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {primaryCta && (
                <Button
                  asChild
                  size="lg"
                  className="hover:-translate-y-0.5 h-12 gap-2 rounded-full bg-emerald-600 px-8 font-semibold text-white shadow-emerald-600/25 shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 hover:shadow-xl"
                >
                  <Link href={primaryCta.href}>
                    <span>{primaryCta.label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-slate-300 bg-white/70 px-8 font-semibold text-slate-700 backdrop-blur-sm transition-all hover:border-slate-400 hover:bg-white"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          )}

          {/* Stats */}
          {stats?.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-2">
                  {i > 0 && <div className="-ml-4 mr-0 h-4 w-px bg-slate-300" />}
                  <span className="font-bold text-lg text-slate-900">{stat.value}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating dashboard mockup */}
      {mockupImage?.src && (
        <div className="mt-16 animate-fade-in-up md:mt-20" style={{ animationDelay: "300ms" }}>
          <div className="relative mx-auto w-full max-w-[1400px] px-2 md:px-4">
            <div className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/10 transition-all duration-700 hover:shadow-xl">
              {/* Dashboard image with fade-out mask */}
              <div
                className="relative bg-slate-50"
                style={{
                  maskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
                }}
              >
                <Image
                  src={mockupImage.src}
                  alt={mockupImage.alt || "Aperçu du dashboard Klover"}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-auto w-full"
                  priority={mockupImage.priority !== false}
                  quality={100}
                  unoptimized
                />
              </div>
            </div>

            {/* Glow effect under the mockup */}
            <div className="-bottom-12 -translate-x-1/2 -z-10 absolute left-1/2 h-24 w-[90%] rounded-full bg-emerald-400/10 blur-3xl" />
          </div>
        </div>
      )}
    </section>
  );
}
