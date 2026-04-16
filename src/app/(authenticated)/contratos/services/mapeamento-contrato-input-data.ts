import type { ClienteBasico } from '@/shared/assinatura-digital/services/data.service';

export interface DadosContratoParaMapping {
  contrato: { id: number; segmento_id: number | null; cliente_id: number };
  cliente: {
    id: number;
    nome: string;
    tipo_pessoa?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
    rg?: string | null;
    nacionalidade?: string | null;
    estado_civil?: string | null;
    ddd_celular?: string | null;
    numero_celular?: string | null;
    emails?: string[] | null;
    endereco?: {
      logradouro?: string | null;
      numero?: string | null;
      bairro?: string | null;
      municipio?: string | null;
      estado_sigla?: string | null;
      cep?: string | null;
      complemento?: string | null;
    } | null;
  } | null;
  partes: Array<{
    papel_contratual: string;
    nome_snapshot: string | null;
    ordem: number;
  }>;
}

export interface InputDataMapeado {
  cliente: ClienteBasico;
  parteContrariaNome: string;
  ctxExtras: Record<string, string>;
}

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  separado: 'Separado(a) judicialmente',
  uniao_estavel: 'União estável',
};

function formatarCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCep(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatarCelular(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length === 9) return digits.replace(/(\d{5})(\d{4})/, '$1-$2');
  if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, '$1-$2');
  return num;
}

function concatenarPartesContrarias(
  partes: DadosContratoParaMapping['partes'],
): string {
  const nomes = partes
    .filter(p => p.papel_contratual === 'parte_contraria')
    .sort((a, b) => a.ordem - b.ordem)
    .map(p => (p.nome_snapshot ?? '').trim())
    .filter(n => n.length > 0);

  if (nomes.length === 0) return '';
  return new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' }).format(nomes);
}

export function contratoParaInputData(dados: DadosContratoParaMapping): InputDataMapeado {
  const { cliente } = dados;

  if (!cliente) {
    throw new Error('Contrato sem cliente vinculado');
  }

  if (cliente.tipo_pessoa && cliente.tipo_pessoa !== 'pf') {
    throw new Error(
      'Templates trabalhistas exigem cliente Pessoa Física. Altere o cadastro do cliente ou use outro tipo de contrato.',
    );
  }

  const clienteMapeado: ClienteBasico = {
    id: cliente.id,
    nome: (cliente.nome ?? '').trim(),
    tipo_pessoa: cliente.tipo_pessoa ?? null,
    cpf: cliente.cpf ? formatarCpf(cliente.cpf) : null,
    cnpj: null,
    rg: cliente.rg ?? null,
    emails: cliente.emails ?? null,
    ddd_celular: cliente.ddd_celular ?? null,
    numero_celular: cliente.numero_celular ? formatarCelular(cliente.numero_celular) : null,
    estado_civil: cliente.estado_civil
      ? ESTADO_CIVIL_LABELS[cliente.estado_civil] ?? cliente.estado_civil
      : null,
    nacionalidade: cliente.nacionalidade ?? null,
    endereco: cliente.endereco
      ? {
          logradouro: cliente.endereco.logradouro ?? null,
          numero: cliente.endereco.numero ?? null,
          bairro: cliente.endereco.bairro ?? null,
          municipio: cliente.endereco.municipio ?? null,
          estado_sigla: cliente.endereco.estado_sigla ?? null,
          cep: cliente.endereco.cep ? formatarCep(cliente.endereco.cep) : null,
          complemento: cliente.endereco.complemento ?? null,
        }
      : null,
  };

  const parteContrariaNome = concatenarPartesContrarias(dados.partes);
  const primeiroEmail = cliente.emails?.[0] ?? '';

  const ctxExtras: Record<string, string> = {
    'acao.nome_empresa_pessoa': parteContrariaNome,
    'cliente.email': primeiroEmail,
  };

  return { cliente: clienteMapeado, parteContrariaNome, ctxExtras };
}

import { LABELS_CAMPOS_CONTRATO } from './mapeamento-contrato-input-data.labels';

export interface TemplateComCampos {
  template_uuid: string;
  nome: string;
  campos: string; // JSON string, parsed internally
}

export interface CampoFaltante {
  chave: string;
  label: string;
  templates: string[];
}

const CHAVES_IGNORADAS = new Set([
  'assinatura.assinatura_base64',
  'sistema.data_geracao',
]);

interface CampoParsed {
  tipo: string;
  variavel?: string;
  obrigatorio?: boolean;
  conteudo_composto?: {
    json?: unknown;
  };
}

function extrairVariaveisDoTipTap(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== 'object') return;
  const n = node as Record<string, unknown>;
  if (n.type === 'variable' && n.attrs && typeof n.attrs === 'object') {
    const key = (n.attrs as Record<string, unknown>).key;
    if (typeof key === 'string') out.add(key);
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) extrairVariaveisDoTipTap(child, out);
  }
}

function extrairVariaveisDoCampo(campo: CampoParsed): string[] {
  const out = new Set<string>();
  if (campo.variavel) out.add(campo.variavel);
  if (campo.conteudo_composto?.json) {
    extrairVariaveisDoTipTap(campo.conteudo_composto.json, out);
  }
  return [...out];
}

function temValor(inputData: Record<string, unknown>, chave: string): boolean {
  const partes = chave.split('.');
  let valor: unknown = inputData;
  for (const p of partes) {
    if (valor && typeof valor === 'object' && p in (valor as object)) {
      valor = (valor as Record<string, unknown>)[p];
    } else {
      return false;
    }
  }
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string' && valor.trim() === '') return false;
  return true;
}

export function detectarCamposFaltantes(
  inputData: Record<string, unknown>,
  templates: TemplateComCampos[],
): CampoFaltante[] {
  const chaveParaTemplates = new Map<string, string[]>();

  for (const template of templates) {
    let parsed: CampoParsed[];
    try {
      parsed = JSON.parse(template.campos) as CampoParsed[];
    } catch {
      continue;
    }
    for (const campo of parsed) {
      if (!campo.obrigatorio) continue;
      for (const chave of extrairVariaveisDoCampo(campo)) {
        if (CHAVES_IGNORADAS.has(chave)) continue;
        const lista = chaveParaTemplates.get(chave) ?? [];
        lista.push(template.nome);
        chaveParaTemplates.set(chave, lista);
      }
    }
  }

  const faltantes: CampoFaltante[] = [];
  for (const [chave, templatesQueUsam] of chaveParaTemplates) {
    if (!temValor(inputData, chave)) {
      faltantes.push({
        chave,
        label: LABELS_CAMPOS_CONTRATO[chave] ?? chave,
        templates: templatesQueUsam,
      });
    }
  }

  return faltantes;
}
