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
  Pencil,
  RotateCcw,
  Save,
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

interface ToolbarButtonsProps {
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

export default function ToolbarButtons({
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
}: ToolbarButtonsProps) {
  return (
    <ButtonGroup
      orientation="vertical"
      className="shrink-0 lg:flex hidden"
      aria-label="Barra de ferramentas do editor"
    >
      {/* Seção: Ferramentas de Edição */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editorMode === 'select' ? 'default' : 'outline'}
              size="icon"
              onClick={() => onModeChange('select')}
              aria-label="Ferramenta Selecionar"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Selecionar e mover campos</p>
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
              aria-label="Adicionar Campo de Texto"
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Adicionar campo de texto</p>
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
              aria-label="Adicionar Campo de Imagem"
            >
              <Image className="h-4 w-4" aria-hidden="true" aria-label="Ícone de imagem" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Adicionar campo de imagem/assinatura</p>
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
              aria-label="Adicionar Campo de Texto Composto"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Adicionar campo de texto composto</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ButtonGroupSeparator orientation="horizontal" />

      {/* Seção: Controles de Zoom (reorganized: Out, Reset, In) */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onZoomOut}
              disabled={!canZoomOut}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
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
              aria-label="Resetar zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
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
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
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
                aria-label={showFilledPreview ? 'Mostrar template original' : 'Mostrar preview preenchido'}
              >
                {showFilledPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {!hasPreviewPdf
                  ? 'Gere um preview de teste primeiro'
                  : showFilledPreview
                    ? 'Voltar para template original'
                    : 'Visualizar preview preenchido'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <ButtonGroupSeparator orientation="horizontal" />

      {/* Seção: Ações - Gerar PDF */}
      {onGenerateTestPreview && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onGenerateTestPreview}
                disabled={isGeneratingPreview || !pdfUrl || isCreateMode || !hasTemplateId}
                aria-label="Gerar PDF de teste"
              >
                <FileCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {isGeneratingPreview
                  ? 'Gerando...'
                  : isCreateMode || !hasTemplateId
                    ? 'Salve o template antes de gerar preview'
                    : 'Gerar PDF de teste com dados fictícios'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <ButtonGroupSeparator orientation="horizontal" />

      {/* Seção: Propriedades e Configurações */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenProperties}
              disabled={!hasSelectedField}
              aria-label="Abrir propriedades do campo"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{hasSelectedField ? 'Editar propriedades' : 'Selecione um campo'}</p>
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
              aria-label="Editar informações do template"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Editar informações do template</p>
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
              aria-label="Substituir PDF do template"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Substituir PDF</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ButtonGroupSeparator orientation="horizontal" />

      {/* Seção: Navegação de Páginas */}
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
          <TooltipContent side="right">
            <p>Página anterior</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
          <TooltipContent side="right">
            <p>Próxima página ({currentPage}/{totalPages})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ButtonGroupSeparator orientation="horizontal" />

      {/* Seção: Salvar e Fechar */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onSave}
              aria-label="Salvar alterações"
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
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
              aria-label="Fechar editor"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Fechar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </ButtonGroup>
  );
}