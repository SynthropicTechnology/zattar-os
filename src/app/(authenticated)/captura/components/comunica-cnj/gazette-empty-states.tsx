'use client';

import { Search, RefreshCw, CheckCircle2, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 1. No search results
export function EmptyNoResults({ onLimpar }: { onLimpar: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-muted/30 mb-4">
        <Search className="w-6 h-6 text-muted-foreground/50" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground/50 mb-1">
        Nenhuma publicação encontrada
      </h3>
      <p className="text-xs text-muted-foreground/25 max-w-xs mb-4">
        Tente ajustar os filtros ou buscar com termos diferentes
      </p>
      <Button variant="outline" size="sm" onClick={onLimpar}>
        Limpar Filtros
      </Button>
    </div>
  );
}

// 2. First time (no data yet)
export function EmptyFirstTime({ onSync }: { onSync: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <RefreshCw className="w-6 h-6 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground/50 mb-1">
        Nenhuma publicação capturada ainda
      </h3>
      <p className="text-xs text-muted-foreground/25 max-w-xs mb-4">
        Inicie a primeira sincronização para buscar publicações do Diário Oficial
      </p>
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90 mb-4"
        onClick={onSync}
      >
        Sincronizar Agora
      </Button>
      <div className="flex gap-2 max-w-xs w-full">
        <div className="flex-1 bg-muted/20 border border-border/20 rounded-lg p-2.5 text-left hover:border-primary/25 transition-colors cursor-pointer">
          <p className="text-xs font-medium text-foreground/70 mb-0.5">Configurar OAB</p>
          <p className="text-[11px] text-muted-foreground/50 leading-tight">
            Vincule advogados para captura automática
          </p>
        </div>
        <div className="flex-1 bg-muted/20 border border-border/20 rounded-lg p-2.5 text-left hover:border-primary/25 transition-colors cursor-pointer">
          <p className="text-xs font-medium text-foreground/70 mb-0.5">Selecionar Tribunais</p>
          <p className="text-[11px] text-muted-foreground/50 leading-tight">
            Escolha as fontes para monitoramento
          </p>
        </div>
      </div>
    </div>
  );
}

// 3. All orphans resolved
export function EmptyAllResolved() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-success/10 mb-4">
        <CheckCircle2 className="w-6 h-6 text-success" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground/50 mb-1">
        Tudo resolvido!
      </h3>
      <p className="text-xs text-muted-foreground/25 max-w-xs">
        Todas as comunicações órfãs foram vinculadas ou marcadas como irrelevantes
      </p>
    </div>
  );
}

// 4. No deadlines
export function EmptyNoDeadlines() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-muted/30 mb-4">
        <Sun className="w-6 h-6 text-muted-foreground/50" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground/50 mb-1">
        Nenhum prazo urgente
      </h3>
      <p className="text-xs text-muted-foreground/25 max-w-xs">
        Sem prazos vencendo nas próximas 48 horas. Tudo sob controle.
      </p>
    </div>
  );
}
