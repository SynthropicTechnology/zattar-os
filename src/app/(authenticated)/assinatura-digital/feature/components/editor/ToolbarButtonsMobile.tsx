'use client';

import {
  AlignLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Image,
  MousePointer,
  RotateCcw,
  Save,
  Settings,
  Type,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type EditorMode = 'select' | 'add_text' | 'add_image' | 'add_rich_text';

interface ToolbarButtonsMobileProps {
  // Editor mode
  editorMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onAddRichTextField?: () => void;

  // Zoom controls
  zoomPercentage: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canResetZoom: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;

  // Page navigation
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPreviousPage: () => void;

  // Properties
  hasSelectedField: boolean;
  onOpenProperties: () => void;

  // Template info & PDF replacement
  onOpenTemplateInfo: () => void;
  onReplacePdf: () => void;

  // Actions
  onCancel: () => void;
  onSave: () => void;
  onGenerateTestPreview?: () => void;
  isGeneratingPreview?: boolean;
  pdfUrl?: string | null;
  isCreateMode?: boolean;
  hasTemplateId?: boolean;

  // Preview toggle
  showFilledPreview?: boolean;
  onTogglePreview?: () => void;
  hasPreviewPdf?: boolean;
}

export default function ToolbarButtonsMobile({
  editorMode,
  onModeChange,
  onAddRichTextField,
  zoomPercentage,
  canZoomIn,
  canZoomOut,
  canResetZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  currentPage,
  totalPages,
  onNextPage,
  onPreviousPage,
  hasSelectedField,
  onOpenProperties,
  onOpenTemplateInfo,
  onReplacePdf,
  onCancel,
  onSave,
  onGenerateTestPreview,
  isGeneratingPreview = false,
  pdfUrl = null,
  isCreateMode = false,
  hasTemplateId = true,
  showFilledPreview = false,
  onTogglePreview,
  hasPreviewPdf = false,
}: ToolbarButtonsMobileProps) {
  return (
    <div className="w-full overflow-x-auto">
      <ButtonGroup
        orientation="horizontal"
        className="w-fit"
        aria-label="Barra de ferramentas do editor"
      >
        {/* Ferramentas */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorMode === 'select' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onModeChange('select')}
                aria-label="Selecionar"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Selecionar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorMode === 'add_text' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onModeChange('add_text')}
                aria-label="Texto"
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Texto</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorMode === 'add_image' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onModeChange('add_image')}
                aria-label="Imagem"
              >
                <Image className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Imagem</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorMode === 'add_rich_text' ? 'default' : 'outline'}
                size="icon"
                onClick={onAddRichTextField}
                aria-label="Texto Composto"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Texto Composto</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ButtonGroupSeparator />

        {/* Zoom */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomOut}
                disabled={!canZoomOut}
                aria-label="Zoom -"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Zoom: {zoomPercentage}%</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onResetZoom}
                disabled={!canResetZoom}
                aria-label="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Resetar zoom (100%)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomIn}
                disabled={!canZoomIn}
                aria-label="Zoom +"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Zoom: {zoomPercentage}%</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Toggle: Visualizar Preview Preenchido */}
        {onTogglePreview && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showFilledPreview ? 'default' : 'outline'}
                  size="icon"
                  onClick={onTogglePreview}
                  disabled={!hasPreviewPdf}
                  aria-label={showFilledPreview ? 'Template' : 'Preview'}
                >
                  {showFilledPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {!hasPreviewPdf
                    ? 'Gere preview primeiro'
                    : showFilledPreview
                      ? 'Template original'
                      : 'Preview preenchido'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <ButtonGroupSeparator />

        {/* Navegação de Páginas */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onPreviousPage}
                disabled={currentPage <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Anterior</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center px-2 text-xs text-muted-foreground whitespace-nowrap">
          {currentPage}/{totalPages}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onNextPage}
                disabled={currentPage >= totalPages}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Próxima</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ButtonGroupSeparator />

        {/* Propriedades e Configurações */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenProperties}
                disabled={!hasSelectedField}
                aria-label="Propriedades"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Propriedades</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenTemplateInfo}
                aria-label="Info do Template"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Informações</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onReplacePdf}
                aria-label="Substituir PDF"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Substituir PDF</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {onGenerateTestPreview && (
          <>
            <ButtonGroupSeparator />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onGenerateTestPreview}
                    disabled={isGeneratingPreview || !pdfUrl || isCreateMode || !hasTemplateId}
                    aria-label="PDF de Teste"
                  >
                    <FileCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    {isGeneratingPreview
                      ? 'Gerando...'
                      : isCreateMode || !hasTemplateId
                        ? 'Salve primeiro'
                        : 'PDF de Teste'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        <ButtonGroupSeparator />

        {/* Ações */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onSave}
                aria-label="Salvar"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Salvar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onCancel}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Fechar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ButtonGroup>
    </div>
  );
}
