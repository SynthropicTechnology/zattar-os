
import { GENERO_LABELS } from './domain';

/**
 * Formata CPF (000.000.000-00)
 */
export function formatarCpf(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Normaliza CPF removendo formatação
 */
export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Formata telefone ((00) 00000-0000 ou (00) 0000-0000)
 */
export function formatarTelefone(telefone: string | null | undefined): string {
  if (!telefone) return '-';
  const telefoneLimpo = telefone.replace(/\D/g, '');
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
}

/**
 * Formata OAB com UF (OAB/UF)
 */
export function formatarOab(oab: string | null | undefined, ufOab: string | null | undefined): string {
  if (!oab) return '-';
  if (ufOab) {
    return `${oab}/${ufOab}`;
  }
  return oab;
}

/**
 * Formata nome de exibição (capitaliza primeira letra de cada palavra)
 */
export function formatarNomeExibicao(nome: string | null | undefined): string {
  if (!nome) return '-';
  return nome
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

/**
 * Formata data (DD/MM/YYYY)
 */
export function formatarData(data: string | null | undefined): string {
  if (!data) return '-';
  try {
    // Para strings ISO date-only, formatar direto sem Date (evita timezone shift)
    const isoMatch = data.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }

    // Fallback para formatos não-ISO
    const date = new Date(data);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
  } catch {
    return '-';
  }
}

/**
 * Formata endereço completo
 */
export function formatarEnderecoCompleto(endereco: {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
} | null | undefined): string {
  if (!endereco) return '-';
  
  const partes: string[] = [];
  
  if (endereco.logradouro) {
    const logradouro = endereco.numero
      ? `${endereco.logradouro}, ${endereco.numero}`
      : endereco.logradouro;
    partes.push(logradouro);
  }
  
  if (endereco.complemento) {
    partes.push(endereco.complemento);
  }
  
  if (endereco.bairro) {
    partes.push(endereco.bairro);
  }
  
  if (endereco.cidade || endereco.estado) {
    const cidadeEstado = [endereco.cidade, endereco.estado].filter(Boolean).join(' - ');
    if (cidadeEstado) partes.push(cidadeEstado);
  }
  
  if (endereco.cep) {
    const cepFormatado = endereco.cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    partes.push(`CEP: ${cepFormatado}`);
  }
  
  return partes.length > 0 ? partes.join(', ') : '-';
}

/**
 * Formata gênero para exibição
 */
export function formatarGenero(genero: string | null | undefined): string {
  if (!genero) return '-';
  return GENERO_LABELS[genero as keyof typeof GENERO_LABELS] || genero;
}

/**
 * Obtém URL pública do avatar do usuário
 * Assume que avatar_url já contém a URL completa
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  // Se já é uma URL completa, retornar diretamente
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  // Caso contrário, construir URL (bucket: "avatar")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/avatar/${avatarUrl}`;
}

/**
 * Obtém URL pública da capa/banner do usuário
 * Assume que cover_url já contém a URL completa
 */
export function getCoverUrl(coverUrl: string | null | undefined): string | null {
  if (!coverUrl) return null;
  // Se já é uma URL completa, retornar diretamente
  if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
    return coverUrl;
  }
  // Caso contrário, construir URL (retrocompatibilidade)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/covers/${coverUrl}`;
}

/**
 * Alias para formatarEnderecoCompleto
 */
export function formatarEndereco(endereco: {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
} | null | undefined): string {
  return formatarEnderecoCompleto(endereco);
}

/**
 * Formata data de cadastro para exibição amigável
 */
export function formatarDataCadastro(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const dataObj = new Date(date);
    if (isNaN(dataObj.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dataObj);
  } catch {
    return '-';
  }
}
