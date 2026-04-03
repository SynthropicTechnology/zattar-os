import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  /** Título opcional do gráfico (exibido durante loading) */
  title?: string;
  /** Altura mínima do conteúdo do card */
  height?: string;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Skeleton para componentes de gráficos durante lazy loading
 *
 * @example
 * ```typescript
 * const WidgetFluxoCaixa = dynamic(
 *   () => import('@/app/(authenticated)/dashboard').then(m => ({ default: m.WidgetFluxoCaixa })),
 *   {
 *     ssr: false,
 *     loading: () => <ChartSkeleton title="Fluxo de Caixa" />
 *   }
 * );
 * ```
 */
export function ChartSkeleton({ title, height = '320px', className }: ChartSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        {title ? (
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
        ) : (
          <Skeleton className="h-5 w-48" />
        )}
      </CardHeader>
      <CardContent style={{ minHeight: height }}>
        <Skeleton className="h-full w-full" style={{ minHeight: `calc(${height} - 2rem)` }} />
      </CardContent>
    </Card>
  );
}
