"use client"

import * as React from "react"
import { Timeline, TimelineItem as TimelineItemComponent } from "./timeline"
import { FileText, Gavel, Calendar, Footprints } from "lucide-react"
import { cn } from "@/lib/utils"
// Using simplified inline interface to avoid dependency issues if types differ slightly
interface TimelineItemData {
  data: string;
  evento: string;
  descricao: string;
  tem_documento: boolean;
}

interface ProcessoTimelineProps {
  items: TimelineItemData[] | null | undefined
  className?: string
}

const ProcessoTimeline = React.forwardRef<HTMLDivElement, ProcessoTimelineProps>(
  ({ items, className, ...props }, ref) => {
    // Ordenar por data (mais recente primeiro)
    const sortedItems = React.useMemo(() => {
      if (!items) return [];
      return [...items].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [items]);

    // Agrupar movimentos por data para exibição
    const groupedItems = React.useMemo(() => {
      const grupos = sortedItems.reduce((acc, item) => {
        if (!acc[item.data]) {
          acc[item.data] = [];
        }
        acc[item.data].push(item);
        return acc;
      }, {} as Record<string, typeof sortedItems>);

      return Object.entries(grupos)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
    }, [sortedItems]);

    const formatarData = (data: string) => {
      // Synthropic returns YYYY-MM-DD
      const [year, month, day] = data.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    const getIconePorTipo = (titulo: string) => {
      const lower = titulo.toLowerCase();
      if (lower.includes('despacho') || lower.includes('decisão') || lower.includes('sentença') || lower.includes('julgado')) {
        return <Gavel className="h-4 w-4 text-white" />;
      }
      if (lower.includes('audiência')) {
        return <Calendar className="h-4 w-4 text-white" />;
      }
      if (lower.includes('documento') || lower.includes('petição')) {
        return <FileText className="h-4 w-4 text-white" />;
      }
      return <Footprints className="h-4 w-4 text-white" />;
    };

    if (!items || items.length === 0) {
      return (
        <div className={cn("w-full p-8 text-center text-muted-foreground", className)}>
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma movimentação encontrada para este processo.</p>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Timeline>
          {groupedItems.map(([data, itemsDoDia], index) => (
            <TimelineItemComponent
              key={`timeline-${data}-${index}`}
              date={formatarData(data)}
              title={`${itemsDoDia.length} atividade${itemsDoDia.length > 1 ? 's' : ''}`}
              description="Movimentações do dia"
              icon={getIconePorTipo(itemsDoDia[0]?.evento || '')}
              status="completed"
            >
              <div className="space-y-3">
                {itemsDoDia.map((item, idx) => (
                  <div
                    key={`mov-${data}-${idx}`}
                    className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-sm leading-relaxed flex items-center gap-2">
                          {item.evento}
                        </h4>

                        {item.descricao && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {item.descricao}
                          </p>
                        )}
                      </div>

                      {/* TODO: Implementar visualização de documento quando Synthropic fornecer URL
                      {item.tem_documento && (
                        <Button variant="outline" size="sm" onClick={() => visualizarDocumento(item.documento_url)}>
                          <FileText className="h-4 w-4 mr-1" />
                          Doc
                        </Button>
                      )}
                      */}
                    </div>
                  </div>
                ))}
              </div>
            </TimelineItemComponent>
          ))}
        </Timeline>
      </div>
    );
  }
);
ProcessoTimeline.displayName = "ProcessoTimeline";

export { ProcessoTimeline };
