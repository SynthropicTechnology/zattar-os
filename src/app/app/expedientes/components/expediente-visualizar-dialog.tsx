'use client';

/**
 * Color semantics:
 * - green-* (success, confirmed, active states)
 * - orange-* (warnings, pending states, type badges)
 * - red/destructive (errors, critical states)
 */

// Componente Dialog para visualizar detalhes completos de um expediente

import * as React from 'react';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Calendar, FileText, Users, Building2, Scale, AlertCircle } from 'lucide-react';
import { Expediente, GrauTribunal, GRAU_TRIBUNAL_LABELS } from '../domain';
import type { Usuario } from '@/app/app/usuarios';
import type { TipoExpediente } from '@/app/app/tipos-expedientes';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { SemanticBadge } from '@/components/ui/semantic-badge';


interface ExpedienteVisualizarDialogProps {
  expediente: Expediente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarios?: Usuario[];
  tiposExpedientes?: TipoExpediente[];
}

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata data ISO para formato brasileiro com hora (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: GrauTribunal): string => {
  return GRAU_TRIBUNAL_LABELS[grau] || grau;
};

/**
 * Retorna a classe CSS de cor para badge do tipo de expediente
 */
const getTipoExpedienteColorClass = (tipoId: number): string => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
    'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800',
    'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800',
    'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-800',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-800',
  ];
  const index = (tipoId - 1) % colors.length;
  return colors[index];
};

