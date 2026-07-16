"use client";

import { FAQBase } from "@/components/marketing/sections/faq/FAQsBase";
import { HeroBase } from "@/components/marketing/sections/hero/HeroBase";
import { HowItWorksSection } from "@/components/marketing/sections/howitworks/HowItWorksSection";
import { IntegrationsSection } from "@/components/marketing/sections/integrations/IntegrationsSection";
import { DashboardPreviewSection } from "@/components/marketing/sections/preview/DashboardPreviewSection";
import { PricingBase } from "@/components/marketing/sections/pricing/PricingBase";
import { RisksSection } from "@/components/marketing/sections/risks/RisksSection";
import { TestimonialsSection } from "@/components/marketing/sections/testimonials/TestimonialsSection";
import { TrustBar } from "@/components/marketing/sections/trust/TrustBar";
import { faqSectionConfig } from "@/content/marketing/faq";
import { heroSectionConfig } from "@/content/marketing/hero";
import { howItWorksSectionConfig } from "@/content/marketing/howitworks";
import { dashboardPreviewSectionConfig } from "@/content/marketing/preview";
import { pricingContent } from "@/content/marketing/pricing";
import { risksSectionConfig } from "@/content/marketing/risks";
import { ScrollReveal } from "@/hooks/useScrollReveal";

export default function MarketingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent">
      {/* ============================================
          SECTION 1: ATTENTION
          ============================================ */}

      {/* Hero - Clear value proposition with product preview */}
      <HeroBase {...heroSectionConfig} />

      {/* Trust Bar - Immediate social proof */}
      <TrustBar id="trust" className="" />

      {/* ============================================
          SECTION 2: PROBLÈME
          ============================================ */}

      {/* Risks - Why this matters */}
      <ScrollReveal>
        <RisksSection {...risksSectionConfig} />
      </ScrollReveal>

      {/* ============================================
          SECTION 3: SOLUTION
          ============================================ */}

      {/* How It Works - Simple 3-step process */}
      <ScrollReveal>
        <HowItWorksSection {...howItWorksSectionConfig} />
      </ScrollReveal>

      {/* Integrations - Connected platforms */}
      <ScrollReveal>
        <IntegrationsSection />
      </ScrollReveal>

      {/* Dashboard Preview - See the product */}
      <ScrollReveal>
        <DashboardPreviewSection {...dashboardPreviewSectionConfig} />
      </ScrollReveal>

      {/* ============================================
          SECTION 4: PREUVE
          ============================================ */}

      {/* Testimonials - Social proof */}
      <ScrollReveal>
        <TestimonialsSection id="temoignages" />
      </ScrollReveal>

      {/* ============================================
          SECTION 5: DÉCISION
          ============================================ */}

      {/* Pricing - Clear options */}
      <ScrollReveal>
        <PricingBase {...pricingContent} />
      </ScrollReveal>

      {/* FAQ - Answer objections */}
      <ScrollReveal>
        <FAQBase {...faqSectionConfig} />
      </ScrollReveal>

      {/* CTA is now integrated in the footer */}
    </main>
  );
}
