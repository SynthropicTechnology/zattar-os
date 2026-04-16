'use client';

import { useFormularioStore } from '@/shared/assinatura-digital/store';
import type { ContratoPendente } from '@/shared/assinatura-digital/types/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { FileText, Plus, Calendar, Users } from 'lucide-react';
import FormStepLayout from './form-step-layout';

export default function ContratosPendentesStep() {
  const {
    dadosCPF,
    contratosPendentes,
    stepConfigs,
    setDadosPessoais,
    setDadosContrato,
    setEtapaAtual,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore();

  const handleSelecionarContrato = (contrato: ContratoPendente) => {
    if (!dadosCPF?.dadosCliente || !dadosCPF.clienteId) {
      toast.error('Erro', { description: 'Dados do cliente não encontrados.' });
      return;
    }

    const cliente = dadosCPF.dadosCliente;

    // Popula dadosPessoais a partir dos dados do cliente existente
    setDadosPessoais({
      cliente_id: dadosCPF.clienteId,
      nome_completo: cliente.nome,
      cpf: cliente.cpf ?? dadosCPF.cpf,
      rg: cliente.rg ?? undefined,
      data_nascimento: cliente.data_nascimento ?? '',
      estado_civil: cliente.estado_civil ?? '',
      genero: cliente.genero ?? '',
      nacionalidade: cliente.nacionalidade ?? '',
      email: cliente.email ?? '',
      celular: cliente.celular ?? '',
      telefone: cliente.telefone ?? undefined,
      endereco_cep: cliente.cep ?? '',
      endereco_logradouro: cliente.logradouro ?? '',
      endereco_numero: cliente.numero ?? '',
      endereco_complemento: cliente.complemento ?? undefined,
      endereco_bairro: cliente.bairro ?? '',
      endereco_cidade: cliente.cidade ?? '',
      endereco_uf: cliente.uf ?? '',
    });

    // Popula dadosContrato com o contrato selecionado + parte contrária
    const parteContraria = contrato.partes?.find(
      (p) => p.tipo_entidade === 'parte_contraria'
    );
    setDadosContrato({
      contrato_id: contrato.id,
      ...(parteContraria?.nome_snapshot && {
        parte_contraria_dados: [{
          id: 0,
          nome: parteContraria.nome_snapshot,
          cpf: parteContraria.cpf_cnpj_snapshot || null,
        }],
      }),
    });

    // Pular para a etapa de visualizacao do PDF
    const visualizacaoStep = stepConfigs?.find(
      (s) => s.component === 'VisualizacaoPdfStep'
    );

    if (visualizacaoStep) {
      setEtapaAtual(visualizacaoStep.index);
      toast.success('Contrato selecionado', {
        description: 'Revise o contrato antes de assinar.',
      });
    } else {
      // Fallback: avanca normalmente
      proximaEtapa();
    }
  };

  const handleNovoContrato = () => {
    // Não chamar clearContratosPendentes() aqui — isso dispara um rebuild de
    // stepConfigs no FormularioContainer (remove o step pendentes), o que muda
    // todos os índices. O proximaEtapa() usa o índice antigo e acaba pulando
    // DadosPessoais, indo direto para DynamicFormStep.
    proximaEtapa();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getParteContraria = (contrato: ContratoPendente) => {
    const parte = contrato.partes?.find(
      (p) => p.tipo_entidade === 'parte_contraria'
    );
    return parte?.nome_snapshot || null;
  };

  if (!contratosPendentes || contratosPendentes.length === 0) {
    proximaEtapa();
    return null;
  }

  return (
    <FormStepLayout
      title="Contratos Pendentes"
      description="Você possui contratos aguardando assinatura. Deseja assinar um deles ou criar um novo?"
      onPrevious={etapaAnterior}
      hideNext
    >
      <div className="space-y-4">
        {contratosPendentes.map((contrato) => {
          const parteContraria = getParteContraria(contrato);

          return (
            <Card key={contrato.id} className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contrato #{contrato.id}
                  </CardTitle>
                  <Badge variant="secondary">Aguardando assinatura</Badge>
                </div>
                {contrato.segmento_nome && (
                  <CardDescription>{contrato.segmento_nome}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Criado em {formatDate(contrato.cadastrado_em)}</span>
                  </div>
                  {parteContraria && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>Parte contrária: {parteContraria}</span>
                    </div>
                  )}
                  {contrato.observacoes && (
                    <p className="mt-1 text-xs italic">{contrato.observacoes}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  size="sm"
                  onClick={() => handleSelecionarContrato(contrato)}
                >
                  Assinar este contrato
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleNovoContrato}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar novo contrato
          </Button>
        </div>
      </div>
    </FormStepLayout>
  );
}
