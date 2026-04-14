"use client";

import {
  FileSignature,
  LayoutGrid,
  List,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PenLine,
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
import { IconContainer } from "@/components/ui/icon-container";
import type { DocumentosStats } from "../../feature/services/documentos.service";
import type { DocumentoListItem } from "../../feature/adapters/documento-card-adapter";
import { useDocumentosPage } from "../../feature/hooks/use-documentos-page";
import { useDocumentosStats } from "../../feature/hooks/use-documentos-stats";
import { DocumentCard } from "../../feature/components/documento-card";
import { DocumentListRow } from "../../feature/components/documento-list-row";
import { DocumentDetail } from "../../feature/components/documento-detail";
import { SignaturePipeline } from "../../feature/components/signature-pipeline";
import { AssinaturaDigitalPageNav } from "../../components/page-nav";
import { Heading } from '@/components/ui/typography';

// ─── View Options ──────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: "cards", icon: LayoutGrid, label: "Cartões" },
  { id: "lista", icon: List, label: "Lista" },
];

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
          <Heading level="page">
            Assinatura Digital
          </Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {stats?.total ?? 0} documentos &middot;{" "}
            {stats?.aguardando ?? 0} aguardando assinatura
          </p>
        </div>
        <Link
          href="/app/assinatura-digital/documentos/novo"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="size-3.5" />
          Novo documento
        </Link>
      </div>

      {/* ── Stats Cards — padrão canônico Glass Briefing ──── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: "Total", value: stats.total, Icon: FileText, tint: "bg-primary/8", iconColor: "text-primary/60" },
            { label: "Rascunhos", value: stats.rascunhos, Icon: PenLine, tint: "bg-muted-foreground/8", iconColor: "text-muted-foreground/60" },
            { label: "Aguardando", value: stats.aguardando, Icon: Clock, tint: "bg-info/10", iconColor: "text-info/70" },
            { label: "Concluídos", value: stats.concluidos, Icon: CheckCircle2, tint: "bg-success/10", iconColor: "text-success/70" },
            { label: "Cancelados", value: stats.cancelados, Icon: XCircle, tint: "bg-destructive/10", iconColor: "text-destructive/60" },
          ].map(({ label, value, Icon, tint, iconColor }) => (
            <GlassPanel key={label} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    {label}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums leading-none">
                    {value}
                  </p>
                </div>
                <IconContainer size="md" className={tint}>
                  <Icon className={`size-4 ${iconColor}`} />
                </IconContainer>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* ── Pipeline ────────────────────────────────────── */}
      {stats && <SignaturePipeline stats={stats} />}

      {/* ── Insight ─────────────────────────────────────── */}
      {pendingSigners.length > 0 && (
        <InsightBanner type="warning">
          {pendingSigners.length} assinante
          {pendingSigners.length > 1 ? "s" : ""} sem assinar há 7+ dias
          — considere reenviar os convites
        </InsightBanner>
      )}

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={[
            { id: "todos", label: "Todos", count: stats?.total ?? 0 },
            { id: "rascunho", label: "Rascunhos", count: stats?.rascunhos ?? 0 },
            { id: "pronto", label: "Aguardando", count: stats?.aguardando ?? 0 },
            {
              id: "concluido",
              label: "Concluídos",
              count: stats?.concluidos ?? 0,
            },
            {
              id: "cancelado",
              label: "Cancelados",
              count: stats?.cancelados ?? 0,
            },
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
        className={`grid gap-3 ${selectedDoc ? "lg:grid-cols-[1fr_380px]" : ""}`}
      >
        {/* Cards/List */}
        <div>
          {docs.length > 0 ? (
            viewMode === "cards" ? (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${selectedDoc ? "" : "lg:grid-cols-3"} gap-3`}
              >
                {docs.map((doc) => (
                  <DocumentCard
                    key={doc.uuid}
                    doc={doc}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {docs.map((doc) => (
                  <DocumentListRow
                    key={doc.uuid}
                    doc={doc}
                    onSelect={handleSelect}
                    selected={selectedDoc?.id === doc.id}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSignature className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">
                Nenhum documento encontrado
              </p>
              <p className="text-xs text-muted-foreground/55 mt-1">
                Tente ajustar os filtros ou a busca
              </p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
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
