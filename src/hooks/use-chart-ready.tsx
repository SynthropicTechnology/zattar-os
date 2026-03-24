'use client';

import { type ComponentProps, type ReactElement, useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * Hook que aguarda o container ter dimensões válidas (> 0) antes de
 * permitir a renderização do Recharts ResponsiveContainer.
 *
 * Resolve o warning "width(-1) height(-1)" que ocorre quando o container
 * ainda não foi layoutado (ex: tab oculta, accordion fechado, SSR).
 */
export function useChartReady() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setReady(true);
      } else {
        requestAnimationFrame(check);
      }
    };

    requestAnimationFrame(check);
  }, []);

  return { containerRef, ready };
}

/**
 * Drop-in replacement para ResponsiveContainer do Recharts que espera
 * o container ter dimensões válidas antes de renderizar.
 */
export function SafeResponsiveContainer({
  children,
  className,
  style,
  ...props
}: ComponentProps<typeof ResponsiveContainer> & {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { containerRef, ready } = useChartReady();

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {ready && (
        <ResponsiveContainer {...props}>
          {children as ReactElement}
        </ResponsiveContainer>
      )}
    </div>
  );
}
