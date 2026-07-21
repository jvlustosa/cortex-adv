"use client";

import Link from "next/link";
import type { ComponentProps, CSSProperties, PointerEvent } from "react";
import { useCallback, useRef, useState } from "react";
import styles from "./ripple-link.module.css";

type RippleState = { id: number; x: number; y: number; size: number };

type RippleLinkProps = ComponentProps<typeof Link> & {
  /** Cor do ripple. Default: acento Claude do tema. */
  rippleColor?: string;
};

/**
 * next/link com feedback tátil no toque: um ripple sutil nasce no ponto do
 * clique e fica visível enquanto a navegação carrega. Confirma o clique em
 * <100ms, então a espera pelo loading.js "sente" menos.
 */
export function RippleLink({
  rippleColor,
  className,
  children,
  style,
  onPointerDown,
  onPointerCancel,
  ...linkProps
}: RippleLinkProps) {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const nextId = useRef(0);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(event);
      // Só clique primário / toque — ctrl+clique e botão do meio abrem em nova aba.
      if (event.button !== 0) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const id = nextId.current++;
      setRipples((prev) => [
        ...prev,
        {
          id,
          x: event.clientX - rect.left - size / 2,
          y: event.clientY - rect.top - size / 2,
          size,
        },
      ]);
    },
    [onPointerDown],
  );

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerCancel?.(event);
      // Toque virou scroll/gesto: aborta o ripple em vez de deixá-lo expandir.
      setRipples([]);
    },
    [onPointerCancel],
  );

  const mergedStyle = rippleColor
    ? ({ ...style, "--ripple-color": rippleColor } as CSSProperties)
    : style;

  return (
    <Link
      {...linkProps}
      style={mergedStyle}
      className={className ? `${styles.host} ${className}` : styles.host}
      onPointerDown={handlePointerDown}
      onPointerCancel={handlePointerCancel}
    >
      {children}
      <span className={styles.layer} aria-hidden>
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={styles.ripple}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
            onAnimationEnd={() => removeRipple(ripple.id)}
          />
        ))}
      </span>
    </Link>
  );
}
