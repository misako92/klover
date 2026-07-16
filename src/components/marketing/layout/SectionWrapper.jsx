import { cn } from "@/lib/utils";

export function SectionWrapper({
  id = /** @type {string | undefined} */ (undefined),
  className = /** @type {string | undefined} */ (undefined),
  maxWidth = "max-w-6xl",
  padded = true,
  as = "section",
  children,
}) {
  const Tag = as;

  const outerClasses = cn(padded ? "w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8" : "w-full", className);

  const innerClasses = cn("mx-auto w-full", maxWidth);

  return (
    <Tag id={id} className={outerClasses}>
      <div className={innerClasses}>{children}</div>
    </Tag>
  );
}
