import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { cn } from "@/lib/utils";

import { AmazonLogo, CiteoLogo, EcomaisonLogo, ShopifyLogo, StripeLogo } from "./PartnerLogos";

const LekoLogo = ({ className }) => (
  <svg viewBox="0 0 90 30" fill="currentColor" className={className} aria-labelledby="leko-logo">
    <title id="leko-logo">Léko</title>
    <text x="0" y="25" fontSize="28" fontWeight="600" fontFamily="serif" fontStyle="italic">
      Léko
    </text>
  </svg>
);

/**
 * TrustBar - social proof statistics
 * @param {{ id?: string, className?: string }} props
 */
export function TrustBar({ id, className = /** @type {string | undefined} */ (undefined) }) {
  return (
    <SectionWrapper id={id} className={cn("relative z-10 overflow-hidden bg-transparent pt-8 pb-24", className)}>
      <div className="mx-auto w-full px-4 md:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="mx-auto mb-10 max-w-lg font-medium text-slate-500/80 text-sm">
            Vos données connectées à l&apos;écosystème e-commerce et REP
          </p>

          {/* Marquee container with fade edges */}
          <div className="relative mx-auto w-full max-w-6xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="group flex w-full">
              <div className="flex w-max shrink-0 animate-infinite-scroll items-center justify-around gap-12 px-6 py-4 text-slate-400 opacity-80 mix-blend-multiply grayscale filter transition-all group-hover:grayscale-0 md:gap-24 md:px-12">
                <AmazonLogo className="h-6 w-auto text-slate-800 transition-colors hover:text-[#FF9900] md:h-7" />
                <ShopifyLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-[#95BF47] md:h-8" />
                <EcomaisonLogo className="h-6 w-auto text-slate-800 transition-colors hover:text-emerald-600 md:h-7" />
                <CiteoLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-blue-600 md:h-8" />
                <LekoLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-green-600 md:h-8" />
                <StripeLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-[#635BFF] md:h-8" />
              </div>
              <div
                className="flex w-max shrink-0 animate-infinite-scroll items-center justify-around gap-12 px-6 py-4 text-slate-400 opacity-80 mix-blend-multiply grayscale filter transition-all group-hover:grayscale-0 md:gap-24 md:px-12"
                aria-hidden="true"
              >
                <AmazonLogo className="h-6 w-auto text-slate-800 transition-colors hover:text-[#FF9900] md:h-7" />
                <ShopifyLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-[#95BF47] md:h-8" />
                <EcomaisonLogo className="h-6 w-auto text-slate-800 transition-colors hover:text-emerald-600 md:h-7" />
                <CiteoLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-blue-600 md:h-8" />
                <LekoLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-green-600 md:h-8" />
                <StripeLogo className="h-7 w-auto text-slate-800 transition-colors hover:text-[#635BFF] md:h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
