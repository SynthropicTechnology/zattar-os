/**
 * Tipos TypeScript para Preview de PDF
 */

export interface PdfPreviewProps {
  /** URL do PDF a ser exibido (undefined mostra estado de espera) */
  pdfUrl?: string;

  /** Nível de zoom inicial (1 = 100%) - usado apenas na inicialização */
  initialZoom?: number;

  /** Nível de zoom controlado (1 = 100%) - quando fornecido, sobrescreve o estado interno */
  zoom?: number;

  /** Página inicial a ser exibida (1-indexed) */
  initialPage?: number;

  /** Callback quando zoom muda */
  onZoomChange?: (zoom: number) => void;

  /** Callback quando página muda */
  onPageChange?: (page: number) => void;

  /** Callback quando PDF é carregado com sucesso */
  onLoadSuccess?: (numPages: number) => void;

  /** Callback quando ocorre erro no carregamento */
  onLoadError?: (error: Error) => void;

  /** Mostrar controles de navegação */
  showControls?: boolean;

  /** Mostrar indicador de página */
  showPageIndicator?: boolean;

  /** Altura máxima do container */
  maxHeight?: string;

  /** Largura máxima do container */
  maxWidth?: string;

  /** Classe CSS adicional */
  className?: string;

  /** Classe CSS adicional aplicada ao viewport interno do preview */
  viewportClassName?: string;

  /** Modo de renderização: default (com controles/layout) ou background (apenas PDF) */
  mode?: 'default' | 'background';

  /** Renderizar camada de texto (default: true) */
  renderTextLayer?: boolean;

  /** Renderizar camada de anotações (default: true) */
  renderAnnotationLayer?: boolean;

  /** Largura fixa da página em pontos (opcional) */
  pageWidth?: number;

  /** Altura fixa da página em pontos (opcional) */
  pageHeight?: number;
}

export interface PdfPageInfo {
  /** Número da página (1-indexed) */
  pageNumber: number;

  /** Largura original da página em pontos */
  width: number;

  /** Altura original da página em pontos */
  height: number;

  /** Largura renderizada em pixels */
  renderedWidth: number;

  /** Altura renderizada em pixels */
  renderedHeight: number;
}

export interface PdfLoadState {
  /** PDF está carregando */
  isLoading: boolean;

  /** Erro durante carregamento */
  error: Error | null;

  /** Número total de páginas */
  numPages: number | null;

  /** Informações da página atual */
  currentPageInfo: PdfPageInfo | null;
}

export interface PdfZoomConfig {
  /** Zoom mínimo permitido */
  min: number;

  /** Zoom máximo permitido */
  max: number;

  /** Incremento de zoom */
  step: number;

  /** Zoom padrão */
  default: number;
}

export const DEFAULT_ZOOM_CONFIG: PdfZoomConfig = {
  min: 0.5,
  max: 3.0,
  step: 0.1,
  default: 1.0,
};

/**
 * Tamanho padrão do canvas do editor de templates
 *
 * Estes são valores de referência fixos usados para conversão proporcional entre
 * as coordenadas do canvas do editor e as coordenadas do PDF gerado.
 *
 * O editor usa dimensões fixas (540×765px) para consistência visual, mas o PDF
 * real pode ter dimensões diferentes (ex: A4 = 595×842pt, Letter = 612×792pt).
 *
 * Durante a geração do PDF, todas as coordenadas (X, Y, width, height) são
 * convertidas proporcionalmente usando as funções em lib/pdf/generator.ts:
 * - convertXCoordinate: converte posição X
 * - convertYCoordinate: converte posição Y (inverte eixo)
 * - convertWidth: converte largura
 * - convertHeight: converte altura
 *
 * EXEMPLO NUMÉRICO (canvas 540×765 → PDF A4 595×842):
 * - Canvas X=100 → PDF X≈110.2
 * - Canvas Y=100 → PDF Y≈731.9 (eixo invertido)
 * - Canvas width=200 → PDF width≈220.4
 * - Canvas height=100 → PDF height≈110.1
 *
 * ⚠️ IMPORTANTE: NÃO altere estas dimensões sem atualizar as funções de
 * conversão em lib/pdf/generator.ts e revisar todos os templates existentes.
 * Mudanças aqui causarão desalinhamento em todos os campos posicionados.
 */
export const PDF_CANVAS_SIZE = {
  width: 540,
  height: 765,
} as const;
