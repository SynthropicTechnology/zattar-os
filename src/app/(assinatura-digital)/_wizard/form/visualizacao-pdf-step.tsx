"use client";

/**
 * VisualizacaoPdfStep - Componente de visualização de documentos via PDF tradicional
 *
 * Este componente é usado para templates que NÃO possuem conteúdo Markdown configurado.
 * Para templates com campo `conteudo_markdown` preenchido, o sistema utiliza
 * automaticamente o componente `VisualizacaoMarkdownStep.tsx` que oferece
 * renderização responsiva via Markdown.
 *
 * **Compatibilidade Retroativa:**
 * - Templates existentes sem Markdown continuam funcionando normalmente
 * - O FormularioContainer.tsx decide qual componente renderizar baseado na
 *   presença do campo `template.conteudo_markdown`
 * - Ambos os fluxos (PDF e Markdown) coexistem sem conflitos
 *
 * **Fluxo de funcionamento:**
 * 1. Gera PDF preview via `/api/gerar-pdf-preview` (backend)
 * 2. Renderiza PDF usando `PdfPreviewDynamic` component
 * 3. Suporta múltiplos templates com RadioGroup
 * 4. Implementa cache com TTL de 5 minutos
 * 5. Auto-invalida ao mudar dados críticos (cliente_id, contrato_id)
 *
 * **Quando este componente é usado:**
 * - Templates criados antes da feature de Markdown
 * - Templates que preferem manter visualização PDF tradicional
 * - Templates híbridos que usam Markdown para visualização mas ainda precisam
 *   de campos mapeados para geração de PDF final
 *
 * @see VisualizacaoMarkdownStep.tsx - Alternativa responsiva via Markdown
 * @see FormularioContainer.tsx - Lógica de decisão entre PDF e Markdown
 */

import { useState, useEffect, useRef } from "react";
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import FormStepLayout from "./form-step-layout";
import PdfPreviewDynamic from '@/shared/assinatura-digital/components/pdf/PdfPreviewDynamic';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiFetch } from "@/lib/http/api-fetch";
import type { PreviewResult } from '@/shared/assinatura-digital/types/api';
import type { SalvarAcaoRequest } from '@/shared/assinatura-digital/types/api';
import { API_ROUTES } from '@/shared/assinatura-digital/constants';

interface TemplateMetadata {
  id: string;
  nome: string;
  versao?: number;
  status?: string;
}

