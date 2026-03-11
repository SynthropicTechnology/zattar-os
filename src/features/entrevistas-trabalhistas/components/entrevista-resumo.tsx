'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, FileText, CheckCircle2, XCircle } from 'lucide-react';
import type { EntrevistaTrabalhista, EntrevistaAnexo } from '../domain';
import {
  MODULO_LABELS,
  getModulosPorTrilha,
  // Trilha A
  CTPS_OPTIONS,
  CONTROLE_PONTO_OPTIONS,
  TIPO_RISCO_OPTIONS,
  MOTIVO_RUPTURA_OPTIONS,
  VERBAS_RECEBIDAS_OPTIONS,
  // Trilha B
  TIPO_PLATAFORMA_OPTIONS,
  RECUSA_CONSEQUENCIA_OPTIONS,
  PERCENTUAL_RENDA_OPTIONS,
  QTD_PLATAFORMAS_OPTIONS,
  FAIXA_HORAS_DIA_OPTIONS,
  DIAS_SEMANA_OPTIONS,
  FORMA_DESLIGAMENTO_OPTIONS,
  TEMPO_PLATAFORMA_OPTIONS,
  // Trilha C
  ORIGEM_PJ_OPTIONS,
  TIPO_PJ_OPTIONS,
  VALOR_PAGAMENTO_OPTIONS,
  LOCAL_TRABALHO_OPTIONS,
  PROIBICAO_OUTROS_OPTIONS,
  DURACAO_RELACAO_OPTIONS,
  REGIME_FERIAS_OPTIONS,
  BENEFICIO_RECEBIDO_OPTIONS,
  // Labels
  TIPO_LITIGIO_LABELS,
  PERFIL_RECLAMANTE_LABELS,
  type PerfilReclamante,
} from '../domain';
import { useEntrevista } from '../hooks/use-entrevista';

interface EntrevistaResumoProps {
  entrevista: EntrevistaTrabalhista;
  anexos: EntrevistaAnexo[];
  contratoId: number;
  onReabrir: () => void;
}

function getLabelByValue<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | undefined,
): string {
  if (!value) return '—';
  const found = options.find((o) => o.value === value);
  return found?.label ?? value;
}

function getMultiLabels<T extends { value: string; label: string }>(
  options: readonly T[],
  values: string[] | undefined,
): string {
  if (!values || values.length === 0) return '—';
  return values
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(', ');
}

