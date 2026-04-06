'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';


import { FilterPopover, type FilterOption } from '@/app/(authenticated)/partes/components/shared/filter-popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import { ComunicacaoDetalhesDialog } from './detalhes-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import {
  Eye,
  FileText,
  ExternalLink,
  RefreshCw,
  Link2,
  AlertCircle,
} from 'lucide-react';

import { actionListarComunicacoesCapturadas } from '../../actions/comunica-cnj-actions';

import type { ComunicacaoCNJ, ComunicacaoItem } from '../../comunica-cnj/domain';
import { DataShell, DataTableToolbar, DataPagination, DataTable, DataTableColumnHeader } from '@/components/shared/data-shell';
import type { ColumnDef } from '@tanstack/react-table';

const VINCULACAO_OPTIONS: FilterOption[] = [
  { value: 'vinculadas', label: 'Com expediente' },
  { value: 'nao_vinculadas', label: 'Sem expediente' },
];

// Helper para converter ComunicacaoCNJ para ComunicacaoItem
const convertToItem = (c: ComunicacaoCNJ): ComunicacaoItem => ({
  id: c.idCnj,
  hash: c.hash,
  numeroProcesso: c.numeroProcesso,
  numeroProcessoComMascara: c.numeroProcessoMascara || c.numeroProcesso,
  siglaTribunal: c.siglaTribunal,
  nomeClasse: c.nomeClasse || '',
  codigoClasse: c.codigoClasse || '',
  tipoComunicacao: c.tipoComunicacao || '',
  tipoDocumento: c.tipoDocumento || '',
  numeroComunicacao: c.numeroComunicacao || 0,
  texto: c.texto || '',
  link: c.link || '',
  nomeOrgao: c.nomeOrgao || '',
  idOrgao: c.orgaoId || 0,
  dataDisponibilizacao: c.dataDisponibilizacao,
  dataDisponibilizacaoFormatada: new Date(c.dataDisponibilizacao).toLocaleDateString('pt-BR'),
  meio: c.meio,
  meioCompleto: c.meioCompleto || '',
  ativo: c.ativo,
  status: c.status || '',
  destinatarios: c.destinatarios || [],
  destinatarioAdvogados: c.destinatariosAdvogados || [],
  partesAutoras: c.destinatarios?.filter((d) => d.polo === 'A').map((d) => d.nome) || [],
  partesReus: c.destinatarios?.filter((d) => d.polo === 'P').map((d) => d.nome) || [],
  advogados: c.destinatariosAdvogados?.map((d) => d.advogado.nome) || [],
  advogadosOab: c.destinatariosAdvogados?.map((d) => `${d.advogado.numero_oab}/${d.advogado.uf_oab}`) || [],
});

interface ActionButtonsProps {
  comunicacao: ComunicacaoCNJ;
  onViewDetails: (c: ComunicacaoCNJ) => void;
  onViewPdf: (hash: string) => void;
}

const ActionButtons = ({ comunicacao, onViewDetails, onViewPdf }: ActionButtonsProps) => (
  <TooltipProvider>
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetails(comunicacao)}
            aria-label="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ver detalhes</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewPdf(comunicacao.hash)}
            aria-label="Ver certidão PDF"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ver certidão PDF</TooltipContent>
      </Tooltip>

      {comunicacao.link && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir em nova aba" className="h-8 w-8" asChild>
              <a
                href={comunicacao.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir no PJE"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Abrir no PJE</TooltipContent>
        </Tooltip>
      )}
    </div>
  </TooltipProvider>
);

/**
 * Componente para listar comunicações já capturadas do banco
 */
