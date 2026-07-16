"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Minimalist & High Performance Navbar
 * - Optimized scroll handler (requestAnimationFrame)
 * - Zero Layout Shifts (CLS)
 * - GPU Accelerated transitions
 * - Active section detection via IntersectionObserver for hash links
 */
export function NavbarBase({
  logo = null,
  navItems = /** @type {any[]} */ ([]),
  cta,
  showThemeToggle = false,
  className = /** @type {string | undefined} */ (undefined),
}) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  // Optimized scroll handler
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section detection via IntersectionObserver
  useEffect(() => {
    const hashItems = navItems.filter((item) => item.href?.startsWith("#"));
    if (hashItems.length === 0) return;

    const sectionIds = hashItems.map((item) => item.href.slice(1));
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((section) => {
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, [navItems]);

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <header
      className={cn(
        "pointer-events-none fixed top-0 right-0 left-0 z-50 flex w-full justify-center px-4 transition-all duration-500",
        isScrolled ? "pt-4 md:pt-6" : "pt-6 md:pt-8",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center justify-between",
          "w-full transition-all duration-500 ease-in-out will-change-transform",
          isScrolled
            ? "h-14 max-w-4xl rounded-full border border-white/50 bg-white/40 px-4 shadow-black/5 shadow-lg backdrop-blur-xl md:h-16 md:px-5 md:pr-3"
            : "h-16 max-w-6xl border-transparent bg-transparent px-2 md:px-4",
        )}
      >
        {/* Logo */}
        <LogoSlotBase logo={logo} />

        {/* Desktop Nav - Centered */}
        <DesktopNavBase items={navItems} pathname={pathname} isScrolled={isScrolled} activeHash={activeHash} />

        {/* Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {showThemeToggle ? (
            <div className={cn("transition-opacity", !isScrolled && "opacity-70 hover:opacity-100")}>
              <span className="h-9 w-9" />
            </div>
          ) : null}

          {cta && (
            <Button
              asChild
              size="sm"
              className={cn(
                "rounded-full bg-[#0a945b] font-bold text-white shadow-[0_8px_16px_rgba(10,148,91,0.25)] transition-all hover:scale-105 hover:bg-[#088250]",
                isScrolled ? "h-10 px-6 text-sm md:h-11 md:px-7" : "h-11 px-7 text-base md:h-12 md:px-8",
              )}
            >
              <Link
                href={cta.href}
                target={cta.external ? "_blank" : undefined}
                rel={cta.external ? "noreferrer" : undefined}
              >
                {/* Override label if custom is desired, or use default */}
                {cta.label}
              </Link>
            </Button>
          )}

          {/* Mobile Menu Trigger */}
          <div className="ml-1 md:hidden">
            <MobileNavBase items={navItems} cta={cta} />
          </div>
        </div>
      </div>
    </header>
  );
}

const LogoSlotBase = React.memo(function LogoSlotBase({ logo }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-slate-900 transition-transform hover:scale-105 active:scale-95"
    >
      {logo ? logo : <span className="font-bold text-xl tracking-tight">Klover</span>}
    </Link>
  );
});

function DesktopNavBase({ items, pathname, isScrolled, activeHash }) {
  if (!items?.length) return null;

  return (
    <nav className="hidden items-center md:flex md:gap-4 lg:gap-8">
      {items.map((item) => {
        const isHash = item.href?.startsWith("#");
        const isActive = isHash ? activeHash === item.href : item.href && pathname?.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href ?? "#"}
            className={cn(
              "rounded-full px-3 py-2 font-medium transition-colors duration-200",
              isScrolled ? "text-sm" : "text-[15px]",
              isActive ? "font-bold text-slate-900" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavBase({ items, cta }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-slate-900 hover:bg-black/5"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="w-full rounded-b-3xl border-b bg-background/95 pt-16 backdrop-blur-xl">
        <SheetHeader className="hidden">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col items-center gap-6 pb-8">
          {items?.map((item) => (
            <SheetClose asChild key={item.label}>
              <Link href={item.href ?? "#"} className="font-medium text-lg transition-colors hover:text-primary">
                {item.label}
              </Link>
            </SheetClose>
          ))}
          {cta && (
            <SheetClose asChild>
              <Button asChild size="lg" className="mt-4 rounded-full px-8">
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            </SheetClose>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
