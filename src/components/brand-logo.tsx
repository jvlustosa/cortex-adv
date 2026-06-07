import { cn } from "@/lib/utils";
import { BRAND_BYLINE, BRAND_LOGO_ALT, BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";

const sizeConfig = {
  sm: { img: 28, title: "text-lg", byline: "text-[10px]" },
  md: { img: 36, title: "text-xl", byline: "text-xs" },
  lg: { img: 56, title: "text-2xl", byline: "text-sm" },
} as const;

type BrandLogoProps = {
  size?: keyof typeof sizeConfig;
  suffix?: string;
  className?: string;
  showByline?: boolean;
  imageOnly?: boolean;
};

export function BrandLogo({
  size = "md",
  suffix,
  className,
  showByline = true,
  imageOnly = false,
}: BrandLogoProps) {
  const cfg = sizeConfig[size];

  return (
    <span className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_LOGO_SRC}
        alt={BRAND_LOGO_ALT}
        width={cfg.img}
        height={cfg.img}
        className="shrink-0 rounded-lg object-cover"
      />
      {!imageOnly && (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-serif tracking-tight text-[var(--foreground)]",
              cfg.title,
            )}
          >
            {BRAND_NAME}
          </span>
          {(showByline || suffix) && (
            <span className={cn("text-[var(--muted)]", cfg.byline)}>
              {showByline && (
                <>
                  {BRAND_BYLINE}
                  {suffix ? " · " : ""}
                </>
              )}
              {suffix}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
