import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";

export const CLAUDE_ACADEMY_LOGO =
  "/assets/images/claude-para-advogados-academy.png";

const SIZE = {
  sm: { px: 32, title: "text-sm leading-tight", byline: "text-[9px]" },
  md: { px: 44, title: "text-lg leading-tight", byline: "text-[10px]" },
  lg: { px: 56, title: "text-2xl leading-tight", byline: "text-[11px]" },
} as const;

type ClaudeAcademyBrandProps = {
  size?: keyof typeof SIZE;
  /** Omit or pass null for static display (no link). */
  href?: string | null;
  showByline?: boolean;
  className?: string;
};

export function ClaudeAcademyBrand({
  size = "md",
  href = "/",
  showByline = true,
  className,
}: ClaudeAcademyBrandProps) {
  const s = SIZE[size];

  const content = (
    <>
      <Image
        src={CLAUDE_ACADEMY_LOGO}
        alt=""
        width={s.px}
        height={s.px}
        className="shrink-0 rounded-md"
        priority={size !== "sm"}
        aria-hidden
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            s.title,
            "font-serif tracking-tight text-[var(--foreground)]",
          )}
        >
          {SITE_NAME}
        </span>
        {showByline ? (
          <span className={cn(s.byline, "text-[var(--muted)]")}>
            by Chat Jurídico
          </span>
        ) : null}
      </div>
    </>
  );

  const classes = cn("flex min-w-0 items-center gap-2 sm:gap-3", className);

  if (href !== null) {
    return (
      <Link
        href={href ?? "/"}
        className={classes}
        aria-label={`${SITE_NAME}, página inicial`}
      >
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
