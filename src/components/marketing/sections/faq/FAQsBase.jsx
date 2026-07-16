"use client";

import Link from "next/link";

import { MessageCircle } from "lucide-react";

import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FAQBase - Premium asymmetric FAQ section with sticky header and elegant accordion.
 * @param {{ id?: string, eyebrow?: string, title?: string, subtitle?: string, align?: string, className?: string, faqs?: any[] }} props
 */
export function FAQBase({
  id = "faq",
  eyebrow = "FAQ",
  title = "Foire Aux Questions",
  subtitle = "Vous ne trouvez pas la réponse que vous cherchez ? Contactez notre équipe de support.",
  align, // Added to fix TS build error from page.tsx passing it
  className = undefined,
  faqs = [],
}) {
  if (!faqs.length) return null;

  const defaultValue = faqs[0]?.id != null ? String(faqs[0].id) : faqs.length > 0 ? "item-0" : undefined;

  return (
    <SectionWrapper id={id} className={cn("py-24", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Title & CTA */}
          <div className="lg:col-span-4 lg:col-start-1">
            <div className="sticky top-32 animate-fade-in-up">
              {eyebrow && (
                <p className="mb-4 font-bold text-emerald-700 text-xs uppercase tracking-widest">{eyebrow}</p>
              )}
              <h2 className="font-bold font-display text-3xl text-slate-900 leading-tight md:text-4xl">{title}</h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">{subtitle}</p>

              <div className="mt-10">
                <Button
                  asChild
                  variant="outline"
                  className="group h-12 rounded-full border-slate-200 bg-white/50 px-6 font-semibold shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md"
                >
                  <Link href="/contact">
                    <MessageCircle className="mr-2 size-4 text-emerald-600 transition-transform group-hover:scale-110" />
                    Parler à un expert
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Accordion */}
          <div className="lg:col-span-8">
            <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full space-y-4">
              {faqs.map((faq, index) => {
                const value = faq.id != null ? String(faq.id) : `item-${index}`;

                return (
                  <AccordionItem
                    key={value}
                    value={value}
                    className={cn(
                      "group rounded-[2rem] border border-white/60 bg-white/40 px-6 py-2 shadow-sm backdrop-blur-xl transition-all duration-500",
                      "hover:border-emerald-200/80 hover:bg-white/70 hover:shadow-emerald-900/5 hover:shadow-lg",
                      "animate-fade-in-up",
                      index === 0 && "delay-100",
                      index === 1 && "delay-150",
                      index === 2 && "delay-200",
                      index === 3 && "delay-250",
                      index > 3 && "delay-300",
                    )}
                  >
                    <AccordionTrigger className="gap-4 text-left font-bold text-lg text-slate-900 transition-colors hover:no-underline group-hover:text-emerald-900">
                      {faq.question}
                    </AccordionTrigger>

                    <AccordionContent className="pb-6 text-base text-slate-600 leading-relaxed">
                      <div className="pt-2">{faq.answer}</div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
