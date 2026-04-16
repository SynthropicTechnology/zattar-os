"use client";

import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PenLine,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { InsightBanner } from "@/app/(authenticated)/dashboard/mock/widgets/primitives";
import { TabPills } from "@/components/dashboard/tab-pills";
import { SearchInput } from "@/components/dashboard/search-input";
import {
  ViewToggle,
  type ViewToggleOption,
} from "@/components/dashboard/view-toggle";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import type { DocumentosStats } from '@/shared/assinatura-digital/services/documentos.service';
import type { DocumentoListItem } from '@/shared/assinatura-digital/adapters/documento-card-adapter';
import { useDocumentosPage } from '@/shared/assinatura-digital/hooks/use-documentos-page';
import { useDocumentosStats } from '@/shared/assinatura-digital/hooks/use-documentos-stats';
import { DocumentDetail } from '@/app/(authenticated)/assinatura-digital/components/documento-detail';
import { SignaturePipeline } from '@/app/(authenticated)/assinatura-digital/components/signature-pipeline';
import { AssinaturaDigitalPageNav } from "../../components/page-nav";
import { DocumentosGlassList } from "../../components/documentos-glass-list";

// ─── View Options ──────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: "cards", icon: LayoutGrid, label: "Cartões" },
  { id: "lista", icon: List, label: "Lista" },
];

// ─── KPI Card (padrao POC) ─────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  tile,
  iconColor,
  valueColor,
  meta,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tile: string;
  iconColor: string;
  valueColor?: string;
  meta?: string;
}) {
  return (
    <GlassPanel depth={2} className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
            {label}
          </p>
          <p
            className={`font-heading text-xl font-bold leading-none mt-1 tabular-nums ${valueColor ?? ""}`}
          >
            {value}
          </p>
        </div>
        <span
          className={`inline-flex size-8 items-center justify-center rounded-lg shrink-0 ${tile}`}
        >
          <Icon className={`size-4 ${iconColor}`} />
        </span>
      </div>
      {meta && (
        <p className="text-[11px] font-medium text-muted-foreground/70 mt-2.5">
          {meta}
        </p>
      )}
    </GlassPanel>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────

interface DocumentosCommandCenterProps {
  initialData: DocumentoListItem[];
  initialStats?: DocumentosStats;
}

// ─── Component ─────────────────────────────────────────────────────────

export function DocumentosCommandCenter({
  initialData,
  initialStats,
}: DocumentosCommandCenterProps) {
  const { stats } = useDocumentosStats(initialStats);
  const {
    docs,
    search,
    setSearch,
    activeStatus,
    setActiveStatus,
    viewMode,
    setViewMode,
    selectedDoc,
    handleSelect,
    pendingSigners,
  } = useDocumentosPage({ initialData });

  return (
    <div className="space-y-5">
      {/* ── Navegação do módulo ──────────────────────────── */}
      <AssinaturaDigitalPageNav />

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Documentos</Heading>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats?.total ?? 0} documentos ·{" "}
            <span className="text-info">{stats?.aguardando ?? 0} aguardando</span>
            {stats && stats.concluidos > 0 && (
              <>
                {" · "}
                <span className="text-success">{stats.concluidos} concluídos</span>
              </>
            )}
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/app/assinatura-digital/documentos/novo">
            <Plus className="size-3.5" />
            Novo documento
          </Link>
        </Button>
      </div>

      {/* ── KPI Strip ───────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard
            label="Total"
            value={stats.total}
            icon={FileText}
            tile="bg-primary/8"
            iconColor="text-primary/70"
            meta="documentos"
          />
          <KpiCard
            label="Rascunhos"
            value={stats.rascunhos}
            icon={PenLine}
            tile="bg-muted-foreground/8"
            iconColor="text-muted-foreground/60"
            meta="em edição"
          />
          <KpiCard
            label="Aguardando"
            value={stats.aguardando}
            icon={Clock}
            tile="bg-info/10"
            iconColor="text-info/70"
            meta="pendentes de assinatura"
          />
          <KpiCard
            label="Concluídos"
            value={stats.concluidos}
            icon={CheckCircle2}
            tile="bg-success/10"
            iconColor="text-success/70"
            valueColor="text-success"
            meta="finalizados"
          />
          <KpiCard
            label="Cancelados"
            value={stats.cancelados}
            icon={XCircle}
            tile="bg-destructive/10"
            iconColor="text-destructive/60"
            meta="arquivados"
          />
        </div>
      )}

      {/* ── Pipeline ────────────────────────────────────── */}
      {stats && <SignaturePipeline stats={stats} />}

      {/* ── Insight ─────────────────────────────────────── */}
      {pendingSigners.length > 0 && (
        <InsightBanner type="warning">
          {pendingSigners.length} assinante
          {pendingSigners.length > 1 ? "s" : ""} sem assinar há 7+ dias —
          considere reenviar os convites
        </InsightBanner>
      )}

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={[
            { id: "todos", label: "Todos", count: stats?.total ?? 0 },
            { id: "rascunho", label: "Rascunhos", count: stats?.rascunhos ?? 0 },
            { id: "pronto", label: "Aguardando", count: stats?.aguardando ?? 0 },
            { id: "concluido", label: "Concluídos", count: stats?.concluidos ?? 0 },
            { id: "cancelado", label: "Cancelados", count: stats?.cancelados ?? 0 },
          ]}
          active={activeStatus}
          onChange={setActiveStatus}
        />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar documento, assinante..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div
        className={`grid gap-4 ${selectedDoc ? "lg:grid-cols-[1fr_380px]" : ""}`}
      >
        <DocumentosGlassList
          documentos={docs}
          mode={viewMode === "cards" ? "cards" : "list"}
          selectedId={selectedDoc?.id}
          onSelect={handleSelect}
        />

        {selectedDoc && (
          <div className="hidden lg:block sticky top-4 self-start">
            <DocumentDetail
              doc={selectedDoc}
              onClose={() => handleSelect(selectedDoc)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