export function ComunicaCNJCapturadas() {
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoCNJ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  const [vinculacaoFilter, setVinculacaoFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs state
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoItem | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfHash, setSelectedPdfHash] = useState<string | null>(null);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Buscar comunicações capturadas
  const fetchComunicacoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Reset page index when refetching/filtering
    setPageIndex(0);

    try {
      const params: Record<string, unknown> = {};

      if (searchTerm) {
        params.numeroProcesso = searchTerm;
      }
      if (tribunalFilter !== 'all') {
        params.siglaTribunal = tribunalFilter;
      }
      if (vinculacaoFilter === 'nao_vinculadas') {
        params.semExpediente = true;
      }

      const result = await actionListarComunicacoesCapturadas(params);

      if (result.success && result.data) {
        let items = result.data.data || [];

        // Filtrar por vinculação se necessário (caso a API não tenha filtrado)
        if (vinculacaoFilter === 'vinculadas') {
          items = items.filter((c: ComunicacaoCNJ) => c.expedienteId !== null);
        }

        setComunicacoes(items);
      } else {
        setComunicacoes([]);
        setError(result.error || 'Erro ao buscar comunicações');
      }
    } catch (err) {
      console.error('Erro ao buscar comunicações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar comunicações');
      setComunicacoes([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, tribunalFilter, vinculacaoFilter]);

  // Initial fetch
  useEffect(() => {
    fetchComunicacoes();
  }, [fetchComunicacoes]);

  // Extrair opções de filtro a partir dos dados
  const tribunalOptions = useMemo<FilterOption[]>(() => {
    const tribunais = new Set(comunicacoes.map((c) => c.siglaTribunal).filter(Boolean));
    return Array.from(tribunais).sort().map((t) => ({ value: t, label: t }));
  }, [comunicacoes]);

  // Client-side processing (sorting)
  // Note: Filtering is already done by API/State, but simple client-side search refines it if needed
  // However, since we fetch based on search, we just sort here.
  const processedComunicacoes = useMemo(() => {
    const result = [...comunicacoes];

    // Sort desc by date
    result.sort((a, b) => {
      const dateA = new Date(a.dataDisponibilizacao);
      const dateB = new Date(b.dataDisponibilizacao);
      return dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [comunicacoes]);

  // Pagination logic
  const paginatedComunicacoes = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    return processedComunicacoes.slice(startIndex, startIndex + pageSize);
  }, [processedComunicacoes, pageIndex, pageSize]);

  const totalItems = processedComunicacoes.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  // Handlers for actions
  const handleViewDetails = useCallback((c: ComunicacaoCNJ) => {
    setSelectedComunicacao(convertToItem(c));
  }, []);

  const handleViewPdf = useCallback((hash: string) => {
    setSelectedPdfHash(hash);
    setPdfViewerOpen(true);
  }, []);

  // Formatar data
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  // Column Definitions
  const columns = useMemo<ColumnDef<ComunicacaoCNJ>[]>(() => [
    {
      accessorKey: 'dataDisponibilizacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => (
        <div className="text-xs">
          {formatDate(row.getValue('dataDisponibilizacao'))}
        </div>
      ),
      size: 100,
      meta: { align: 'left' },
      enableSorting: true,
    },
    {
      accessorKey: 'numeroProcesso',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processo" />
      ),
      cell: ({ row }) => {
        const c = row.original;
        const partesAutoras = c.destinatarios?.filter((d) => d.polo === 'A').map((d) => d.nome) || [];
        const partesReus = c.destinatarios?.filter((d) => d.polo === 'P').map((d) => d.nome) || [];
        return (
          <div className="flex flex-col gap-1.5 items-start py-2 max-w-[min(92vw,20rem)] min-w-0">
            {/* Tribunal */}
            <TribunalBadge codigo={c.siglaTribunal} className="text-xs" />

            {/* Número do processo */}
            <span className="text-xs font-mono font-medium text-foreground break-all" title={c.numeroProcessoMascara || c.numeroProcesso}>
              {c.numeroProcessoMascara || c.numeroProcesso}
            </span>

            {/* Partes */}
            <div className="flex flex-col gap-0.5">
              <ParteBadge
                polo="ATIVO"
                className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
              >
                {partesAutoras.join(', ') || '-'}
              </ParteBadge>
              <ParteBadge
                polo="PASSIVO"
                className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
              >
                {partesReus.join(', ') || '-'}
              </ParteBadge>
            </div>
          </div>
        );
      },
      size: 300,
      meta: { align: 'left' },
      enableSorting: true,
    },
    {
      accessorKey: 'tipoComunicacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.tipoComunicacao || '-'}
        </Badge>
      ),
      size: 120,
      meta: { align: 'left' },
    },
    {
      accessorKey: 'expedienteId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expediente" />
      ),
      cell: ({ row }) => {
        const id = row.original.expedienteId;
        return id ? (
          <a
            href={`/app/expedientes/lista?id=${id}`}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Link2 className="h-3 w-3" />
            #{id}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
      size: 150,
      meta: { align: 'left' },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Capturado em" />
      ),
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </div>
      ),
      size: 100,
      meta: { align: 'left' },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center">
          <ActionButtons
            comunicacao={row.original}
            onViewDetails={handleViewDetails}
            onViewPdf={handleViewPdf}
          />
        </div>
      ),
      size: 100,
      meta: { align: 'left' },
    },
  ], [handleViewDetails, handleViewPdf]);

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DataShell
        header={
          <DataTableToolbar
            searchValue={searchTerm}
            onSearchValueChange={setSearchTerm}
            searchPlaceholder="Filtrar por processo..."
            filtersSlot={
              <>
                <FilterPopover
                  label="Tribunal"
                  placeholder="Buscar tribunal..."
                  options={tribunalOptions}
                  value={tribunalFilter}
                  onValueChange={setTribunalFilter}
                />
                <FilterPopover
                  label="Vinculação"
                  options={VINCULACAO_OPTIONS}
                  value={vinculacaoFilter}
                  onValueChange={setVinculacaoFilter}
                />
              </>
            }
            actionSlot={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-card"
                    onClick={fetchComunicacoes}
                    disabled={isLoading}
                    aria-label="Atualizar"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Atualizar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar lista</TooltipContent>
              </Tooltip>
            }
          />
        }
        footer={
          <DataPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={totalItems}
            totalPages={totalPages}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        }
        className="h-full"
      >
        <DataTable
          data={paginatedComunicacoes}
          columns={columns}
          pagination={{
            pageIndex,
            pageSize,
            total: totalItems,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          isLoading={isLoading}
          emptyMessage="Nenhuma comunicação encontrada com os filtros selecionados."
        />
      </DataShell>

      <ComunicacaoDetalhesDialog
        comunicacao={selectedComunicacao}
        open={!!selectedComunicacao}
        onOpenChange={(open) => !open && setSelectedComunicacao(null)}
        onViewPdf={(hash) => {
          setSelectedPdfHash(hash);
          setPdfViewerOpen(true);
        }}
      />

      <PdfViewerDialog
        hash={selectedPdfHash}
        open={pdfViewerOpen}
        onOpenChange={(open) => {
          setPdfViewerOpen(open);
          if (!open) setSelectedPdfHash(null);
        }}
      />
    </>
  );
}