export default function VisualizacaoPdfStep() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templateMetadatas, setTemplateMetadatas] = useState<TemplateMetadata[]>([]);

  const {
    dadosPessoais,
    dadosContrato,
    fotoBase64,
    templateIdSelecionado,
    templateIds,
    dadosVisualizacaoPdf,
    setDadosVisualizacaoPdf,
    setDadosContrato,
    setTemplateIdSelecionado,
    segmentoId,
    segmentoNome,
    formularioId,
    formularioNome,
    contratoJaCriado,
    setContratoJaCriado,
    proximaEtapa,
    etapaAnterior,
    getCachedTemplate,
    setCachedTemplate,
  } = useFormularioStore();

  // Fetch metadata for all templates when multiple templates are available
  // Comment 3 fix: Use cache to avoid duplicate fetches
  useEffect(() => {
    if (!templateIds || templateIds.length <= 1) {
      setTemplateMetadatas([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const metadataPromises = templateIds.map(async (id: string | number) => {
          // Comment 3 fix: Check cache first
          const cachedTemplate = getCachedTemplate(String(id));
          if (cachedTemplate) {
            return {
              id: String(id),
              nome: cachedTemplate.nome || String(id),
              versao: cachedTemplate.versao,
              status: cachedTemplate.status,
            };
          }

          // If not cached, fetch and cache
          try {
            const response = await fetch(API_ROUTES.templateById(id));
            const data = await response.json();

            if (data.success && data.data) {
              // Comment 3 fix: Store in cache
              setCachedTemplate(String(id), data.data);

              return {
                id: String(id),
                nome: data.data.nome || String(id),
                versao: data.data.versao,
                status: data.data.status,
              };
            }
          } catch {
            // Fallback to ID if fetch fails
          }
          return { id: String(id), nome: String(id) };
        });

        const metas = await Promise.all(metadataPromises);
        if (!cancelled) {
          setTemplateMetadatas(metas);
          // Auto-select first if none selected
          if (!templateIdSelecionado) {
            setTemplateIdSelecionado(metas[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching template metadata:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [templateIds, templateIdSelecionado, setTemplateIdSelecionado, getCachedTemplate, setCachedTemplate]);

  const buscarTemplateFallback = async () => {
    setIsFetchingTemplate(true);
    setError(null);

    try {
      if (!segmentoId || !formularioId) {
        throw new Error("Contexto do formulário não definido");
      }

      // Na arquitetura agnóstica, os templates já estão associados ao formulário
      // Portanto, esta função de fallback não é mais necessária na maioria dos casos
      // pois templateIds já deve estar preenchido
      throw new Error("Nenhum template encontrado para este formulário");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar template";
      setError(errorMessage);
      toast.error("Erro", { description: errorMessage });
      return null;
    } finally {
      setIsFetchingTemplate(false);
    }
  };

  const gerarPdfPreview = async () => {
    try {
      // Validações
      if (!dadosPessoais) {
        throw new Error("Dados pessoais não encontrados. Volte e preencha o formulário.");
      }

      if (!dadosContrato) {
        throw new Error("Dados do contrato não encontrados. Volte e preencha o formulário.");
      }

      console.log('[PDF-PREVIEW] Estado do store:', {
        dadosPessoais: {
          cliente_id: dadosPessoais?.cliente_id,
          nome: dadosPessoais?.nome_completo,
        },
        dadosContrato: {
          contrato_id: dadosContrato?.contrato_id,
          keys: dadosContrato ? Object.keys(dadosContrato) : [],
        },
        fotoBase64: fotoBase64 ? `${fotoBase64.substring(0, 50)}...` : null,
      });

      // Buscar template se não houver nenhum selecionado
      let templateId = templateIdSelecionado || (templateIds && templateIds[0]);
      if (!templateId) {
        const fallbackTemplateId = await buscarTemplateFallback();
        if (!fallbackTemplateId) {
          throw new Error("Não foi possível obter um template. Entre em contato com o suporte.");
        }
        templateId = String(fallbackTemplateId);
      }

      // Preparar payload
      // contrato_id pode ser null quando salvar-acao retorna 404 ou não cria contrato.
      const contratoId = dadosContrato.contrato_id;

      // Extrair parte contrária do store (se disponível)
      const parteContrariaDados = Array.isArray(dadosContrato.parte_contraria_dados)
        ? (dadosContrato.parte_contraria_dados as Array<{ id: number; nome: string; cpf?: string | null; cnpj?: string | null; telefone?: string | null }>)
        : undefined;

      // Extrair cliente_dados do store (se disponível) para resolver telefone/celular no PDF
      const clienteDados = dadosContrato.cliente_dados as
        | { id: number; nome: string; cpf?: string | null; cnpj?: string | null; email?: string | null; celular?: string | null; telefone?: string | null }
        | undefined;

      // Extrair campos do formulário dinâmico (acao) de dadosContrato
      const RESERVED_KEYS = new Set(['contrato_id', 'cliente_dados', 'parte_contraria_dados']);
      const acaoDados: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(dadosContrato)) {
        if (!RESERVED_KEYS.has(key) && value !== undefined && value !== null) {
          acaoDados[key] = value;
        }
      }

      const payload = {
        template_id: templateId,
        cliente_id: dadosPessoais.cliente_id,
        contrato_id: contratoId,
        ...(fotoBase64 && { foto_base64: fotoBase64 }),
        ...(parteContrariaDados && parteContrariaDados.length > 0 && { parte_contraria_dados: parteContrariaDados }),
        ...(clienteDados && { cliente_dados: clienteDados }),
        ...(Object.keys(acaoDados).length > 0 && { acao_dados: acaoDados }),
      };

      console.log('[PDF-PREVIEW] Payload completo:', payload);

      // Chamar API
      const response = await apiFetch<PreviewResult>(API_ROUTES.preview, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success && response.data?.pdf_url) {
        const pdfData = {
          pdf_url: response.data.pdf_url,
          template_id: templateId,
          gerado_em: new Date().toISOString(),
        };

        setPdfUrl(response.data.pdf_url);
        setDadosVisualizacaoPdf(pdfData);
        toast.success("Sucesso", { description: "Documento gerado com sucesso!" });
      } else {
        throw new Error(response.error || response.message || "Erro ao gerar documento");
      }
    } catch (err: unknown) {
      console.error("Erro ao gerar PDF preview:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao gerar documento. Tente novamente.";

      setError(errorMessage);
      toast.error("Erro", { description: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Persiste a ação (cria contrato) se ainda não foi criado.
   * Arquitetura commit-on-complete: a criação do contrato é postergada
   * até este step, onde o backend precisa do contrato_id para renderizar o preview.
   */
  const persistirAcaoSeNecessario = async (): Promise<boolean> => {
    if (contratoJaCriado) return true;
    if (!dadosPessoais || !dadosContrato || !segmentoId || !formularioId) return true;

    try {
      setIsGenerating(true);

      const trtId = (dadosContrato._trt_id as number | null) ?? null;
      const trtNome = (dadosContrato._trt_nome as string | null) ?? null;
      const segNome =
        (dadosContrato._segmento_nome as string | undefined) ?? segmentoNome ?? "Segmento";
      const formNome =
        (dadosContrato._formulario_nome as string | undefined) ??
        formularioNome ??
        "Formulário Dinâmico";

      // Separar metadados internos (_prefix) dos dados reais da ação
      const RESERVED_INTERNAL = new Set([
        "contrato_id",
        "cliente_dados",
        "parte_contraria_dados",
        "_trt_id",
        "_trt_nome",
        "_segmento_nome",
        "_formulario_nome",
      ]);
      const dadosAcao: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(dadosContrato)) {
        if (!RESERVED_INTERNAL.has(key) && value !== undefined && value !== null) {
          dadosAcao[key] = value;
        }
      }

      const payload: SalvarAcaoRequest = {
        segmentoId,
        segmentoNome: segNome,
        formularioId,
        formularioNome: formNome,
        clienteId: dadosPessoais.cliente_id,
        clienteNome: dadosPessoais.nome_completo,
        clienteCpf: dadosPessoais.cpf,
        trt_id: trtId?.toString() || "",
        trt_nome: trtNome || "",
        dados: dadosAcao,
      };

      const response = await fetch(API_ROUTES.salvarAcao, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        if (contentType?.includes("application/json")) {
          const errorBody = await response.json();
          throw new Error(errorBody.error || errorBody.message || "Erro ao salvar dados da ação");
        }
        if (response.status === 404) {
          console.warn("[ASSINATURA_DIGITAL] salvar-acao endpoint 404, prosseguindo sem contrato");
          setContratoJaCriado(true);
          return true;
        }
        throw new Error(`Erro do servidor (${response.status})`);
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Erro ao salvar dados da ação");

      setDadosContrato({
        contrato_id: result.data.contrato_id,
        cliente_dados: result.data.cliente_dados,
        parte_contraria_dados: result.data.parte_contraria_dados,
      });
      setContratoJaCriado(true);
      return true;
    } catch (err) {
      console.error("Erro ao persistir ação:", err);
      const msg = err instanceof Error ? err.message : "Erro ao criar contrato";
      setError(msg);
      toast.error("Erro ao criar contrato", { description: msg });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // Ao montar, verificar se já existe PDF gerado e se está válido
  useEffect(() => {
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

    if (dadosVisualizacaoPdf?.pdf_url && dadosVisualizacaoPdf.gerado_em) {
      const geradoEm = new Date(dadosVisualizacaoPdf.gerado_em).getTime();
      const agora = Date.now();

      // Verificar se o cache ainda é válido (dentro do TTL)
      if (agora - geradoEm < CACHE_TTL_MS) {
        setPdfUrl(dadosVisualizacaoPdf.pdf_url);
        return;
      }
    }

    // Fluxo: persistir ação (se necessário) → gerar preview
    (async () => {
      const ok = await persistirAcaoSeNecessario();
      if (ok) {
        gerarPdfPreview();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-invalidate preview when critical data changes
  const lastKeysRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${dadosPessoais?.cliente_id ?? ''}-${dadosContrato?.contrato_id ?? ''}`;
    if (lastKeysRef.current && lastKeysRef.current !== key && dadosVisualizacaoPdf?.pdf_url) {
      setDadosVisualizacaoPdf(null);
      setPdfUrl(null);
      if (!isGenerating && !isFetchingTemplate) {
        toast("Dados alterados", { description: "Documento atualizado automaticamente." });
        gerarPdfPreview();
      }
    }
    lastKeysRef.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosPessoais?.cliente_id, dadosContrato?.contrato_id]);

  const handleContinuar = () => {
    if (!pdfUrl) {
      toast.error("Atenção", { description: "Aguarde o documento ser gerado antes de continuar." });
      return;
    }
    proximaEtapa();
  };

  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateIdSelecionado(newTemplateId);
    // Clear cache and regenerate with new template
    setDadosVisualizacaoPdf(null);
    setPdfUrl(null);
    gerarPdfPreview();
  };

  const isLoading = isGenerating || isFetchingTemplate;

  return (
    <FormStepLayout
      title="Revisão do documento"
      description="Revise o documento antes de assinar"
      onPrevious={etapaAnterior}
      onNext={handleContinuar}
      nextLabel="Continuar"
      isNextDisabled={isLoading || !pdfUrl}
      isPreviousDisabled={isLoading}
      isLoading={isLoading}
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">
            {isFetchingTemplate ? 'Buscando template...' : 'Gerando documento...'}
          </p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao gerar documento</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={gerarPdfPreview}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {pdfUrl && !isLoading && (
        <div className="space-y-4">
          {/* Multi-template selector (Comment 1) */}
          {templateMetadatas.length > 1 && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">
                Escolha o modelo do documento
              </Label>
              <RadioGroup
                value={templateIdSelecionado || ''}
                onValueChange={handleTemplateChange}
                className="space-y-2"
              >
                {templateMetadatas.map((meta) => (
                  <div key={meta.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={meta.id} id={meta.id} />
                    <Label htmlFor={meta.id} className="font-normal cursor-pointer">
                      {meta.nome}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="bg-info/5 border border-info/15 rounded-lg p-4">
            <p className="text-sm text-info">
              <strong>Importante:</strong> Revise cuidadosamente todas as informações do documento antes de prosseguir para a assinatura.
            </p>
          </div>
          <div className="border rounded-lg overflow-hidden bg-muted">
            <PdfPreviewDynamic pdfUrl={pdfUrl} />
          </div>
        </div>
      )}
    </FormStepLayout>
  );
}
