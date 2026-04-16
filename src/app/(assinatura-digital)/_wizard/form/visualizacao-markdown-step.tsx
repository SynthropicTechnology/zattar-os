'use client';

import { useState, useEffect, useRef } from "react";
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import FormStepLayout from "./form-step-layout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from 'sonner';
import ReactMarkdown from "react-markdown";
import { renderMarkdownWithVariables, getMarkdownPlugins } from '@/shared/assinatura-digital/utils/markdown-renderer';
import type { Template } from '@/shared/assinatura-digital/types/domain';
import type { VisualizacaoMarkdownData, ClienteDadosGeracao, DadosGeracao } from '@/shared/assinatura-digital/types/api';
import { apiFetch } from "@/lib/http/api-fetch";
import { formatCPF, formatCEP, formatTelefone } from '@/shared/assinatura-digital/utils/formatters';

interface TemplateMetadata {
  id: string;
  nome: string;
  versao?: number;
  status?: string;
}

export default function VisualizacaoMarkdownStep() {
  // Estados locais
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);
  const [conteudoRenderizado, setConteudoRenderizado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templateMetadatas, setTemplateMetadatas] = useState<TemplateMetadata[]>([]);

  // Extrair dados do store
  const {
    dadosPessoais,
    dadosContrato,
    fotoBase64,
    templateIdSelecionado,
    templateIds,
    dadosVisualizacaoMarkdown,
    setDadosVisualizacaoMarkdown,
    setTemplateIdSelecionado,
    segmentoId,
    proximaEtapa,
    etapaAnterior,
    getCachedTemplate,
    setCachedTemplate,
  } = useFormularioStore();

  // useEffect 1: Buscar metadados de múltiplos templates
  // Comment 3 fix: Use cache to avoid duplicate fetches
  useEffect(() => {
    if (!templateIds || templateIds.length <= 1) {
      setTemplateMetadatas([]);
      return;
    }

    let cancelled = false;
    setIsFetchingTemplate(true);
    (async () => {
      try {
        const metadataPromises = templateIds.map(async (id) => {
          // Comment 3 fix: Check cache first
          const cachedTemplate = getCachedTemplate(id);
          if (cachedTemplate) {
            return {
              id: String(id),
              nome: cachedTemplate.nome || String(id),
              versao: cachedTemplate.versao,
              status: cachedTemplate.status,
            };
          } else {
            // Fetch from API
            const response = await apiFetch<Template>(`/api/templates/${id}`);
            const template = response.data as Template;
            setCachedTemplate(id, template);
            return {
              id: String(id),
              nome: template.nome || String(id),
              versao: template.versao,
              status: template.status,
            };
          }
        });
        if (!cancelled) {
          const metadatas = await Promise.all(metadataPromises);
          setTemplateMetadatas(metadatas);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao buscar metadados:", err);
          setError("Erro ao buscar metadados dos templates");
        }
      } finally {
        if (!cancelled) {
          setIsFetchingTemplate(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [templateIds, getCachedTemplate, setCachedTemplate]);

  // Função processarMarkdown
  const processarMarkdown = async (templateId?: string) => {
    const effectiveTemplateId = templateId || templateIdSelecionado || (templateIds && templateIds[0]);
    if (!effectiveTemplateId) {
      setError("Nenhum template selecionado");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Buscar template se não estiver em cache
      let template = getCachedTemplate(effectiveTemplateId);
      if (!template) {
        const response = await apiFetch<Template>(`/api/templates/${effectiveTemplateId}`);
        template = response.data as Template;
        setCachedTemplate(effectiveTemplateId, template);
      }

      if (!template.conteudo_markdown) {
        throw new Error("Template não possui conteúdo Markdown");
      }

      // Preparar dados para geração
      const rawCelular = dadosPessoais?.celular || '';
      const rawTelefone = dadosPessoais?.telefone || '';
      const cliente: ClienteDadosGeracao = {
        nome: dadosPessoais?.nome_completo || '',
        cpf: formatCPF(dadosPessoais?.cpf || ''),
        rg: dadosPessoais?.rg || undefined,
        data_nascimento: dadosPessoais?.data_nascimento || '',
        estado_civil: dadosPessoais?.estado_civil || '',
        genero: dadosPessoais?.genero || '',
        nacionalidade: dadosPessoais?.nacionalidade || '',
        email: dadosPessoais?.email || '',
        celular: formatTelefone(rawCelular),
        telefone: formatTelefone(rawTelefone || rawCelular),
        logradouro: dadosPessoais?.endereco_logradouro || '',
        numero: dadosPessoais?.endereco_numero || '',
        complemento: dadosPessoais?.endereco_complemento || undefined,
        bairro: dadosPessoais?.endereco_bairro || '',
        cidade: dadosPessoais?.endereco_cidade || '',
        estado: dadosPessoais?.endereco_uf || '',
        cep: formatCEP(dadosPessoais?.endereco_cep || ''),
      };
      const dadosGeracao: DadosGeracao = {
        template_id: effectiveTemplateId,
        cliente,
        contrato: dadosContrato || {},
        acao: {}, // Inicializar como objeto vazio para preview
        assinatura: {
          foto_base64: fotoBase64 || "",
          assinatura_base64: "", // Vazio para preview
        },
        sistema: {
          numero_contrato: `PREVIEW-${Date.now()}`,
          protocolo: `PREV-${dadosPessoais?.cliente_id ?? 0}-${Date.now()}`,
          data_geracao: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        },
        segmento: {
          id: segmentoId || 1,
          nome: `Segmento ${segmentoId || 1}`,
          slug: `segmento-${segmentoId || 1}`,
          ativo: true,
        },
      };

      // Processar Markdown com variáveis
      const conteudoProcessado = renderMarkdownWithVariables(
        template.conteudo_markdown,
        dadosGeracao as Record<string, unknown>
      );

      console.log("[MARKDOWN-PREVIEW] Markdown processado:", {
        template_id: effectiveTemplateId,
        content_length: conteudoProcessado.length,
      });

      // Armazenar resultado
      const dadosVisualizacao: VisualizacaoMarkdownData = {
        conteudo_html: conteudoProcessado,
        conteudoMarkdown: conteudoProcessado,
        template_id: effectiveTemplateId,
        gerado_em: new Date().toISOString(),
        geradoEm: new Date().toISOString(),
      };

      setConteudoRenderizado(conteudoProcessado);
      setDadosVisualizacaoMarkdown(dadosVisualizacao);

      toast.success("Documento processado com sucesso!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao processar documento";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Erro ao processar Markdown:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // useEffect 3: Processar Markdown na montagem (com cache)
  useEffect(() => {
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

    if (dadosVisualizacaoMarkdown?.conteudoMarkdown && dadosVisualizacaoMarkdown.geradoEm) {
      const geradoEm = new Date(dadosVisualizacaoMarkdown.geradoEm).getTime();
      const agora = Date.now();

      // Verificar se o cache ainda é válido (dentro do TTL)
      if (agora - geradoEm < CACHE_TTL_MS) {
        setConteudoRenderizado(dadosVisualizacaoMarkdown.conteudoMarkdown);
        return;
      }
    }

    // Se não há cache válido, processar novo
    processarMarkdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect 4: Auto-invalidar ao mudar dados críticos
  const lastKeysRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${dadosPessoais?.cliente_id ?? ""}-${dadosContrato?.contrato_id ?? ""}`;
    if (lastKeysRef.current && lastKeysRef.current !== key && dadosVisualizacaoMarkdown?.conteudoMarkdown) {
      setDadosVisualizacaoMarkdown(null);
      setConteudoRenderizado(null);
      if (!isProcessing && !isFetchingTemplate) {
        toast.info("Documento atualizado automaticamente.");
        processarMarkdown();
      }
    }
    lastKeysRef.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosPessoais?.cliente_id, dadosContrato?.contrato_id]);

  // Handler handleContinuar
  const handleContinuar = () => {
    if (!conteudoRenderizado) {
      toast.warning("Aguarde o documento ser processado antes de continuar.");
      return;
    }
    proximaEtapa();
  };

  // Handler handleTemplateChange
  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateIdSelecionado(newTemplateId);
    // Limpar cache e reprocessar com novo template
    setDadosVisualizacaoMarkdown(null);
    setConteudoRenderizado(null);
    processarMarkdown(newTemplateId);
  };

  // Variáveis auxiliares
  const isLoading = isProcessing || isFetchingTemplate;
  const plugins = getMarkdownPlugins();

  return (
    <FormStepLayout
      title="Revisão do documento"
      description="Revise o documento antes de assinar"
      onPrevious={etapaAnterior}
      onNext={handleContinuar}
      nextLabel="Continuar"
      isNextDisabled={isLoading || !conteudoRenderizado}
      isPreviousDisabled={isLoading}
      isLoading={isLoading}
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">
            {isFetchingTemplate ? "Buscando template..." : "Processando documento..."}
          </p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao processar documento</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => processarMarkdown()}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {conteudoRenderizado && !isLoading && (
        <div className="space-y-4">
          {/* Seletor de múltiplos templates */}
          {templateMetadatas.length > 1 && (
            <div className="bg-card border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">
                Escolha o modelo do documento
              </Label>
              <RadioGroup
                value={templateIdSelecionado || ""}
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

          {/* Alert informativo */}
          <div className="bg-info/10 border border-info/15 rounded-lg p-4">
            <p className="text-sm text-info">
              <strong>Importante:</strong> Revise cuidadosamente todas as informações do documento antes de prosseguir para a assinatura.
            </p>
          </div>

          {/* Conteúdo Markdown renderizado */}
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="container">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={plugins.remarkPlugins}
                  rehypePlugins={plugins.rehypePlugins}
                >
                  {conteudoRenderizado}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </FormStepLayout>
  );
}
