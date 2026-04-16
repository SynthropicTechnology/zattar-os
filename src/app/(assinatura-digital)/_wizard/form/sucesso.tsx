'use client';

import { useState } from 'react';
import { CheckCircle2, Download, FileText, Loader2, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

import { Button } from '@/components/ui/button';
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import type { PdfGerado } from '@/shared/assinatura-digital/types/store';
import FormStepLayout from './form-step-layout';

export default function Sucesso() {
  const resetAll = useFormularioStore((state) => state.resetAll);
  const getCachedTemplate = useFormularioStore((state) => state.getCachedTemplate);
  const dadosPessoais = useFormularioStore((state) => state.dadosPessoais);
  const pdfsGerados = useFormularioStore((state) => state.pdfsGerados);

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  /**
   * Obtém o nome do template a partir do template_id
   * @param templateId - UUID do template
   * @returns Nome do template ou fallback
   */
  const getTemplateName = (templateId: string): string => {
    const template = getCachedTemplate(templateId);
    return template?.nome || 'Documento';
  };

  /**
   * Faz download de um PDF individual.
   *
   * @param pdf - Objeto com informações do PDF
   * @param index - Índice do PDF na lista (para nomenclatura fallback)
   */
  const handleDownloadIndividual = async (pdf: PdfGerado, _index: number) => {
    if (!pdf.pdf_url) {
      toast.error('URL do documento não disponível');
      return;
    }

    // Validar URL
    if (!pdf.pdf_url.startsWith('http://') && !pdf.pdf_url.startsWith('https://')) {
      toast.error('URL do documento inválida');
      console.warn('⚠️ PDF com URL relativa (inválida):', pdf.pdf_url);
      return;
    }

    console.log(`⬇️ Iniciando download individual:`, pdf.pdf_url);

    // Obter nome do template para usar como nome do arquivo
    const templateName = getTemplateName(pdf.template_id);
    const fileName = `${templateName}.pdf`;

    // Criar elemento <a> dinamicamente
    const link = document.createElement('a');
    link.href = pdf.pdf_url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Adicionar ao DOM temporariamente, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Download iniciado!');
  };

  /**
   * Faz download de todos os PDFs em um arquivo ZIP.
   *
   * Processo:
   * 1. Valida todos os PDFs
   * 2. Faz fetch de cada PDF como blob
   * 3. Cria arquivo ZIP com JSZip
   * 4. Baixa o ZIP
   */
  const handleDownloadTodosZip = async () => {
    if (!pdfsGerados || pdfsGerados.length === 0) {
      toast.error('Nenhum documento disponível para download');
      return;
    }

    // Validar URLs antes de processar
    const pdfsValidos = pdfsGerados.filter(pdf => {
      if (!pdf.pdf_url) {
        console.warn('⚠️ PDF sem URL:', pdf);
        return false;
      }
      if (!pdf.pdf_url.startsWith('http://') && !pdf.pdf_url.startsWith('https://')) {
        console.warn('⚠️ PDF com URL relativa (inválida):', pdf.pdf_url);
        return false;
      }
      return true;
    });

    if (pdfsValidos.length === 0) {
      toast.error('Nenhum documento válido encontrado para download');
      return;
    }

    setIsDownloadingZip(true);
    toast.loading('Preparando documentos...', { id: 'download-zip' });

    try {
      const zip = new JSZip();

      // Fazer fetch de todos os PDFs e adicionar ao ZIP
      const fetchPromises = pdfsValidos.map(async (pdf, index) => {
        try {
          console.log(`📥 Fazendo fetch do PDF ${index + 1}/${pdfsValidos.length}:`, pdf.pdf_url);

          const response = await fetch(pdf.pdf_url);

          if (!response.ok) {
            throw new Error(`Falha ao baixar PDF: ${response.statusText}`);
          }

          const blob = await response.blob();
          const templateName = getTemplateName(pdf.template_id);
          const fileName = `${templateName}.pdf`;

          zip.file(fileName, blob);

          console.log(`✅ PDF ${index + 1} adicionado ao ZIP: ${fileName}`);
        } catch (error) {
          console.error(`❌ Erro ao processar PDF ${index + 1}:`, error);
          throw error;
        }
      });

      await Promise.all(fetchPromises);

      console.log('🗜️ Gerando arquivo ZIP...');

      // Gerar o ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Criar nome do arquivo com timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const zipFileName = `documentos-assinados-${timestamp}.zip`;

      // Baixar o ZIP
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar o object URL
      URL.revokeObjectURL(link.href);

      console.log('✅ ZIP baixado com sucesso:', zipFileName);

      toast.success(`${pdfsValidos.length} documento(s) baixado(s) em ZIP!`, { id: 'download-zip' });
    } catch (error) {
      console.error('❌ Erro ao criar ZIP:', error);
      toast.error('Erro ao preparar documentos para download. Tente baixar individualmente.', { id: 'download-zip' });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Verificar se há PDFs gerados
  const hasPdfs = pdfsGerados && pdfsGerados.length > 0;
  const hasMultiplePdfs = pdfsGerados && pdfsGerados.length > 1;

  // Filtrar PDFs válidos para exibição
  const pdfsValidos = hasPdfs
    ? pdfsGerados.filter(pdf =>
        pdf.pdf_url &&
        (pdf.pdf_url.startsWith('http://') || pdf.pdf_url.startsWith('https://'))
      )
    : [];

  // Definir título dinamicamente baseado na quantidade de documentos
  const tituloSucesso = pdfsValidos.length > 1
    ? 'Documentos assinados com sucesso!'
    : 'Documento assinado com sucesso!';

  return (
    <FormStepLayout
      title={tituloSucesso}
      description="Em breve entraremos em contato."
      onNext={resetAll}
      nextLabel="Iniciar novo formulário"
      hidePrevious
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2
            aria-hidden="true"
            className="h-16 w-16 sm:h-20 sm:w-20 text-success"
          />
          {dadosPessoais?.email && (
            <p className="text-sm text-muted-foreground">
              Os documentos serão enviados para {dadosPessoais.email}.
            </p>
          )}
        </div>

        {pdfsValidos.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              {pdfsValidos.map((pdf, index) => (
                <button
                  key={pdf.template_id || index}
                  type="button"
                  onClick={() => handleDownloadIndividual(pdf, index)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-border/30 bg-muted/30 p-3 text-left transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  <FileText className="h-5 w-5 shrink-0 text-info" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {getTemplateName(pdf.template_id)}
                    </p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>

            {hasMultiplePdfs && (
              <Button
                type="button"
                variant="default"
                className="h-12 w-full active:scale-95"
                onClick={handleDownloadTodosZip}
                disabled={isDownloadingZip}
              >
                {isDownloadingZip ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparando ZIP...
                  </>
                ) : (
                  <>
                    <PackageOpen className="mr-2 h-4 w-4" />
                    Baixar todos em ZIP
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-destructive">
              Documentos não disponíveis para download. Por favor, entre em contato com o suporte.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-info/15 bg-info/10 p-4">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-info" />
            <div className="text-sm">
              <p className="mb-1 font-medium text-info">Sobre seus documentos:</p>
              <ul className="space-y-1 text-info">
                <li>• Possuem validade jurídica</li>
                <li>• Guarde-os para futura referência</li>
                <li>• Em caso de dúvidas, entre em contato conosco</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </FormStepLayout>
  );
}