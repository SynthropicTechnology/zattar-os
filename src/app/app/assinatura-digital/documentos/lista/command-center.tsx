"use client";

import { FileSignature, LayoutGrid, List, Plus } from "lucide-react";
import Link from "next/link";
import { InsightBanner } from "@/app/app/dashboard/mock/widgets/primitives";
import { TabPills } from "@/components/dashboard/tab-pills";
import { SearchInput } from "@/components/dashboard/search-input";
import {
  ViewToggle,
  type ViewToggleOption,
} from "@/components/dashboard/view-toggle";
import type { DocumentosStats } from "../../feature/services/documentos.service";
import type { DocumentoListItem } from "../../feature/adapters/documento-card-adapter";
import { useDocumentosPage } from "../../feature/hooks/use-documentos-page";
import { useDocumentosStats } from "../../feature/hooks/use-documentos-stats";
import { DocumentCard } from "../../feature/components/documento-card";
import { DocumentListRow } from "../../feature/components/documento-list-row";
import { DocumentDetail } from "../../feature/components/documento-detail";
import { SignaturePipeline } from "../../feature/components/signature-pipeline";
import { SignatureStatsStrip } from "../../feature/components/signature-stats-strip";

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
    <div className="max-w-350 mx-auto space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">
            Assinatura Digital
          </h1>
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

      {/* ── Stats Strip ─────────────────────────────────── */}
      {stats && <SignatureStatsStrip stats={stats} />}

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
                    key={doc.id}
                    doc={doc}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {docs.map((doc) => (
                  <DocumentListRow
                    key={doc.id}
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
