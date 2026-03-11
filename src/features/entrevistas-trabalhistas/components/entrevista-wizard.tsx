'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  EntrevistaTrabalhista,
  RespostasEntrevista,
} from '../domain';
import { getModulosPorTrilha, MODULO_LABELS, type ModuloEntrevista } from '../domain';
import { useEntrevista } from '../hooks/use-entrevista';
// Trilha A — Clássico
import { ModuloVinculo } from './modulo-vinculo';
import { ModuloJornada } from './modulo-jornada';
import { ModuloSaudeAmbiente } from './modulo-saude-ambiente';
import { ModuloRuptura } from './modulo-ruptura';
// Trilha B — Gig Economy
import { ModuloControleAlgoritmico } from './modulo-controle-algoritmico';
import { ModuloDependenciaEconomica } from './modulo-dependencia-economica';
import { ModuloCondicoesTrabalhoGig } from './modulo-condicoes-trabalho-gig';
import { ModuloDesligamentoPlataforma } from './modulo-desligamento-plataforma';
// Trilha C — Pejotização
import { ModuloContratoPJ } from './modulo-contrato-pj';
import { ModuloSubordinacaoReal } from './modulo-subordinacao-real';
import { ModuloExclusividadePessoalidade } from './modulo-exclusividade-pessoalidade';
import { ModuloFraudeVerbas } from './modulo-fraude-verbas';
import { TestemunhasToggle } from './testemunhas-toggle';

interface EntrevistaWizardProps {
  entrevista: EntrevistaTrabalhista;
  contratoId: number;
  onFinish: () => void;
}