export function ExpedienteVisualizarDialog({
  expediente,
  open,
  onOpenChange,
  usuarios = [],
  tiposExpedientes = [],
}: ExpedienteVisualizarDialogProps) {
  const responsavel = usuarios.find(u => u.id === expediente.responsavelId);
  const tipoExpediente = tiposExpedientes.find(t => t.id === expediente.tipoExpedienteId);

  const handleAbrirPagina = () => {
    // Por enquanto, apenas fecha o diálogo
    // A página será criada posteriormente
    onOpenChange(false);
    // TODO: Navegar para /expedientes/[id] quando a página for criada
    // router.push(`/expedientes/${expediente.id}`);
  };

  const footerButtons = (
    <div className="flex w-full items-center justify-end gap-2">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Fechar
      </Button>
      <Button onClick={handleAbrirPagina}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Abrir Expediente
      </Button>
    </div>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={`${expediente.classeJudicial ? expediente.classeJudicial + ' ' : ''}${expediente.numeroProcesso}`}
      maxWidth="2xl"
      footer={footerButtons}
    >
      <div className="flex gap-2 mb-4">
        <AppBadge variant={expediente.baixadoEm ? 'secondary' : 'default'}>
          {expediente.baixadoEm ? 'Baixado' : 'Pendente'}
        </AppBadge>
        {expediente.prazoVencido && (
          <AppBadge variant="destructive">Prazo Vencido</AppBadge>
        )}
      </div>

      <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
        <div className="space-y-6">
          {/* Informações do Processo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Scale className="h-4 w-4" />
              Informações do Processo
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Número do Processo</div>
                <div className="font-medium">{expediente.numeroProcesso}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Classe Judicial</div>
                <div className="font-medium">{expediente.classeJudicial || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">TRT</div>
                <SemanticBadge category="tribunal" value={expediente.trt} className="w-fit">
                  {expediente.trt}
                </SemanticBadge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Grau</div>
                <SemanticBadge category="grau" value={expediente.grau} className="w-fit">
                  {formatarGrau(expediente.grau)}
                </SemanticBadge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status do Processo</div>
                <div className="font-medium">{expediente.codigoStatusProcesso || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Prioridade</div>
                <AppBadge variant={expediente.prioridadeProcessual ? 'default' : 'secondary'}>
                  {expediente.prioridadeProcessual ? 'Sim' : 'Não'}
                </AppBadge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Segredo de Justiça</div>
                <AppBadge variant={expediente.segredoJustica ? 'destructive' : 'secondary'}>
                  {expediente.segredoJustica ? 'Sim' : 'Não'}
                </AppBadge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Juízo Digital</div>
                <AppBadge variant={expediente.juizoDigital ? 'outline' : 'outline'}>
                  {expediente.juizoDigital ? 'Sim' : 'Não'}
                </AppBadge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Partes Envolvidas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Users className="h-4 w-4" />
              Partes Envolvidas
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Parte Autora</div>
                <div className="font-medium">{expediente.nomeParteAutora || '-'}</div>
                {(expediente.qtdeParteAutora ?? 0) > 1 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {expediente.qtdeParteAutora} parte(s)
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Parte Ré</div>
                <div className="font-medium">{expediente.nomeParteRe || '-'}</div>
                {expediente.qtdeParteRe && expediente.qtdeParteRe > 1 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {expediente.qtdeParteRe} parte(s)
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Órgão Julgador */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Órgão Julgador
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Descrição</div>
                <div className="font-medium">{expediente.descricaoOrgaoJulgador || '-'}</div>
              </div>
              {expediente.siglaOrgaoJulgador && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Sigla</div>
                  <AppBadge variant="outline">{expediente.siglaOrgaoJulgador}</AppBadge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Datas e Prazos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Datas e Prazos
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Data de Autuação</div>
                <div className="font-medium">{formatarData(expediente.dataAutuacao)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Data de Ciência</div>
                <div className="font-medium">{formatarData(expediente.dataCienciaParte)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Prazo Legal</div>
                <div className={`font-medium ${expediente.prazoVencido ? 'text-destructive' : ''}`}>
                  {formatarData(expediente.dataPrazoLegalParte)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Criação do Expediente</div>
                <div className="font-medium">{formatarData(expediente.dataCriacaoExpediente)}</div>
              </div>
              {expediente.dataArquivamento && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Data de Arquivamento</div>
                  <div className="font-medium">{formatarData(expediente.dataArquivamento)}</div>
                </div>
              )}
              {expediente.baixadoEm && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Data de Baixa</div>
                  <div className="font-medium">{formatarDataHora(expediente.baixadoEm)}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tipo e Descrição */}
          {(tipoExpediente || expediente.descricaoArquivos) && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Tipo e Descrição
                </div>
                <div className="grid grid-cols-1 gap-4 pl-6">
                  {tipoExpediente && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Tipo de Expediente</div>
                      <AppBadge
                        variant="outline"
                        className={getTipoExpedienteColorClass(tipoExpediente.id)}
                      >
                        {tipoExpediente.tipoExpediente}
                      </AppBadge>
                    </div>
                  )}
                  {expediente.descricaoArquivos && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Descrição / Arquivos</div>
                      <div className="text-sm">{expediente.descricaoArquivos}</div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Baixa do Expediente */}
          {expediente.baixadoEm && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Informações de Baixa
                </div>
                <div className="grid grid-cols-1 gap-4 pl-6">
                  {expediente.protocoloId && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Protocolo ID</div>
                      <div className="font-medium font-mono">{expediente.protocoloId}</div>
                    </div>
                  )}
                  {expediente.justificativaBaixa && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Justificativa</div>
                      <div className="text-sm">{expediente.justificativaBaixa}</div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Responsável */}
          {responsavel && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Users className="h-4 w-4" />
                Responsável
              </div>
              <div className="pl-6">
                <div className="text-xs text-muted-foreground mb-1">Usuário Responsável</div>
                <div className="font-medium">{responsavel.nomeExibicao || responsavel.nomeCompleto}</div>
              </div>
            </div>
          )}

          {/* Informações Técnicas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <FileText className="h-4 w-4" />
              Informações Técnicas
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">ID PJE</div>
                <div className="font-medium font-mono">{expediente.idPje || '-'}</div>
              </div>
              {expediente.idDocumento && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ID Documento</div>
                  <div className="font-medium font-mono">{expediente.idDocumento}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Criado em</div>
                <div className="font-medium">{formatarDataHora(expediente.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Atualizado em</div>
                <div className="font-medium">{formatarDataHora(expediente.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </DialogFormShell>
  );
}