function BoolDisplay({ value }: { value: boolean | undefined }) {
  if (value === undefined) return <span className="text-muted-foreground">—</span>;
  return value ? (
    <span className="inline-flex items-center gap-1 text-green-600">
      <CheckCircle2 className="h-3.5 w-3.5" /> Sim
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-600">
      <XCircle className="h-3.5 w-3.5" /> Não
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function AnexosList({ anexos, modulo }: { anexos: EntrevistaAnexo[]; modulo: string }) {
  const filtrados = anexos.filter((a) => a.modulo === modulo);
  if (filtrados.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Anexos</p>
      {filtrados.map((anexo) => (
        <a
          key={anexo.id}
          href={anexo.arquivoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <FileText className="h-3.5 w-3.5" />
          {anexo.descricao ?? anexo.tipoAnexo}
        </a>
      ))}
    </div>
  );
}

// ============================================================================
// Seções de módulo por trilha
// ============================================================================

function ResumoVinculo({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="CTPS assinada?">{getLabelByValue(CTPS_OPTIONS, r.vinculo?.ctps_assinada)}</Field>
      {r.vinculo?.narrativa_subordinacao && (
        <Field label="Narrativa de subordinação">
          <p className="whitespace-pre-wrap">{r.vinculo.narrativa_subordinacao}</p>
        </Field>
      )}
      <AnexosList anexos={anexos} modulo="vinculo" />
    </div>
  );
}

function ResumoJornada({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Controle de ponto">
        {getMultiLabels(CONTROLE_PONTO_OPTIONS, r.jornada?.controle_ponto)}
      </Field>
      <Field label="Intervalo de 1h concedido?">
        <BoolDisplay value={r.jornada?.intervalo_concedido} />
      </Field>
      {r.jornada?.minutos_intervalo_real !== undefined && (
        <Field label="Intervalo real (minutos)">{r.jornada.minutos_intervalo_real}</Field>
      )}
      <Field label="Horas extras pagas?">
        <BoolDisplay value={r.jornada?.horas_extras_pagas} />
      </Field>
      <Field label="Banco de horas compensado?">
        <BoolDisplay value={r.jornada?.banco_horas_compensado} />
      </Field>
      {r.jornada?.narrativa_dia_tipico && (
        <Field label="Dia típico de trabalho">
          <p className="whitespace-pre-wrap">{r.jornada.narrativa_dia_tipico}</p>
        </Field>
      )}
      <AnexosList anexos={anexos} modulo="jornada" />
    </div>
  );
}

function ResumoSaudeAmbiente({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Exposição a riscos?">
        <BoolDisplay value={r.saude_ambiente?.exposicao_riscos} />
      </Field>
      {r.saude_ambiente?.tipos_risco && r.saude_ambiente.tipos_risco.length > 0 && (
        <Field label="Tipos de risco">
          {getMultiLabels(TIPO_RISCO_OPTIONS, r.saude_ambiente.tipos_risco)}
        </Field>
      )}
      {r.saude_ambiente?.descricao_risco && (
        <Field label="Descrição do risco">
          <p className="whitespace-pre-wrap">{r.saude_ambiente.descricao_risco}</p>
        </Field>
      )}
      <Field label="Assédio moral?">
        <BoolDisplay value={r.saude_ambiente?.assedio_moral} />
      </Field>
      {r.saude_ambiente?.relato_assedio && (
        <Field label="Relato do assédio">
          <p className="whitespace-pre-wrap">{r.saude_ambiente.relato_assedio}</p>
        </Field>
      )}
      {r.saude_ambiente?.testemunhas_assedio && (
        <Field label="Testemunhas/gravações">
          <p className="whitespace-pre-wrap">{r.saude_ambiente.testemunhas_assedio}</p>
        </Field>
      )}
      <AnexosList anexos={anexos} modulo="saude_ambiente" />
    </div>
  );
}

function ResumoRuptura({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Motivo do término">
        {getLabelByValue(MOTIVO_RUPTURA_OPTIONS, r.ruptura?.motivo)}
      </Field>
      <Field label="Verbas recebidas">
        {getMultiLabels(VERBAS_RECEBIDAS_OPTIONS, r.ruptura?.verbas_recebidas)}
      </Field>
      <AnexosList anexos={anexos} modulo="ruptura" />
    </div>
  );
}

function ResumoControleAlgoritmico({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Tipo de plataforma">{getLabelByValue(TIPO_PLATAFORMA_OPTIONS, r.controle_algoritmico?.tipo_plataforma)}</Field>
      {r.controle_algoritmico?.nome_plataforma && (
        <Field label="Nome da plataforma">{r.controle_algoritmico.nome_plataforma}</Field>
      )}
      <Field label="Plataforma define preço?"><BoolDisplay value={r.controle_algoritmico?.plataforma_define_preco} /></Field>
      <Field label="Pode recusar corrida?">{getLabelByValue(RECUSA_CONSEQUENCIA_OPTIONS, r.controle_algoritmico?.pode_recusar_corrida)}</Field>
      <Field label="Sistema de avaliação?"><BoolDisplay value={r.controle_algoritmico?.sistema_avaliacao} /></Field>
      <Field label="Punido por nota baixa?"><BoolDisplay value={r.controle_algoritmico?.punido_nota_baixa} /></Field>
      {r.controle_algoritmico?.tipo_punicao && (
        <Field label="Tipo de punição">{r.controle_algoritmico.tipo_punicao}</Field>
      )}
      <Field label="Monitoramento GPS?"><BoolDisplay value={r.controle_algoritmico?.monitoramento_gps} /></Field>
      <Field label="Meta de aceitação mínima?"><BoolDisplay value={r.controle_algoritmico?.meta_aceitacao_minima} /></Field>
      {r.controle_algoritmico?.narrativa_controle && (
        <Field label="Narrativa do controle">
          <p className="whitespace-pre-wrap">{r.controle_algoritmico.narrativa_controle}</p>
        </Field>
      )}
      <AnexosList anexos={anexos} modulo="controle_algoritmico" />
    </div>
  );
}

function ResumoDependenciaEconomica({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Percentual da renda">{getLabelByValue(PERCENTUAL_RENDA_OPTIONS, r.dependencia_economica?.percentual_renda)}</Field>
      <Field label="Quantidade de plataformas">{getLabelByValue(QTD_PLATAFORMAS_OPTIONS, r.dependencia_economica?.qtd_plataformas)}</Field>
      <Field label="Investimento específico?"><BoolDisplay value={r.dependencia_economica?.investimento_especifico} /></Field>
      {r.dependencia_economica?.descricao_investimento && (
        <Field label="Descrição do investimento">
          <p className="whitespace-pre-wrap">{r.dependencia_economica.descricao_investimento}</p>
        </Field>
      )}
      <Field label="Única fonte de renda?"><BoolDisplay value={r.dependencia_economica?.unica_fonte_renda} /></Field>
      <Field label="Cláusula de exclusividade?"><BoolDisplay value={r.dependencia_economica?.clausula_exclusividade} /></Field>
      <AnexosList anexos={anexos} modulo="dependencia_economica" />
    </div>
  );
}

function ResumoCondicoesTrabalhoGig({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Horas por dia">{getLabelByValue(FAIXA_HORAS_DIA_OPTIONS, r.condicoes_trabalho_gig?.horas_dia)}</Field>
      <Field label="Dias por semana">{getLabelByValue(DIAS_SEMANA_OPTIONS, r.condicoes_trabalho_gig?.dias_semana)}</Field>
      <Field label="Acesso a banheiro/descanso?"><BoolDisplay value={r.condicoes_trabalho_gig?.acesso_banheiro_descanso} /></Field>
      <Field label="Sofreu acidente?"><BoolDisplay value={r.condicoes_trabalho_gig?.sofreu_acidente} /></Field>
      {r.condicoes_trabalho_gig?.sofreu_acidente && (
        <Field label="Plataforma assistiu?"><BoolDisplay value={r.condicoes_trabalho_gig.plataforma_assistiu_acidente} /></Field>
      )}
      <Field label="Plataforma fornece EPI?"><BoolDisplay value={r.condicoes_trabalho_gig?.plataforma_fornece_epi} /></Field>
      <Field label="Possui seguro?"><BoolDisplay value={r.condicoes_trabalho_gig?.possui_seguro} /></Field>
      {r.condicoes_trabalho_gig?.narrativa_condicoes && (
        <Field label="Narrativa das condições">
          <p className="whitespace-pre-wrap">{r.condicoes_trabalho_gig.narrativa_condicoes}</p>
        </Field>
      )}
      <AnexosList anexos={anexos} modulo="condicoes_trabalho_gig" />
    </div>
  );
}

function ResumoDesligamentoPlataforma({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Forma de desligamento">{getLabelByValue(FORMA_DESLIGAMENTO_OPTIONS, r.desligamento_plataforma?.forma_desligamento)}</Field>
      <Field label="Aviso prévio?"><BoolDisplay value={r.desligamento_plataforma?.aviso_previo} /></Field>
      <Field label="Direito de defesa?"><BoolDisplay value={r.desligamento_plataforma?.direito_defesa} /></Field>
      {r.desligamento_plataforma?.motivo_informado && (
        <Field label="Motivo informado">
          <p className="whitespace-pre-wrap">{r.desligamento_plataforma.motivo_informado}</p>
        </Field>
      )}
      <Field label="Saldo retido?"><BoolDisplay value={r.desligamento_plataforma?.saldo_retido} /></Field>
      {r.desligamento_plataforma?.valor_retido_aproximado && (
        <Field label="Valor retido">{r.desligamento_plataforma.valor_retido_aproximado}</Field>
      )}
      <Field label="Tempo na plataforma">{getLabelByValue(TEMPO_PLATAFORMA_OPTIONS, r.desligamento_plataforma?.tempo_plataforma)}</Field>
      <AnexosList anexos={anexos} modulo="desligamento_plataforma" />
    </div>
  );
}

function ResumoContratoPJ({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Origem do PJ">{getLabelByValue(ORIGEM_PJ_OPTIONS, r.contrato_pj?.origem_pj)}</Field>
      <Field label="Tipo de PJ">{getLabelByValue(TIPO_PJ_OPTIONS, r.contrato_pj?.tipo_pj)}</Field>
      <Field label="Contrato formal?"><BoolDisplay value={r.contrato_pj?.contrato_formal} /></Field>
      <Field label="Empresa paga custos CNPJ?"><BoolDisplay value={r.contrato_pj?.empresa_paga_custos_cnpj} /></Field>
      <Field label="Emissão NF mensal?"><BoolDisplay value={r.contrato_pj?.emissao_nf_mensal} /></Field>
      <Field label="Tipo de pagamento">{getLabelByValue(VALOR_PAGAMENTO_OPTIONS, r.contrato_pj?.tipo_pagamento)}</Field>
      {r.contrato_pj?.valor_mensal_aproximado && (
        <Field label="Valor mensal aproximado">{r.contrato_pj.valor_mensal_aproximado}</Field>
      )}
      <AnexosList anexos={anexos} modulo="contrato_pj" />
    </div>
  );
}

function ResumoSubordinacaoReal({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Cumpria horário fixo?"><BoolDisplay value={r.subordinacao_real?.cumpre_horario_fixo} /></Field>
      <Field label="Recebia ordens de superior?"><BoolDisplay value={r.subordinacao_real?.recebe_ordens_superior} /></Field>
      <Field label="Reuniões obrigatórias?"><BoolDisplay value={r.subordinacao_real?.reunioes_obrigatorias} /></Field>
      <Field label="Pedia autorização para faltar?"><BoolDisplay value={r.subordinacao_real?.pede_autorizacao_falta} /></Field>
      <Field label="Crachá/e-mail/uniforme?"><BoolDisplay value={r.subordinacao_real?.usa_cracha_email_uniforme} /></Field>
      <Field label="Local de trabalho">{getLabelByValue(LOCAL_TRABALHO_OPTIONS, r.subordinacao_real?.local_trabalho)}</Field>
      {r.subordinacao_real?.narrativa_rotina && (
        <Field label="Narrativa da rotina">
          <p className="whitespace-pre-wrap">{r.subordinacao_real.narrativa_rotina}</p>
        </Field>
      )}
      <AnexosList anexos={anexos} modulo="subordinacao_real" />
    </div>
  );
}

function ResumoExclusividadePessoalidade({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Atendia exclusivamente?"><BoolDisplay value={r.exclusividade_pessoalidade?.atende_exclusivamente} /></Field>
      <Field label="Podia enviar substituto?"><BoolDisplay value={r.exclusividade_pessoalidade?.pode_enviar_substituto} /></Field>
      <Field label="Proibição de outros clientes">{getLabelByValue(PROIBICAO_OUTROS_OPTIONS, r.exclusividade_pessoalidade?.proibicao_outros_clientes)}</Field>
      <Field label="Liberdade para recusar tarefas?"><BoolDisplay value={r.exclusividade_pessoalidade?.liberdade_recusar_tarefas} /></Field>
      <Field label="Duração da relação">{getLabelByValue(DURACAO_RELACAO_OPTIONS, r.exclusividade_pessoalidade?.duracao_relacao)}</Field>
      <AnexosList anexos={anexos} modulo="exclusividade_pessoalidade" />
    </div>
  );
}

function ResumoFraudeVerbas({ r, anexos }: { r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }) {
  return (
    <div className="space-y-3">
      <Field label="Valor mensal fixo?"><BoolDisplay value={r.fraude_verbas?.valor_mensal_fixo} /></Field>
      {r.fraude_verbas?.valor_aproximado && (
        <Field label="Valor aproximado">{r.fraude_verbas.valor_aproximado}</Field>
      )}
      <Field label="Benefícios recebidos">{getMultiLabels(BENEFICIO_RECEBIDO_OPTIONS, r.fraude_verbas?.beneficios_recebidos)}</Field>
      <Field label="13° salário disfarçado?"><BoolDisplay value={r.fraude_verbas?.decimo_terceiro_disfarado} /></Field>
      <Field label="Regime de férias">{getLabelByValue(REGIME_FERIAS_OPTIONS, r.fraude_verbas?.regime_ferias)}</Field>
      <Field label="Recebeu verbas rescisórias?"><BoolDisplay value={r.fraude_verbas?.recebeu_verbas_rescisao} /></Field>
      <Field label="Controle como CLT?"><BoolDisplay value={r.fraude_verbas?.controle_como_clt} /></Field>
      <AnexosList anexos={anexos} modulo="fraude_verbas" />
    </div>
  );
}

// ============================================================================
// Mapeamento módulo → componente de resumo
// ============================================================================

const RESUMO_COMPONENTS: Record<string, React.FC<{ r: EntrevistaTrabalhista['respostas']; anexos: EntrevistaAnexo[] }>> = {
  vinculo: ResumoVinculo,
  jornada: ResumoJornada,
  saude_ambiente: ResumoSaudeAmbiente,
  ruptura: ResumoRuptura,
  controle_algoritmico: ResumoControleAlgoritmico,
  dependencia_economica: ResumoDependenciaEconomica,
  condicoes_trabalho_gig: ResumoCondicoesTrabalhoGig,
  desligamento_plataforma: ResumoDesligamentoPlataforma,
  contrato_pj: ResumoContratoPJ,
  subordinacao_real: ResumoSubordinacaoReal,
  exclusividade_pessoalidade: ResumoExclusividadePessoalidade,
  fraude_verbas: ResumoFraudeVerbas,
};

// ============================================================================
// Componente principal
// ============================================================================

export function EntrevistaResumo({
  entrevista,
  anexos,
  contratoId,
  onReabrir,
}: EntrevistaResumoProps) {
  const { reabrir, isLoading } = useEntrevista();
  const modulos = getModulosPorTrilha(entrevista.tipoLitigio);

  const handleReabrir = async () => {
    const result = await reabrir(entrevista.id, contratoId);
    if (result) onReabrir();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {TIPO_LITIGIO_LABELS[entrevista.tipoLitigio]}
            </Badge>
            {entrevista.perfilReclamante && (
              <Badge variant="outline">
                {PERFIL_RECLAMANTE_LABELS[entrevista.perfilReclamante as PerfilReclamante] ?? entrevista.perfilReclamante}
              </Badge>
            )}
            {entrevista.testemunhasMapeadas && (
              <Badge variant="outline" className="text-green-600">
                Testemunhas mapeadas
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReabrir} disabled={isLoading}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {/* Módulos em Accordion — renderiza dinamicamente por trilha */}
      <Accordion type="multiple" defaultValue={modulos}>
        {modulos.map((modulo) => {
          const ResumoComponent = RESUMO_COMPONENTS[modulo];
          if (!ResumoComponent) return null;

          return (
            <AccordionItem key={modulo} value={modulo}>
              <AccordionTrigger>{MODULO_LABELS[modulo]}</AccordionTrigger>
              <AccordionContent>
                <ResumoComponent r={entrevista.respostas} anexos={anexos} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Notas do operador */}
      {entrevista.notasOperador && Object.keys(entrevista.notasOperador).length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Notas do Operador</p>
          {Object.entries(entrevista.notasOperador).map(([modulo, nota]) => (
            <div key={modulo} className="mb-2 last:mb-0">
              <p className="text-xs font-medium">{MODULO_LABELS[modulo as keyof typeof MODULO_LABELS] ?? modulo}</p>
              <p className="text-sm text-muted-foreground">{nota}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