export function EntrevistaWizard({ entrevista, contratoId, onFinish }: EntrevistaWizardProps) {
  const { salvarModulo, finalizar, isLoading, error } = useEntrevista();

  // Determinar módulos da trilha ativa
  const modulos = getModulosPorTrilha(entrevista.tipoLitigio);

  // Determinar step inicial baseado no modulo_atual salvo
  const getInitialStep = () => {
    const idx = modulos.indexOf(entrevista.moduloAtual as ModuloEntrevista);
    return idx >= 0 ? idx : 0;
  };

  const [currentStep, setCurrentStep] = React.useState(getInitialStep);
  const [testemunhas, setTestemunhas] = React.useState(entrevista.testemunhasMapeadas);

  // Estado unificado das respostas (carregado do que já foi salvo)
  const [respostas, setRespostas] = React.useState<RespostasEntrevista>(
    entrevista.respostas ?? {},
  );

  const updateModuloData = <K extends keyof RespostasEntrevista>(
    key: K,
    data: RespostasEntrevista[K],
  ) => {
    setRespostas((prev) => ({ ...prev, [key]: data }));
  };

  const currentModulo = modulos[currentStep];
  const isLastStep = currentStep === modulos.length - 1;
  const isFirstStep = currentStep === 0;

  const getRespostasAtual = (): Record<string, unknown> => {
    return (respostas[currentModulo as keyof RespostasEntrevista] ?? {}) as Record<string, unknown>;
  };

  const handleSaveAndNext = async () => {
    const result = await salvarModulo(
      entrevista.id,
      contratoId,
      currentModulo,
      getRespostasAtual(),
      true, // avancar
    );
    if (result) {
      setCurrentStep((prev) => Math.min(prev + 1, modulos.length - 1));
    }
  };

  const handleSaveDraft = async () => {
    await salvarModulo(
      entrevista.id,
      contratoId,
      currentModulo,
      getRespostasAtual(),
      false,
    );
  };

  const handlePrevious = async () => {
    // Salvar antes de voltar
    await salvarModulo(
      entrevista.id,
      contratoId,
      currentModulo,
      getRespostasAtual(),
      false,
    );
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinalize = async () => {
    // Salvar último módulo antes de finalizar
    await salvarModulo(
      entrevista.id,
      contratoId,
      currentModulo,
      getRespostasAtual(),
      false,
    );

    const result = await finalizar(entrevista.id, contratoId, testemunhas);
    if (result) {
      onFinish();
    }
  };

  const renderModulo = () => {
    switch (currentModulo) {
      // Trilha A — Clássico
      case 'vinculo':
        return <ModuloVinculo data={respostas.vinculo ?? {}} onChange={(d) => updateModuloData('vinculo', d)} />;
      case 'jornada':
        return <ModuloJornada data={respostas.jornada ?? {}} onChange={(d) => updateModuloData('jornada', d)} />;
      case 'saude_ambiente':
        return <ModuloSaudeAmbiente data={respostas.saude_ambiente ?? {}} onChange={(d) => updateModuloData('saude_ambiente', d)} />;
      case 'ruptura':
        return <ModuloRuptura data={respostas.ruptura ?? {}} onChange={(d) => updateModuloData('ruptura', d)} />;
      // Trilha B — Gig Economy
      case 'controle_algoritmico':
        return <ModuloControleAlgoritmico data={respostas.controle_algoritmico ?? {}} onChange={(d) => updateModuloData('controle_algoritmico', d)} />;
      case 'dependencia_economica':
        return <ModuloDependenciaEconomica data={respostas.dependencia_economica ?? {}} onChange={(d) => updateModuloData('dependencia_economica', d)} />;
      case 'condicoes_trabalho_gig':
        return <ModuloCondicoesTrabalhoGig data={respostas.condicoes_trabalho_gig ?? {}} onChange={(d) => updateModuloData('condicoes_trabalho_gig', d)} />;
      case 'desligamento_plataforma':
        return <ModuloDesligamentoPlataforma data={respostas.desligamento_plataforma ?? {}} onChange={(d) => updateModuloData('desligamento_plataforma', d)} />;
      // Trilha C — Pejotização
      case 'contrato_pj':
        return <ModuloContratoPJ data={respostas.contrato_pj ?? {}} onChange={(d) => updateModuloData('contrato_pj', d)} />;
      case 'subordinacao_real':
        return <ModuloSubordinacaoReal data={respostas.subordinacao_real ?? {}} onChange={(d) => updateModuloData('subordinacao_real', d)} />;
      case 'exclusividade_pessoalidade':
        return <ModuloExclusividadePessoalidade data={respostas.exclusividade_pessoalidade ?? {}} onChange={(d) => updateModuloData('exclusividade_pessoalidade', d)} />;
      case 'fraude_verbas':
        return <ModuloFraudeVerbas data={respostas.fraude_verbas ?? {}} onChange={(d) => updateModuloData('fraude_verbas', d)} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper horizontal */}
      <nav className="flex items-center justify-between gap-2">
        {modulos.map((modulo, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <button
              key={modulo}
              type="button"
              onClick={async () => {
                if (index < currentStep) {
                  await salvarModulo(
                    entrevista.id,
                    contratoId,
                    currentModulo,
                    getRespostasAtual(),
                    false,
                  );
                  setCurrentStep(index);
                }
              }}
              disabled={index > currentStep}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg p-3 text-xs transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : isComplete
                    ? 'cursor-pointer text-muted-foreground hover:bg-muted'
                    : 'cursor-not-allowed text-muted-foreground/50'
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isComplete
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <span className="hidden font-medium sm:block">{MODULO_LABELS[modulo]}</span>
            </button>
          );
        })}
      </nav>

      {/* Conteúdo do módulo atual */}
      <Card>
        <CardContent className="p-6">
          {renderModulo()}
        </CardContent>
      </Card>

      {/* Testemunhas (visível no último step) */}
      {isLastStep && (
        <TestemunhasToggle checked={testemunhas} onCheckedChange={setTestemunhas} />
      )}

      {/* Erro */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isLoading}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <Button variant="ghost" onClick={handleSaveDraft} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Rascunho
        </Button>

        {isLastStep ? (
          <Button onClick={handleFinalize} disabled={isLoading}>
            {isLoading ? 'Finalizando...' : 'Finalizar Entrevista'}
            <CheckCircle2 className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSaveAndNext} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Próximo'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
