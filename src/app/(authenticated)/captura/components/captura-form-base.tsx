/**
 * @fileoverview Componente base de formulário para captura de processos
 *
 * @note Playwright automation é executado server-side via Server Actions.
 *       Este componente client-side NÃO importa Playwright para evitar
 *       inclusão no bundle do client.
 * @see src/features/captura/actions/ - Server Actions que executam Playwright
 * @see src/features/captura/services/ - Serviços server-side de captura
 * @see src/features/captura/drivers/ - Drivers Playwright server-side
 */
'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useAdvogados } from '@/app/(authenticated)/advogados';
import { useCredenciais } from '@/app/(authenticated)/advogados';
import type { Credencial } from '@/app/(authenticated)/captura/types';
import { AdvogadoCombobox } from './advogado-combobox';
import { CredenciaisCombobox } from './credenciais-combobox';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';

interface CapturaFormBaseProps {
  advogadoId: number | null;
  credenciaisSelecionadas: number[];
  onAdvogadoChange: (advogadoId: number | null) => void;
  onCredenciaisChange: (ids: number[]) => void;
  onCredenciaisDisponiveisChange?: (credenciais: Credencial[]) => void;
  children?: React.ReactNode;
}

/**
 * Componente base de formulário para captura
 * Novo fluxo: Selecionar Advogado → Selecionar Credenciais
 */
export function CapturaFormBase({
  advogadoId,
  credenciaisSelecionadas,
  onAdvogadoChange,
  onCredenciaisChange,
  onCredenciaisDisponiveisChange,
  children,
}: CapturaFormBaseProps) {
  // Buscar advogados com credenciais ativas
  const { advogados, isLoading: isLoadingAdvogados } = useAdvogados({
    com_credenciais: true,
  });

  // Buscar credenciais do advogado selecionado
  const { credenciais, isLoading: isLoadingCredenciais } = useCredenciais(
    advogadoId ? { advogado_id: advogadoId, active: true } : { advogado_id: 0, active: true }
  );

  // Limpar credenciais selecionadas quando mudar advogado
  useEffect(() => {
    if (advogadoId) {
      // Manter apenas credenciais que ainda existem para o novo advogado
      const idsValidos = credenciais
        .map((c) => c.id)
        .filter((id) => credenciaisSelecionadas.includes(id));
      if (idsValidos.length !== credenciaisSelecionadas.length) {
        onCredenciaisChange(idsValidos);
      }
    } else {
      onCredenciaisChange([]);
    }
  }, [advogadoId, credenciais]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onCredenciaisDisponiveisChange?.(credenciais);
  }, [credenciais, onCredenciaisDisponiveisChange]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passo 1: Selecionar Advogado */}
        <div className="space-y-3">
          <Label>Advogado *</Label>
          <AdvogadoCombobox
            advogados={advogados}
            selectedId={advogadoId}
            onSelectionChange={onAdvogadoChange}
            disabled={isLoadingAdvogados}
            isLoading={isLoadingAdvogados}
            placeholder="Selecione um advogado"
          />
          {advogados.length === 0 && !isLoadingAdvogados && (
            <Empty className="border-0 py-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircle className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle className="text-base">Nenhum advogado encontrado</EmptyTitle>
                <EmptyDescription className="text-sm">
                  Nenhum advogado com credenciais cadastradas encontrado. Cadastre credenciais antes de iniciar capturas.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        {/* Passo 2: Selecionar Credenciais do Advogado */}
        {advogadoId && (
          <div className="space-y-3">
            <Label>Credenciais *</Label>
            {isLoadingCredenciais ? (
              <div className="text-sm text-muted-foreground">Carregando credenciais...</div>
            ) : credenciais.length === 0 ? (
              <Empty className="border-0 py-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertCircle className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">Nenhuma credencial ativa encontrada</EmptyTitle>
                  <EmptyDescription className="text-sm">
                    Não há credenciais ativas para este advogado.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <CredenciaisCombobox
                credenciais={credenciais}
                selectedIds={credenciaisSelecionadas}
                onSelectionChange={onCredenciaisChange}
                disabled={isLoadingCredenciais}
                placeholder="Selecione credenciais..."
              />
            )}
          </div>
        )}
      </div>

      {/* Campos específicos do formulário filho */}
      {children}
    </div>
  );
}

/**
 * Valida se há advogado selecionado e credenciais selecionadas
 */
export function validarCamposCaptura(
  advogadoId: number | null,
  credenciaisSelecionadas: number[]
): boolean {
  if (!advogadoId) {
    return false;
  }
  if (credenciaisSelecionadas.length === 0) {
    return false;
  }
  return true;
}
