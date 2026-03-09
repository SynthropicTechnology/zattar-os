/**
 * Utilitarios de formatacao para o modulo de partes
 * Inclui formatacao de CPF, CNPJ, telefone, endereco, etc.
 */

/**
 * Formata CPF para exibicao (XXX.XXX.XXX-XX)
 */
export const formatarCpf = (cpf: string | null | undefined): string => {
  if (!cpf) return '-';
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ para exibicao (XX.XXX.XXX/XXXX-XX)
 */
export const formatarCnpj = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '-';
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return cnpj;
  return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata telefone para exibicao
 * Aceita telefone completo ou DDD + numero separados
 */
export function formatarTelefone(telefone: string | null | undefined): string;
export function formatarTelefone(ddd: string | null | undefined, numero: string | null | undefined): string;
export function formatarTelefone(dddOrTelefone: string | null | undefined, numero?: string | null | undefined): string {
  // Se passado DDD e numero separados
  if (numero !== undefined) {
    if (!dddOrTelefone || !numero) return '-';
    const dddLimpo = dddOrTelefone.replace(/\D/g, '');
    const numeroLimpo = numero.replace(/\D/g, '');

    if (numeroLimpo.length === 9) {
      // Celular: (XX) XXXXX-XXXX
      return `(${dddLimpo}) ${numeroLimpo.replace(/(\d{5})(\d{4})/, '$1-$2')}`;
    } else if (numeroLimpo.length === 8) {
      // Fixo: (XX) XXXX-XXXX
      return `(${dddLimpo}) ${numeroLimpo.replace(/(\d{4})(\d{4})/, '$1-$2')}`;
    }

    return `(${dddLimpo}) ${numeroLimpo}`;
  }

  // Se passado telefone completo
  if (!dddOrTelefone) return '-';
  const telefoneLimpo = dddOrTelefone.replace(/\D/g, '');

  if (telefoneLimpo.length === 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (telefoneLimpo.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return dddOrTelefone;
}

/**
 * Formata CEP para exibicao (XXXXX-XXX)
 */
export const formatarCep = (cep: string | null | undefined): string => {
  if (!cep) return '-';
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return cep;
  return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formata endereco completo para exibicao
 */
export const formatarEnderecoCompleto = (endereco: {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
  cep?: string | null;
} | null | undefined): string => {
  if (!endereco) return '-';

  const toTitleCasePtBr = (input: string): string => {
    const raw = input.trim();
    if (!raw) return '';

    const LOWER_WORDS = new Set(['de', 'da', 'das', 'do', 'dos', 'e']);
    const KEEP_UPPER = new Set([
      'me',
      'epp',
      'ltda',
      'eireli',
      'sa',
      's/a',
      's.a',
      's.a.',
      'cep',
      'cpf',
      'cnpj',
      'rg',
      'uf',
    ]);
    const isRomanNumeral = (w: string) =>
      /^[ivxlcdm]+$/i.test(w) && w.length <= 6;

    const titleWord = (word: string, idx: number): string => {
      const cleaned = word.replace(/[.,;:()]/g, '');
      const lower = cleaned.toLowerCase();

      // Preposicoes devem ficar em minusculo (exceto se for a primeira palavra)
      if (idx > 0 && LOWER_WORDS.has(lower)) return lower;
      // Siglas conhecidas em maiusculo
      if (KEEP_UPPER.has(lower)) return cleaned.toUpperCase();
      // Numerais romanos em maiusculo
      if (isRomanNumeral(cleaned)) return cleaned.toUpperCase();
      // Siglas curtas (2 chars) ja em maiusculo, manter
      if (cleaned.length <= 2 && cleaned === cleaned.toUpperCase() && !LOWER_WORDS.has(lower)) return cleaned;

      const first = cleaned.charAt(0).toUpperCase();
      const rest = cleaned.slice(1).toLowerCase();
      return first + rest;
    };

    return raw
      .split(/\s+/)
      .map((token, idx) => {
        // preserve punctuation around token
        const leading = token.match(/^[^\p{L}\p{N}]*/u)?.[0] ?? '';
        const trailing = token.match(/[^\p{L}\p{N}]*$/u)?.[0] ?? '';
        const core = token.slice(leading.length, token.length - trailing.length);

        const coreParts = core
          .split('-')
          .map((part) => titleWord(part, idx))
          .join('-');

        return `${leading}${coreParts}${trailing}`;
      })
      .join(' ');
  };

  const partes: string[] = [];

  if (endereco.logradouro) {
    let logradouroCompleto = toTitleCasePtBr(endereco.logradouro);
    if (endereco.numero) {
      logradouroCompleto += `, ${endereco.numero}`;
    }
    if (endereco.complemento) {
      logradouroCompleto += ` - ${toTitleCasePtBr(endereco.complemento)}`;
    }
    partes.push(logradouroCompleto);
  }

  if (endereco.bairro) {
    partes.push(toTitleCasePtBr(endereco.bairro));
  }

  if (endereco.municipio && endereco.estado_sigla) {
    partes.push(`${toTitleCasePtBr(endereco.municipio)} - ${endereco.estado_sigla.toUpperCase()}`);
  } else if (endereco.municipio) {
    partes.push(toTitleCasePtBr(endereco.municipio));
  }

  if (endereco.cep) {
    partes.push(`CEP: ${formatarCep(endereco.cep)}`);
  }

  return partes.length > 0 ? partes.join(', ') : '-';
};

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
export const formatarData = (dataISO: string | null | undefined): string => {
  if (!dataISO) return '-';
  try {
    // Para strings ISO date-only, formatar diretamente sem criar Date (evita timezone shift)
    const isoMatch = dataISO.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }

    // Fallback para formatos não-ISO
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(data);
  } catch {
    return '-';
  }
};

/**
 * Formata nome completo ou razao social em MAIÚSCULAS
 */
export const formatarNome = (nome: string | null | undefined): string => {
  if (!nome) return '-';
  const raw = nome.trim();
  if (!raw) return '-';
  return raw.toUpperCase();
};

/**
 * Formata tipo de pessoa para exibicao
 */
export const formatarTipoPessoa = (tipoPessoa: 'pf' | 'pj'): string => {
  return tipoPessoa === 'pf' ? 'Pessoa Fisica' : 'Pessoa Juridica';
};

/**
 * Calcula a idade a partir da data de nascimento
 */
export function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  try {
    // Extrair componentes sem criar Date objects (evita timezone shift)
    const match = dataNascimento.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;

    const anoNasc = +match[1];
    const mesNasc = +match[2];
    const diaNasc = +match[3];

    const hoje = new Date();
    const anoHoje = hoje.getFullYear();
    const mesHoje = hoje.getMonth() + 1;
    const diaHoje = hoje.getDate();

    let idade = anoHoje - anoNasc;
    if (mesHoje < mesNasc || (mesHoje === mesNasc && diaHoje < diaNasc)) {
      idade--;
    }
    return idade;
  } catch {
    return null;
  }
}
