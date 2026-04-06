'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Clock,
  FileText,
  SearchX,
  Users,
  UserX,
  Layers3,
  FolderOpen,
} from 'lucide-react';
import { AppBadge } from '@/components/ui/app-badge';
import { TemporalViewError, TemporalViewLoading } from '@/components/shared';
import { GlassPanel } from '@/components/shared/glass-panel';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import {
  InsightBanner,
  UrgencyDot,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { cn } from '@/lib/utils';
import { GRAU_TRIBUNAL_LABELS, ORIGEM_EXPEDIENTE_LABELS, type Expediente } from '../domain';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import { ExpedienteControlDetailSheet } from './expediente-control-detail-sheet';

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

interface ExpedientesControlViewProps {
  viewModeSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
}

type QueueMode = 'todos' | 'criticos' | 'hoje' | 'proximos' | 'sem_responsavel' | 'sem_tipo';
type ContentMode = 'cards' | 'list';
type UrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUsuarioNome(usuario: UsuarioData) {
  return usuario.nomeExibicao || usuario.nome_exibicao || usuario.nomeCompleto || usuario.nome || `Usuario ${usuario.id}`;
}

function normalizarData(dataISO: string | null | undefined) {
  if (!dataISO) return null;
  const data = new Date(dataISO);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function calcularDiasRestantes(expediente: Expediente) {
  const prazo = normalizarData(expediente.dataPrazoLegalParte);
  if (!prazo) return null;
  const hoje = new Date();
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((prazo.getTime() - hojeZerado.getTime()) / 86400000);
}

function formatarDataCurta(dataISO: string | null | undefined) {
  if (!dataISO) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dataISO));
  } catch {
    return '—';
  }
}

function getExpedienteUrgencyLevel(expediente: Expediente, diasRestantes: number | null): UrgencyLevel {
  if (expediente.baixadoEm) return 'ok';
  if (expediente.prazoVencido || (diasRestantes !== null && diasRestantes < 0)) return 'critico';
  if (diasRestantes === 0) return 'alto';
  if (diasRestantes !== null && diasRestantes <= 3) return 'medio';
  return 'baixo';
}

function getDiasLabel(diasRestantes: number | null, prazoVencido: boolean): string {
  if (diasRestantes === null) return 'Sem prazo';
  if (prazoVencido || diasRestantes < 0) return `${Math.abs(diasRestantes)}d vencido`;
  if (diasRestantes === 0) return 'Vence hoje';
  if (diasRestantes === 1) return 'Vence amanhã';
  return `${diasRestantes}d restantes`;
}

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-[3px] border-l-destructive/70',
  alto: 'border-l-[3px] border-l-amber-500/70',
  medio: 'border-l-[3px] border-l-primary/50',
  baixo: 'border-l-[3px] border-l-border/30',
  ok: 'border-l-[3px] border-l-success/40',
};

const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  critico: 'Vencido',
  alto: 'Hoje',
  medio: 'Em breve',
  baixo: 'No prazo',
  ok: 'Baixado',
};

const URGENCY_BADGE_VARIANT: Record<UrgencyLevel, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  critico: 'destructive',
  alto: 'default',
  medio: 'outline',
  baixo: 'outline',
  ok: 'secondary',
};

// ─── Metric Card ──────────────────────────────────────────────────────────────

function ControlMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  highlight,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  highlight?: boolean;
}) {
  return (
    <GlassPanel
      depth={value > 0 && highlight ? 2 : 1}
      className={cn('p-4 gap-1.5', value > 0 && highlight && 'border-destructive/15')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">{title}</p>
          <p className={cn(
            'mt-1 text-2xl font-bold tabular-nums tracking-tight',
            value > 0 && highlight && 'text-destructive/80',
          )}>
            {value}
          </p>
        </div>
        <div className={cn('rounded-xl border border-border/20 p-2 shrink-0 mt-0.5', value > 0 && highlight ? 'border-destructive/20 bg-destructive/6' : 'bg-white/2')}>
          <Icon className={cn('size-4', iconClassName ?? 'text-muted-foreground/50')} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/50 leading-snug">{subtitle}</p>
    </GlassPanel>
  );
}

function EmptyQueue({ search }: { search: string }) {
  return (
    <GlassPanel depth={1} className="flex min-h-[180px] flex-col items-center justify-center p-8 text-center">
      <SearchX className="size-10 text-muted-foreground/20" />
      <h3 className="mt-4 text-sm font-semibold">Nenhum expediente nesta fila</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground/55">
        {search
          ? 'Ajuste a busca para ampliar o recorte operacional.'
          : 'A fila selecionada nao possui expedientes dentro dos criterios ativos.'}
      </p>
    </GlassPanel>
  );
}

function QueueCard({
  expediente,
  responsavelNome,
  tipoExpedienteNome,
  selected,
  onSelect,
}: {
  expediente: Expediente;
  responsavelNome?: string | null;
  tipoExpedienteNome?: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const diasRestantes = calcularDiasRestantes(expediente);
  const urgencyLevel = getExpedienteUrgencyLevel(expediente, diasRestantes);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full cursor-pointer text-left transition-all"
    >
      <GlassPanel
        depth={selected ? 2 : 1}
        className={cn(
          'gap-0 overflow-hidden p-0 hover:border-primary/20 hover:bg-primary/[0.025]',
          URGENCY_BORDER[urgencyLevel],
          selected && 'border-primary/20 bg-primary/[0.025]',
        )}
      >
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <UrgencyDot level={urgencyLevel} />
              <h3 className="truncate text-sm font-semibold leading-snug text-foreground">
                {tipoExpedienteNome || 'Expediente sem classificacao'}
              </h3>
            </div>
            <AppBadge variant={URGENCY_BADGE_VARIANT[urgencyLevel]} className="shrink-0">
              {URGENCY_LABEL[urgencyLevel]}
            </AppBadge>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-muted-foreground/70">{expediente.numeroProcesso}</p>
              <div className="mt-1.5 flex items-center gap-2">
                {expediente.trt && (
                  <AppBadge variant="outline" className="px-1.5 text-[10px]">{expediente.trt}</AppBadge>
                )}
                <AppBadge variant="outline" className="px-1.5 text-[10px]">{GRAU_TRIBUNAL_LABELS[expediente.grau]}</AppBadge>
                {responsavelNome && (
                  <span className="truncate text-[10px] text-muted-foreground/45">· {responsavelNome}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              {expediente.dataPrazoLegalParte ? (
                <>
                  <p className="text-xs font-semibold tabular-nums">{formatarDataCurta(expediente.dataPrazoLegalParte)}</p>
                  {diasRestantes !== null && !expediente.baixadoEm && (
                    <p className={cn(
                      'mt-0.5 text-[10px] tabular-nums',
                      urgencyLevel === 'critico' ? 'text-destructive/70 font-semibold' :
                      urgencyLevel === 'alto' ? 'text-amber-500/80 font-semibold' :
                      'text-muted-foreground/50',
                    )}>
                      {getDiasLabel(diasRestantes, expediente.prazoVencido)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground/35">Sem prazo</p>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>
    </button>
  );
}

function QueueListRow({
  expediente,
  responsavelNome,
  tipoExpedienteNome,
  selected,
  onSelect,
}: {
  expediente: Expediente;
  responsavelNome?: string | null;
  tipoExpedienteNome?: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const diasRestantes = calcularDiasRestantes(expediente);
  const urgencyLevel = getExpedienteUrgencyLevel(expediente, diasRestantes);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
        URGENCY_BORDER[urgencyLevel],
        selected
          ? 'border-primary/15 bg-primary/[0.05]'
          : 'border-border/15 hover:border-border/25 hover:bg-white/[0.025]',
      )}
    >
      <UrgencyDot level={urgencyLevel} />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tipoExpedienteNome || 'Sem tipo'}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground/55">{expediente.numeroProcesso}</p>
        </div>
        {responsavelNome && (
          <p className="hidden max-w-[100px] truncate text-[11px] text-muted-foreground/45 sm:block">{responsavelNome}</p>
        )}
        <div className="shrink-0 text-right">
          {expediente.dataPrazoLegalParte ? (
            <>
              <p className="text-xs font-semibold tabular-nums">{formatarDataCurta(expediente.dataPrazoLegalParte)}</p>
              {diasRestantes !== null && (
                <p className={cn(
                  'text-[10px] tabular-nums',
                  urgencyLevel === 'critico' ? 'text-destructive/70 font-semibold' :
                  urgencyLevel === 'alto' ? 'text-amber-500/80' : 'text-muted-foreground/45',
                )}>
                  {getDiasLabel(diasRestantes, expediente.prazoVencido)}
                </p>
              )}
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground/35">—</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function ExpedientesControlView({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesControlViewProps) {
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposExpedientes: tiposFetched } = useTiposExpedientes({ limite: 100 });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposExpedientes = tiposExpedientesData ?? tiposFetched;

  const [queueMode, setQueueMode] = React.useState<QueueMode>('todos');
  const [contentMode, setContentMode] = React.useState<ContentMode>('cards');
  const [search, setSearch] = React.useState('');
  const [selectedExpediente, setSelectedExpediente] = React.useState<Expediente | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const { expedientes, isLoading, error, refetch } = useExpedientes({
    pagina: 1,
    limite: 300,
    baixado: false,
    incluirSemPrazo: true,
    busca: search || undefined,
  });

  const usuariosMap = React.useMemo(() => {
    const map = new Map<number, string>();
    usuarios.forEach((usuario) => map.set(usuario.id, getUsuarioNome(usuario)));
    return map;
  }, [usuarios]);

  const tiposMap = React.useMemo(() => {
    const map = new Map<number, string>();
    tiposExpedientes.forEach((tipo) => {
      const nomeAlternativo = 'tipo_expediente' in tipo ? tipo.tipo_expediente : undefined;
      map.set(tipo.id, tipo.tipoExpediente || nomeAlternativo || `Tipo ${tipo.id}`);
    });
    return map;
  }, [tiposExpedientes]);

  const dadosDerivados = React.useMemo(() => {
    const pendentes = expedientes.filter((item) => !item.baixadoEm);
    const vencidos = pendentes.filter((item) => item.prazoVencido);
    const hoje = pendentes.filter((item) => {
      const diasRestantes = calcularDiasRestantes(item);
      return diasRestantes === 0;
    });
    const proximos = pendentes.filter((item) => {
      const diasRestantes = calcularDiasRestantes(item);
      return diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 3;
    });
    const semResponsavel = pendentes.filter((item) => !item.responsavelId);
    const semTipo = pendentes.filter((item) => !item.tipoExpedienteId);
    const manuais = pendentes.filter((item) => item.origem === 'manual');
    const capturados = pendentes.filter((item) => item.origem !== 'manual');

    const rankingResponsaveis = Array.from(
      pendentes.reduce((acc, item) => {
        const chave = item.responsavelId ?? 0;
        const atual = acc.get(chave) ?? 0;
        acc.set(chave, atual + 1);
        return acc;
      }, new Map<number, number>()).entries()
    )
      .map(([responsavelId, total]) => ({
        responsavelId,
        total,
        nome: responsavelId === 0 ? 'Sem responsavel' : usuariosMap.get(responsavelId) || `Usuario ${responsavelId}`,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    const origemDistribuicao = Object.entries(
      pendentes.reduce<Record<string, number>>((acc, item) => {
        acc[item.origem] = (acc[item.origem] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([origem, total]) => ({ origem, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const filas: Record<QueueMode, Expediente[]> = {
      todos: pendentes,
      criticos: vencidos,
      hoje,
      proximos,
      sem_responsavel: semResponsavel,
      sem_tipo: semTipo,
    };

    return {
      pendentes,
      vencidos,
      hoje,
      proximos,
      semResponsavel,
      semTipo,
      manuais,
      capturados,
      rankingResponsaveis,
      origemDistribuicao,
      filas,
    };
  }, [expedientes, usuariosMap]);

  const queueTabs = React.useMemo<TabPillOption[]>(() => [
    { id: 'todos', label: 'Todos', count: dadosDerivados.pendentes.length },
    { id: 'criticos', label: 'Criticos', count: dadosDerivados.vencidos.length },
    { id: 'hoje', label: 'Hoje', count: dadosDerivados.hoje.length },
    { id: 'proximos', label: '3 dias', count: dadosDerivados.proximos.length },
    { id: 'sem_responsavel', label: 'Sem dono', count: dadosDerivados.semResponsavel.length },
    { id: 'sem_tipo', label: 'Sem tipo', count: dadosDerivados.semTipo.length },
  ], [dadosDerivados]);

  const contentOptions = React.useMemo<ViewToggleOption[]>(() => [
    { id: 'cards', label: 'Cards', icon: Layers3 },
    { id: 'list', label: 'Lista', icon: FileText },
  ], []);

  const expedientesDaFila = React.useMemo(() => {
    const fila = dadosDerivados.filas[queueMode] || [];

    return [...fila].sort((a, b) => {
      const aDias = calcularDiasRestantes(a);
      const bDias = calcularDiasRestantes(b);

      if (a.prazoVencido !== b.prazoVencido) return a.prazoVencido ? -1 : 1;
      if (aDias === null && bDias !== null) return 1;
      if (aDias !== null && bDias === null) return -1;
      if (aDias !== null && bDias !== null && aDias !== bDias) return aDias - bDias;
      return (a.numeroProcesso || '').localeCompare(b.numeroProcesso || '');
    });
  }, [dadosDerivados, queueMode]);

  React.useEffect(() => {
    if (!selectedExpediente) return;

    const aindaExiste = expedientesDaFila.some((item) => item.id === selectedExpediente.id)
      || dadosDerivados.pendentes.some((item) => item.id === selectedExpediente.id);

    if (!aindaExiste) {
      setSelectedExpediente(null);
      setDetailOpen(false);
    }
  }, [dadosDerivados.pendentes, expedientesDaFila, selectedExpediente]);

  if (isLoading) {
    return <TemporalViewLoading message="Carregando centro de comando de expedientes..." />;
  }

  if (error) {
    return <TemporalViewError message={`Erro ao carregar expedientes: ${error}`} onRetry={refetch} />;
  }

  return (
    <>
      <div className="mx-auto flex max-w-350 flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Controle de Expedientes</h1>
            <p className="mt-1 text-sm text-muted-foreground/50">
              Triagem central de risco, classificacao e distribuicao operacional do escritorio.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {viewModeSlot}
            {settingsSlot}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <ControlMetricCard
            title="Vencidos"
            value={dadosDerivados.vencidos.length}
            subtitle="Pedem intervencao imediata"
            icon={AlertTriangle}
            iconClassName="text-destructive/60"
            highlight
          />
          <ControlMetricCard
            title="Hoje"
            value={dadosDerivados.hoje.length}
            subtitle="Fechamento do dia"
            icon={Clock}
            iconClassName="text-amber-500/70"
          />
          <ControlMetricCard
            title="3 dias"
            value={dadosDerivados.proximos.length}
            subtitle="Janela curta de resposta"
            icon={FileText}
            iconClassName="text-primary/60"
          />
          <ControlMetricCard
            title="Sem dono"
            value={dadosDerivados.semResponsavel.length}
            subtitle="Sem responsavel definido"
            icon={UserX}
            iconClassName="text-amber-500/60"
          />
          <ControlMetricCard
            title="Sem tipo"
            value={dadosDerivados.semTipo.length}
            subtitle="Classificacao incompleta"
            icon={Layers3}
            iconClassName="text-muted-foreground/50"
          />
        </div>

        {dadosDerivados.vencidos.length > 0 && (
          <InsightBanner type="alert">
            <strong>{dadosDerivados.vencidos.length} expediente(s) com prazo vencido</strong> — Esses itens requerem intervencao imediata. Use a fila Criticos para triagem prioritaria.
          </InsightBanner>
        )}
        {dadosDerivados.vencidos.length === 0 && dadosDerivados.semResponsavel.length > 3 && (
          <InsightBanner type="warning">
            <strong>{dadosDerivados.semResponsavel.length} expedientes sem responsavel</strong> — Distribua esses itens para evitar filas cegas e perda de prazo.
          </InsightBanner>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          <div className="flex min-w-0 flex-col gap-4">

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <TabPills tabs={queueTabs} active={queueMode} onChange={(value) => setQueueMode(value as QueueMode)} />
              <div className="flex items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar processo, parte, orgao..." className="w-full" />
                <ViewToggle mode={contentMode} onChange={(mode) => setContentMode(mode as ContentMode)} options={contentOptions} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {expedientesDaFila.length === 0 ? (
                <EmptyQueue search={search} />
              ) : contentMode === 'list' ? (
                <GlassPanel depth={1} className="gap-1 p-2">
                  {expedientesDaFila.map((expediente) => (
                    <QueueListRow
                      key={expediente.id}
                      expediente={expediente}
                      responsavelNome={expediente.responsavelId ? usuariosMap.get(expediente.responsavelId) : null}
                      tipoExpedienteNome={expediente.tipoExpedienteId ? tiposMap.get(expediente.tipoExpedienteId) : null}
                      selected={selectedExpediente?.id === expediente.id}
                      onSelect={() => {
                        setSelectedExpediente(expediente);
                        setDetailOpen(true);
                      }}
                    />
                  ))}
                </GlassPanel>
              ) : (
                expedientesDaFila.map((expediente) => (
                  <QueueCard
                    key={expediente.id}
                    expediente={expediente}
                    responsavelNome={expediente.responsavelId ? usuariosMap.get(expediente.responsavelId) : null}
                    tipoExpedienteNome={expediente.tipoExpedienteId ? tiposMap.get(expediente.tipoExpedienteId) : null}
                    selected={selectedExpediente?.id === expediente.id}
                    onSelect={() => {
                      setSelectedExpediente(expediente);
                      setDetailOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <GlassPanel depth={1} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Capacidade</p>
                  <h2 className="mt-1 text-sm font-semibold">Carga por responsavel</h2>
                </div>
                <Users className="size-4 text-muted-foreground/45" />
              </div>

              <div className="mt-4 space-y-3">
                {dadosDerivados.rankingResponsaveis.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60">Nenhuma distribuicao ativa.</p>
                ) : (
                  dadosDerivados.rankingResponsaveis.map((item) => {
                    const maximo = dadosDerivados.rankingResponsaveis[0]?.total || 1;
                    const largura = `${(item.total / maximo) * 100}%`;

                    return (
                      <div key={item.responsavelId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-[11px]">{item.nome}</span>
                          <span className="tabular-nums text-[11px] text-muted-foreground/60">{item.total}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border/10">
                          <div className="h-1.5 rounded-full bg-primary/40 transition-all" style={{ width: largura }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassPanel>

            <GlassPanel depth={1} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Radar</p>
                  <h2 className="mt-1 text-sm font-semibold">Sinais do acervo</h2>
                </div>
                <FolderOpen className="size-4 text-muted-foreground/45" />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border/15 px-3 py-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Sem responsavel</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums tracking-tight">{dadosDerivados.semResponsavel.length}</p>
                  </div>
                  <UserX className="size-4 text-muted-foreground/30" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/15 px-3 py-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Sem classificacao</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums tracking-tight">{dadosDerivados.semTipo.length}</p>
                  </div>
                  <Layers3 className="size-4 text-muted-foreground/30" />
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {dadosDerivados.origemDistribuicao.map((item) => (
                  <div key={item.origem} className="flex items-center justify-between gap-3 rounded-xl border border-border/10 px-3 py-2">
                    <p className="text-[11px] text-muted-foreground/70">
                      {ORIGEM_EXPEDIENTE_LABELS[item.origem as keyof typeof ORIGEM_EXPEDIENTE_LABELS]}
                    </p>
                    <AppBadge variant="outline">{item.total}</AppBadge>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>

      <ExpedienteControlDetailSheet
        expediente={selectedExpediente}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        responsavelNome={selectedExpediente?.responsavelId ? usuariosMap.get(selectedExpediente.responsavelId) : null}
        tipoExpedienteNome={selectedExpediente?.tipoExpedienteId ? tiposMap.get(selectedExpediente.tipoExpedienteId) : null}
      />
    </>
  );
}