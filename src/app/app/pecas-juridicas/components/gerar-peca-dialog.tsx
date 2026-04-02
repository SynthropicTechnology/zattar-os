'use client';

/**
 * Color semantics:
 * - green-* (success, resolved placeholders)
 * - orange-* (warnings, unresolved placeholders)
 * - primary (selection states, interactive elements)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppBadge } from '@/components/ui/app-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import {
  actionListarPecasModelos,
  actionPreviewGeracaoPeca,
  actionGerarPecaDeContrato,
} from '../actions';
import { TIPO_PECA_LABELS, type TipoPecaJuridica, type PecaModeloListItem } from '../domain';
import type { PlaceholderResolution } from '../placeholders';

// =============================================================================
// TYPES
// =============================================================================

interface GerarPecaDialogProps {
  contratoId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (documentoId: number) => void;
}

type Step = 'select-model' | 'preview' | 'generating' | 'success';

// =============================================================================
// COMPONENT
// =============================================================================

export function GerarPecaDialog({
  contratoId,
  open,
  onOpenChange,
  onSuccess,
}: GerarPecaDialogProps) {
  const router = useRouter();

  // State
  const [step, setStep] = React.useState<Step>('select-model');
  const [modelos, setModelos] = React.useState<PecaModeloListItem[]>([]);
  const [loadingModelos, setLoadingModelos] = React.useState(true);
  const [tipoFiltro, setTipoFiltro] = React.useState<TipoPecaJuridica | 'all'>('all');

  const [selectedModeloId, setSelectedModeloId] = React.useState<number | null>(null);
  const [titulo, setTitulo] = React.useState('');

  const [preview, setPreview] = React.useState<{
    placeholders: PlaceholderResolution[];
    resolvidosCount: number;
    naoResolvidosCount: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = React.useState(false);

  const [generating, setGenerating] = React.useState(false);
  const [result, setResult] = React.useState<{
    documentoId: number;
    titulo: string;
    placeholdersResolvidos: number;
    placeholdersNaoResolvidos: number;
  } | null>(null);

  // Carregar modelos ao abrir
  React.useEffect(() => {
    if (open) {
      loadModelos();
    }
  }, [open]);

  // Reset ao fechar
  React.useEffect(() => {
    if (!open) {
      setStep('select-model');
      setSelectedModeloId(null);
      setTitulo('');
      setPreview(null);
      setResult(null);
    }
  }, [open]);

  // Carregar modelos
  const loadModelos = async () => {
    setLoadingModelos(true);
    try {
      const response = await actionListarPecasModelos({
        apenasAtivos: true,
        pageSize: 100,
        orderBy: 'titulo',
        orderDirection: 'asc',
      });

      if (response.success) {
        setModelos(response.data.data);
      } else {
        toast.error('Erro ao carregar modelos', {
          description: response.message,
        });
      }
    } finally {
      setLoadingModelos(false);
    }
  };

  // Filtrar modelos
  const modelosFiltrados = React.useMemo(() => {
    if (tipoFiltro === 'all') return modelos;
    return modelos.filter((m) => m.tipoPeca === tipoFiltro);
  }, [modelos, tipoFiltro]);

  // Carregar preview
  const loadPreview = async () => {
    if (!selectedModeloId) return;

    setLoadingPreview(true);
    try {
      const response = await actionPreviewGeracaoPeca(selectedModeloId, contratoId);

      if (response.success) {
        setPreview(response.data);
        setStep('preview');
      } else {
        toast.error('Erro ao gerar preview', {
          description: response.message,
        });
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  // Gerar peça
  const handleGerar = async () => {
    if (!selectedModeloId || !titulo.trim()) return;

    setGenerating(true);
    setStep('generating');

    try {
      const response = await actionGerarPecaDeContrato({
        contratoId,
        modeloId: selectedModeloId,
        titulo: titulo.trim(),
      });

      if (response.success) {
        setResult(response.data);
        setStep('success');
        toast.success('Peça gerada com sucesso!');
        onSuccess?.(response.data.documentoId);
      } else {
        toast.error('Erro ao gerar peça', {
          description: response.message,
        });
        setStep('preview');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Modelo selecionado
  const selectedModelo = modelos.find((m) => m.id === selectedModeloId);

  // Auto-preencher título
  React.useEffect(() => {
    if (selectedModelo && !titulo) {
      setTitulo(selectedModelo.titulo);
    }
  }, [selectedModelo, titulo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Peça Jurídica
          </DialogTitle>
          <DialogDescription>
            {step === 'select-model' && 'Selecione um modelo de peça para gerar'}
            {step === 'preview' && 'Confira os dados que serão substituídos'}
            {step === 'generating' && 'Gerando peça...'}
            {step === 'success' && 'Peça gerada com sucesso!'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Selecionar Modelo */}
        {step === 'select-model' && (
          <div className="space-y-4">
            {/* Filtro por tipo */}
            <div className="flex items-center gap-4">
              <Label>Filtrar por tipo:</Label>
              <Select
                value={tipoFiltro}
                onValueChange={(v) => setTipoFiltro(v as TipoPecaJuridica | 'all')}
              >
                <SelectTrigger className="w-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(TIPO_PECA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de modelos */}
            <ScrollArea className="h-75 border rounded-md">
              {loadingModelos ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : modelosFiltrados.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum modelo encontrado
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {modelosFiltrados.map((modelo) => (
                    <button
                      key={modelo.id}
                      onClick={() => setSelectedModeloId(modelo.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedModeloId === modelo.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{modelo.titulo}</p>
                          {modelo.descricao && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {modelo.descricao}
                            </p>
                          )}
                        </div>
                        <AppBadge variant="secondary">
                          {TIPO_PECA_LABELS[modelo.tipoPeca]}
                        </AppBadge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Título do documento */}
            {selectedModeloId && (
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do documento</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Digite o título do documento"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{preview.resolvidosCount} resolvidos</span>
              </div>
              {preview.naoResolvidosCount > 0 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{preview.naoResolvidosCount} não resolvidos</span>
                </div>
              )}
            </div>

            {/* Alerta se houver não resolvidos */}
            {preview.naoResolvidosCount > 0 && (
              <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/30">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-600 dark:text-orange-400">Atenção</AlertTitle>
                <AlertDescription className="text-orange-600 dark:text-orange-400">
                  Alguns placeholders não serão substituídos por falta de dados no contrato.
                  Você poderá editar o documento após a geração.
                </AlertDescription>
              </Alert>
            )}

            {/* Lista de placeholders */}
            <ScrollArea className="h-62.5 border rounded-md">
              <div className="p-4 space-y-2">
                {preview.placeholders.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2 rounded ${
                      p.resolved ? 'bg-green-50 dark:bg-green-950' : 'bg-orange-50 dark:bg-orange-950'
                    }`}
                  >
                    <code className="text-sm">{p.placeholder}</code>
                    <span className={`text-sm ${p.resolved ? 'text-green-600' : 'text-orange-600'}`}>
                      {p.resolved ? p.value : '(não encontrado)'}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Gerando peça jurídica...</p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && result && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-lg font-medium">Peça gerada com sucesso!</p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p>
                <strong>Título:</strong> {result.titulo}
              </p>
              <p>
                <strong>Placeholders resolvidos:</strong> {result.placeholdersResolvidos}
              </p>
              {result.placeholdersNaoResolvidos > 0 && (
                <p className="text-orange-600">
                  <strong>Não resolvidos:</strong> {result.placeholdersNaoResolvidos}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'select-model' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={loadPreview}
                disabled={!selectedModeloId || !titulo.trim() || loadingPreview}
              >
                {loadingPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('select-model')}>
                Voltar
              </Button>
              <Button onClick={handleGerar} disabled={generating}>
                Gerar Peça
              </Button>
            </>
          )}

          {step === 'success' && result && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => router.push(`/app/documentos/${result.documentoId}`)}>
                Abrir Documento
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
