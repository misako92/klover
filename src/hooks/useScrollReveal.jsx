"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to reveal elements when they enter the viewport
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Margin around the root
 * @returns {import("react").RefObject<HTMLDivElement>}
 */
export function useScrollReveal({ threshold = 0.1, rootMargin = "0px 0px -50px 0px" } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Add initial class
    element.classList.add("scroll-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}

/**
 * Component wrapper for scroll reveal
 */
export function ScrollReveal({ children, className = "", delay = 0, as: Component = "div", ...props }) {
  const ref = useScrollReveal();

  const delayClass = delay > 0 ? `scroll-reveal-delay-${Math.min(delay, 4)}` : "";

  return (
    <Component ref={ref} className={`${className} ${delayClass}`.trim()} {...props}>
      {children}
    </Component>
  );
}
