'use client';

import * as React from 'react';
import { ClipboardList, Plus, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EntrevistaTrabalhista, EntrevistaAnexo, TipoLitigio, PerfilReclamante } from '../domain';
import { STATUS_ENTREVISTA_LABELS, MODULO_LABELS, type ModuloEntrevista } from '../domain';
import { useEntrevista } from '../hooks/use-entrevista';
import { NoZeroSelector } from './no-zero-selector';
import { EntrevistaWizard } from './entrevista-wizard';
import { EntrevistaResumo } from './entrevista-resumo';

interface EntrevistaTabProps {
  contratoId: number;
  entrevista: EntrevistaTrabalhista | null;
  anexos: EntrevistaAnexo[];
}

type ViewState = 'empty' | 'no_zero' | 'wizard' | 'resumo';

export function EntrevistaTab({ contratoId, entrevista: initialEntrevista, anexos }: EntrevistaTabProps) {
  const { iniciar, isLoading } = useEntrevista();

  const [entrevista, setEntrevista] = React.useState<EntrevistaTrabalhista | null>(initialEntrevista);

  const getViewState = (): ViewState => {
    if (!entrevista) return 'empty';
    if (entrevista.status === 'concluida') return 'resumo';
    if (entrevista.status === 'em_andamento') return 'wizard';
    return 'no_zero'; // rascunho
  };

  const [view, setView] = React.useState<ViewState>(getViewState);

  const handleNoZeroSelect = async (tipoLitigio: TipoLitigio, perfilReclamante?: PerfilReclamante) => {
    const result = await iniciar(contratoId, tipoLitigio, perfilReclamante);
    if (result) {
      setEntrevista(result);
      setView('wizard');
    }
  };

  const handleFinish = () => {
    setView('resumo');
  };

  const handleReabrir = () => {
    setView('wizard');
  };

  // Estado vazio: nenhuma entrevista existe
  if (view === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Nenhuma entrevista realizada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicie uma entrevista trabalhista para coletar os fatos probatórios do caso
          </p>
        </div>
        <Button onClick={() => setView('no_zero')}>
          <Plus className="mr-2 h-4 w-4" />
          Iniciar Entrevista
        </Button>
      </div>
    );
  }

  // Nó Zero: seleção do tipo de litígio
  if (view === 'no_zero') {
    return <NoZeroSelector onSelect={handleNoZeroSelect} isLoading={isLoading} />;
  }

  // Wizard: entrevista em andamento
  if (view === 'wizard' && entrevista) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{STATUS_ENTREVISTA_LABELS[entrevista.status]}</Badge>
            <span className="text-sm text-muted-foreground">
              Módulo atual: {MODULO_LABELS[entrevista.moduloAtual as ModuloEntrevista] ?? entrevista.moduloAtual}
            </span>
          </div>
        </div>
        <EntrevistaWizard
          entrevista={entrevista}
          contratoId={contratoId}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  // Resumo: entrevista concluída
  if (view === 'resumo' && entrevista) {
    return (
      <EntrevistaResumo
        entrevista={entrevista}
        anexos={anexos}
        contratoId={contratoId}
        onReabrir={handleReabrir}
      />
    );
  }

  return null;
}
