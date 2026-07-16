import { Quote, Star, StarHalf } from "lucide-react";

import { SectionHeader } from "@/components/marketing/layout/SectionHeader";
import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { cn } from "@/lib/utils";

/**
 * TestimonialsSection - Premium customer testimonials with glassmorphism and gradient avatars
 * @param {{ id?: string, eyebrow?: string, title?: string, subtitle?: string, align?: string, testimonials?: any[], className?: string }} props
 */
export function TestimonialsSection({
  id,
  eyebrow = "Ils nous font confiance",
  title = "Ce que disent nos clients",
  subtitle,
  align = "center",
  testimonials = [],
  className = /** @type {string | undefined} */ (undefined),
}) {
  const defaultTestimonials = [
    {
      id: 1,
      quote:
        "Avant Klover, on passait 3 jours par trimestre à consolider nos données dans Excel. Maintenant c'est fait en 20 minutes. On a évité un redressement de 8 000€ dès le premier mois.",
      author: "Responsable Ops",
      role: "E-commerçant mode",
      company: "800+ réfs",
      rating: 5,
      avatarGradient: "from-emerald-400 to-teal-500",
    },
    {
      id: 2,
      quote:
        "Amazon nous a demandé notre UID en urgence. Grâce au Centre d'alerte, tout était déjà prêt. Sans Klover, on aurait perdu 2 semaines de ventes.",
      author: "Fondateur",
      role: "Marketplace bio",
      company: "1 200+ réfs",
      rating: 5,
      avatarGradient: "from-sky-400 to-blue-500",
    },
    {
      id: 3,
      quote:
        "On surpayait nos éco-contributions de 15% à cause d'erreurs de classification. Klover a détecté le problème dès le premier import.",
      author: "Directrice Financière",
      role: "E-commerçant déco",
      company: "500+ réfs",
      rating: 5,
      avatarGradient: "from-violet-400 to-purple-500",
    },
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    return (
      <div className="flex gap-0.5">
        {[...Array(full)].map((_, i) => {
          // biome-ignore lint/suspicious/noArrayIndexKey: pure static visual rating
          return <Star key={i} className="size-4 fill-amber-400 text-amber-400" />;
        })}
        {hasHalf && <StarHalf className="size-4 fill-amber-400 text-amber-400" />}
      </div>
    );
  };

  return (
    <SectionWrapper id={id} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} align={align} className="mb-12 md:mb-16" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {displayTestimonials.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className={cn(
              "relative rounded-[2rem] p-6 md:p-10",
              // Premium Glassmorphism
              "border border-white/60 bg-white/50 backdrop-blur-xl",
              "shadow-slate-200/50 shadow-sm",
              "hover:-translate-y-2 hover:border-emerald-200/80 hover:bg-white/80 hover:shadow-2xl hover:shadow-emerald-900/15",
              "transition-all duration-500",
              "animate-fade-in-up",
              // Slight rotation for organic feel
              index === 0 && "md:rotate-[-0.5deg]",
              index === 2 && "md:rotate-[0.5deg]",
            )}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {/* Quote icon */}
            <div className="-left-4 -top-6 absolute rounded-full border border-white/60 bg-emerald-100/80 p-3 text-emerald-600 shadow-lg backdrop-blur-md">
              <Quote className="size-6" />
            </div>

            {/* Stars */}
            <div className="mb-4">{renderStars(testimonial.rating)}</div>

            {/* Quote */}
            <blockquote className="mb-6 font-medium text-slate-900 leading-relaxed">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-3 border-emerald-50 border-t pt-4">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full font-bold text-sm text-white shadow-md",
                  `bg-gradient-to-br ${testimonial.avatarGradient || "from-emerald-400 to-emerald-600"}`,
                )}
              >
                {testimonial.author.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{testimonial.author}</p>
                <p className="text-slate-500 text-xs">
                  {testimonial.role}, {testimonial.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
