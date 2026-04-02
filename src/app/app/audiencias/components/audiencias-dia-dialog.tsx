'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Video, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { Audiencia } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '../domain';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { AudienciasAlterarResponsavelDialog } from './audiencias-alterar-responsavel-dialog';
import { useUsuarios } from '@/app/app/usuarios';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasDiaDialogProps {
  /** Lista de audiências do dia */
  audiencias: Audiencia[];
  /** Data selecionada */
  data: Date;
  /** Estado de abertura */
  open: boolean;
  /** Callback para mudar estado */
  onOpenChange: (open: boolean) => void;
  /** Callback após ação (refetch) */
  onSuccess?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatarHora = (dataISO: string): string => {
  try {
    return format(new Date(dataISO), 'HH:mm', { locale: ptBR });
  } catch {
    return '-';
  }
};

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

function getUsuarioNome(u: Usuario): string {
  return u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`;
}

// =============================================================================
// COMPONENTE CARD DE AUDIÊNCIA
// =============================================================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTimeline } from '@/components/common/audit-log-timeline';
import { useAuditLogs } from '@/lib/domain/audit/hooks/use-audit-logs';

function AudienciaCard({
  audiencia,
  usuarios,
  onSuccess,
}: {
  audiencia: Audiencia;
  usuarios: Usuario[];
  onSuccess?: () => void;
}) {
  const [isResponsavelDialogOpen, setIsResponsavelDialogOpen] = React.useState(false);
  const { logs, isLoading: loadingLogs } = useAuditLogs('audiencias', audiencia.id);

  const responsavel = usuarios.find((u) => u.id === audiencia.responsavelId);
  const nomeResponsavel = responsavel ? getUsuarioNome(responsavel) : null;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-3 mt-0">
          {/* Header: Número do processo + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <SemanticBadge category="tribunal" value={audiencia.trt} className="text-xs shrink-0">
                  {audiencia.trt}
                </SemanticBadge>
                <SemanticBadge category="grau" value={audiencia.grau} className="text-xs shrink-0">
                  {GRAU_TRIBUNAL_LABELS[audiencia.grau] || audiencia.grau}
                </SemanticBadge>
              </div>
              <div className="font-semibold text-base truncate" title={audiencia.numeroProcesso}>
                {audiencia.numeroProcesso}
              </div>
            </div>
            <AudienciaStatusBadge status={audiencia.status} />
          </div>

          {/* Horário e Modalidade */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {formatarHora(audiencia.dataInicio)}
                {audiencia.dataFim && ` - ${formatarHora(audiencia.dataFim)}`}
              </span>
            </div>
            {audiencia.modalidade && (
              <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
            )}
          </div>

          {/* Tipo de Audiência */}
          {audiencia.tipoDescricao && (
            <div className="text-sm">
              <span className="text-muted-foreground">Tipo: </span>
              <span className="font-medium">{audiencia.tipoDescricao}</span>
            </div>
          )}

          {/* Local */}
          {(audiencia.salaAudienciaNome || audiencia.urlAudienciaVirtual) && (
            <div className="flex items-start gap-1.5 text-sm">
              {audiencia.modalidade === 'presencial' ? (
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              ) : (
                <Video className="h-4 w-4 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                {audiencia.salaAudienciaNome && <div>{audiencia.salaAudienciaNome}</div>}
                {audiencia.urlAudienciaVirtual && (
                  <a
                    href={audiencia.urlAudienciaVirtual}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate block"
                  >
                    {audiencia.urlAudienciaVirtual}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Partes */}
          <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Polo Ativo</div>
              <div className="font-medium truncate" title={audiencia.poloAtivoNome || ''}>
                {audiencia.poloAtivoNome || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Polo Passivo</div>
              <div className="font-medium truncate" title={audiencia.poloPassivoNome || ''}>
                {audiencia.poloPassivoNome || '-'}
              </div>
            </div>
          </div>

          {/* Responsável - Edição inline */}
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-1.5">Responsável</div>
            <button
              type="button"
              onClick={() => setIsResponsavelDialogOpen(true)}
              className="flex items-center gap-2 text-sm w-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1"
              title={nomeResponsavel ? `Clique para alterar responsável: ${nomeResponsavel}` : 'Clique para atribuir responsável'}
            >
              {responsavel ? (
                <>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={responsavel?.avatarUrl || undefined} alt={nomeResponsavel || undefined} />
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(nomeResponsavel)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{nomeResponsavel}</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sem responsável - clique para atribuir</span>
                </>
              )}
            </button>
          </div>

          <AudienciasAlterarResponsavelDialog
            open={isResponsavelDialogOpen}
            onOpenChange={setIsResponsavelDialogOpen}
            audiencia={audiencia}
            usuarios={usuarios}
            onSuccess={() => {
              onSuccess?.();
            }}
          />

          {/* Observações */}
          {audiencia.observacoes && (
            <div className="text-sm bg-muted/50 p-2 rounded border-t">
              <div className="text-xs text-muted-foreground mb-1">Observações</div>
              <div className="whitespace-pre-wrap">{audiencia.observacoes}</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-100" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasDiaDialog({
  audiencias,
  data,
  open,
  onOpenChange,
  onSuccess,
}: AudienciasDiaDialogProps) {
  // Estado do wizard - índice da audiência atual
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Carregar usuários para edição inline do responsável
  const { usuarios } = useUsuarios();

  // Reset index quando abre o dialog ou muda a lista
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open, audiencias]);

  const totalAudiencias = audiencias.length;
  const audienciaAtual = audiencias[currentIndex];

  // Navegação
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalAudiencias - 1 ? prev + 1 : prev));
  };

  // Título formatado
  const dataFormatada = format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Footer com navegação wizard
  const footerContent = (
    <div className="flex items-center justify-between w-full">
      {totalAudiencias > 1 ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} de {totalAudiencias}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === totalAudiencias - 1}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      )}
    </div>
  );

  if (!audienciaAtual) {
    return null;
  }

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span>Audiências - {dataFormatada}</span>
        </div>
      }
      maxWidth="2xl"
      footer={footerContent}
    >
      <ScrollArea className="max-h-[60vh] pr-4">
        <AudienciaCard
          audiencia={audienciaAtual}
          usuarios={usuarios}
          onSuccess={onSuccess}
        />
      </ScrollArea>
    </DialogFormShell>
  );
}
