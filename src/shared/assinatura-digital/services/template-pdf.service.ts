// pdf-lib é importado dinamicamente para evitar erro "Class extends value undefined"
// em routes de API durante o build do Next.js com Turbopack.
// NÃO usar import type de pdf-lib pois mesmo isso pode causar avaliação do módulo no Turbopack.
import { decodeDataUrlToBuffer } from "./base64";
import type { TemplateCampoPdf, TipoVariavel, EstiloCampo } from "../types";
import type {
  ClienteBasico,
  FormularioBasico,
  SegmentoBasico,
  TemplateBasico,
} from "./data.service";
import { logger, createTimer, LogServices } from "./logger";

// Helper para carregar pdf-lib dinamicamente
async function loadPdfLib(): Promise<{
  PDFDocument: typeof import("pdf-lib").PDFDocument;
  rgb: typeof import("pdf-lib").rgb;
  StandardFonts: typeof import("pdf-lib").StandardFonts;
}> {
  const pdfLib = await import("pdf-lib");
  return {
    PDFDocument: pdfLib.PDFDocument,
    rgb: pdfLib.rgb,
    StandardFonts: pdfLib.StandardFonts,
  };
}

// ---------------------------------------------------------------------------
// Rich text rendering – TipTap JSON → PDF segments
// ---------------------------------------------------------------------------

/** Um pedaço atômico de texto com formatação inline */
interface RichSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

/** Uma linha visual (após word-wrap) com seus segmentos */
interface RichLine {
  segments: RichSegment[];
  align: "left" | "center" | "right" | "justify";
}

/** Conjunto de 4 variantes de fonte para rich text */
interface FontSet {
  regular: import("pdf-lib").PDFFont;
  bold: import("pdf-lib").PDFFont;
  italic: import("pdf-lib").PDFFont;
  boldItalic: import("pdf-lib").PDFFont;
}

function pickFont(fonts: FontSet, seg: RichSegment): import("pdf-lib").PDFFont {
  if (seg.bold && seg.italic) return fonts.boldItalic;
  if (seg.bold) return fonts.bold;
  if (seg.italic) return fonts.italic;
  return fonts.regular;
}

function segmentWidth(fonts: FontSet, seg: RichSegment, size: number): number {
  return pickFont(fonts, seg).widthOfTextAtSize(seg.text, size);
}

/**
 * Percorre a árvore JSON do TipTap e produz parágrafos com segmentos ricos.
 * Cada parágrafo carrega o alinhamento definido no editor.
 * As variáveis {{key}} são resolvidas inline.
 */
function tiptapJsonToRichParagraphs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: Record<string, any>,
  resolver: (variable: string) => string
): { segments: RichSegment[]; align: "left" | "center" | "right" | "justify" }[] {
  const paragraphs: { segments: RichSegment[]; align: "left" | "center" | "right" | "justify" }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walkBlock(node: Record<string, any>) {
    if (node.type === "doc" && Array.isArray(node.content)) {
      for (const child of node.content) walkBlock(child);
      return;
    }

    // Blocos que contêm inline content (paragraph, heading, listItem, blockquote child)
    if (
      node.type === "paragraph" ||
      node.type === "heading"
    ) {
      const align = (node.attrs?.textAlign as "left" | "center" | "right" | "justify") || "left";
      const segments: RichSegment[] = [];

      if (Array.isArray(node.content)) {
        for (const inline of node.content) {
          walkInline(inline, segments, resolver);
        }
      }

      paragraphs.push({ segments, align });
      return;
    }

    // Blocos container (bulletList, orderedList, blockquote, listItem)
    if (Array.isArray(node.content)) {
      for (const child of node.content) walkBlock(child);
    }
  }

  function walkInline(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node: Record<string, any>,
    segments: RichSegment[],
    resolver: (variable: string) => string
  ) {
    if (node.type === "text") {
      const marks: { type: string }[] = node.marks || [];
      const bold = marks.some((m) => m.type === "bold");
      const italic = marks.some((m) => m.type === "italic");
      segments.push({ text: node.text || "", bold, italic });
      return;
    }

    if (node.type === "variable" && node.attrs?.key) {
      const resolved = resolver(node.attrs.key);
      // Herda formatação do contexto? Variáveis herdam marks do nó TipTap se existirem
      const marks: { type: string }[] = node.marks || [];
      const bold = marks.some((m) => m.type === "bold");
      const italic = marks.some((m) => m.type === "italic");
      segments.push({ text: resolved, bold, italic });
      return;
    }

    if (node.type === "hardBreak") {
      segments.push({ text: "\n", bold: false, italic: false });
      return;
    }

    // Outros inlines com conteúdo
    if (Array.isArray(node.content)) {
      for (const child of node.content) walkInline(child, segments, resolver);
    }
  }

  walkBlock(json);
  return paragraphs;
}

/**
 * Quebra uma lista de RichSegments em linhas visuais respeitando maxWidth.
 * Cada "palavra" mantém a formatação do segmento de origem.
 */
function wrapRichSegments(
  segments: RichSegment[],
  fonts: FontSet,
  fontSize: number,
  maxWidth: number,
  align: "left" | "center" | "right" | "justify"
): RichLine[] {
  // Tokenizar: cada token é um segmento com uma única palavra
  interface Token { text: string; bold: boolean; italic: boolean; isSpace: boolean }
  const tokens: Token[] = [];

  for (const seg of segments) {
    if (seg.text === "\n") {
      // Hard break: forçar nova linha
      tokens.push({ text: "\n", bold: seg.bold, italic: seg.italic, isSpace: false });
      continue;
    }
    // Dividir em palavras preservando espaços
    const parts = seg.text.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      const isSpace = /^\s+$/.test(part);
      tokens.push({ text: part, bold: seg.bold, italic: seg.italic, isSpace });
    }
  }

  const lines: RichLine[] = [];
  let currentLineSegments: RichSegment[] = [];
  let currentLineWidth = 0;

  function flushLine() {
    // Remover espaço trailing
    while (
      currentLineSegments.length > 0 &&
      /^\s+$/.test(currentLineSegments[currentLineSegments.length - 1].text)
    ) {
      currentLineSegments.pop();
    }
    if (currentLineSegments.length > 0) {
      lines.push({ segments: [...currentLineSegments], align });
    }
    currentLineSegments = [];
    currentLineWidth = 0;
  }

  for (const token of tokens) {
    if (token.text === "\n") {
      flushLine();
      continue;
    }

    const seg: RichSegment = { text: token.text, bold: token.bold, italic: token.italic };
    const w = segmentWidth(fonts, seg, fontSize);

    if (token.isSpace) {
      // Espaço sempre cabe na linha atual (será cortado no flush se trailing)
      currentLineSegments.push(seg);
      currentLineWidth += w;
      continue;
    }

    // Palavra: verifica se cabe
    if (currentLineWidth + w <= maxWidth || currentLineSegments.length === 0) {
      currentLineSegments.push(seg);
      currentLineWidth += w;
    } else {
      flushLine();
      currentLineSegments.push(seg);
      currentLineWidth = w;
    }
  }

  flushLine();
  return lines;
}

/**
 * Renderiza linhas ricas no PDF com suporte a alinhamento e formatação inline.
 */
function drawRichLines(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  fonts: FontSet,
  lines: RichLine[],
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color: any
) {
  let currentY = y;
  const lineHeight = fontSize + 2;

  for (const line of lines) {
    // Calcular largura total da linha
    let totalWidth = 0;
    for (const seg of line.segments) {
      totalWidth += segmentWidth(fonts, seg, fontSize);
    }

    // Determinar offset X baseado no alinhamento
    let startX = x;
    if (line.align === "center") {
      startX = x + (maxWidth - totalWidth) / 2;
    } else if (line.align === "right") {
      startX = x + maxWidth - totalWidth;
    }

    if (line.align === "justify" && line !== lines[lines.length - 1]) {
      // Justify: distribuir espaço extra entre palavras
      drawJustifiedLine(page, fonts, line.segments, x, currentY, maxWidth, fontSize, color);
    } else {
      // Normal draw (left/center/right ou última linha do justify)
      let curX = startX;
      for (const seg of line.segments) {
        if (!seg.text) continue;
        const font = pickFont(fonts, seg);
        page.drawText(seg.text, { x: curX, y: currentY, size: fontSize, font, color });
        curX += font.widthOfTextAtSize(seg.text, fontSize);
      }
    }

    currentY -= lineHeight;
  }
}

/**
 * Desenha uma linha justificada distribuindo espaço extra entre os espaços.
 */
function drawJustifiedLine(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  fonts: FontSet,
  segments: RichSegment[],
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color: any
) {
  // Separar em "words" e "spaces"
  let totalTextWidth = 0;
  let spaceCount = 0;

  for (const seg of segments) {
    const w = segmentWidth(fonts, seg, fontSize);
    if (/^\s+$/.test(seg.text)) {
      spaceCount++;
    } else {
      totalTextWidth += w;
    }
  }

  const extraSpace = spaceCount > 0 ? (maxWidth - totalTextWidth) / spaceCount : 0;

  let curX = x;
  for (const seg of segments) {
    if (/^\s+$/.test(seg.text)) {
      curX += extraSpace;
      continue;
    }
    if (!seg.text) continue;
    const font = pickFont(fonts, seg);
    page.drawText(seg.text, { x: curX, y, size: fontSize, font, color });
    curX += font.widthOfTextAtSize(seg.text, fontSize);
  }
}

/**
 * Renderiza texto composto rico no PDF a partir do JSON do TipTap.
 * Suporta bold, italic, alinhamento (left/center/right/justify) por parágrafo.
 */
function embedRichText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  fonts: FontSet,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: Record<string, any>,
  resolver: (variable: string) => string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color: any
) {
  const paragraphs = tiptapJsonToRichParagraphs(json, resolver);
  const lineHeight = fontSize + 2;
  let currentY = y;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (para.segments.length === 0) {
      // Parágrafo vazio = quebra de linha
      currentY -= lineHeight;
      continue;
    }

    const lines = wrapRichSegments(para.segments, fonts, fontSize, maxWidth, para.align);
    drawRichLines(page, fonts, lines, x, currentY, maxWidth, fontSize, color);
    currentY -= lines.length * lineHeight;
  }
}

interface PdfDataContext {
  cliente: ClienteBasico;
  segmento: SegmentoBasico;
  formulario: FormularioBasico;
  protocolo: string;
  ip?: string | null;
  user_agent?: string | null;
  parte_contraria?: {
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
    telefone?: string | null;
  };
}

interface TemplateWithCampos extends TemplateBasico {
  campos_parsed: TemplateCampoPdf[];
}

/**
 * Dados estruturados para geração da página de manifesto de assinatura eletrônica.
 * Contém todas as evidências necessárias para conformidade com MP 2.200-2/2001.
 */
export interface ManifestData {
  // Identificação do documento
  protocolo: string;
  nomeArquivo: string;
  hashOriginalSha256: string;
  hashFinalSha256?: string; // Opcional pois é calculado após flatten

  // Dados do signatário
  signatario: {
    nomeCompleto: string;
    cpf: string;
    dataHora: string; // ISO 8601
    dataHoraLocal: string; // Formatado pt-BR
    ipOrigem: string | null;
    geolocalizacao?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    } | null;
  };

  // Evidências biométricas (data URLs)
  evidencias: {
    fotoBase64?: string; // Selfie (obrigatória quando formulario.foto_necessaria=true)
    assinaturaBase64: string; // Rubrica
  };

  // Conformidade legal
  termos: {
    versao: string;
    dataAceite: string; // ISO 8601
    textoDeclaracao: string;
  };

  // Device fingerprint (opcional para exibição resumida)
  dispositivo?: {
    plataforma?: string;
    navegador?: string;
    resolucao?: string;
  };
}

const CANVAS = { width: 540, height: 765 };

function convertX(x: number, pageWidth: number) {
  return (x / CANVAS.width) * pageWidth;
}

function convertWidth(width: number, pageWidth: number) {
  return (width / CANVAS.width) * pageWidth;
}

function convertHeight(height: number, pageHeight: number) {
  return (height / CANVAS.height) * pageHeight;
}

function convertY(y: number, height: number, pageHeight: number) {
  const scaledHeight = convertHeight(height, pageHeight);
  const scaledY = (y / CANVAS.height) * pageHeight;
  return pageHeight - scaledY - scaledHeight;
}

function parseCampos(template: TemplateBasico): TemplateWithCampos {
  let campos_parsed: TemplateCampoPdf[] = [];
  try {
    campos_parsed = JSON.parse(template.campos || "[]");
  } catch {
    campos_parsed = [];
  }
  return { ...template, campos_parsed };
}

// Mapeamento reverso de enums do DB para labels legíveis
const ESTADO_CIVIL_LABEL: Record<string, string> = {
  solteiro: "solteiro(a)",
  casado: "casado(a)",
  divorciado: "divorciado(a)",
  viuvo: "viúvo(a)",
};

const GENERO_LABEL: Record<string, string> = {
  masculino: "masculino",
  feminino: "feminino",
  outro: "outro",
  prefiro_nao_informar: "prefiro não informar",
};

function formatPhone(ddd?: string | null, numero?: string | null): string {
  if (!ddd || !numero) return "";
  return `(${ddd}) ${formatNumeroTelefone(numero)}`;
}

function formatFullPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `(${digits.slice(0, 2)}) ${formatNumeroTelefone(digits.slice(2))}`;
  }
  return phone;
}

/** Formata número de telefone com hífen: 99269-2951 ou 3269-2951 */
function formatNumeroTelefone(numero: string): string {
  const digits = numero.replace(/\D/g, "");
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return numero;
}

/** Formata DDD com parênteses: (31) */
function formatDDD(ddd?: string | null): string {
  if (!ddd) return "";
  return `(${ddd})`;
}

/** Formata CPF: 115.368.166-80 */
function formatCPF(cpf?: string | null): string {
  if (!cpf) return "";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}

/** Formata CEP: 30140-110 */
function formatCEP(cep?: string | null): string {
  if (!cep) return "";
  const digits = cep.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return cep;
}

/** Formata RG: mg16701636 → MG-16.701.636 */
function formatRG(rg?: string | null): string {
  if (!rg) return "";
  // Separar prefixo de letras (UF) dos dígitos
  const match = rg.match(/^([a-zA-Z]*)(\d+)$/);
  if (!match) return rg;
  const prefix = match[1].toUpperCase();
  const digits = match[2];
  // Adicionar pontos a cada 3 dígitos da direita
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return prefix ? `${prefix}-${formatted}` : formatted;
}

function formatDataNascimentoBR(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDataExtenso(date: Date): string {
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const ano = date.getFullYear();
  return `${dia} de ${mes} de ${ano}`;
}

function resolveVariable(
  variable: TipoVariavel | undefined,
  ctx: PdfDataContext,
  extras: Record<string, unknown>
) {
  if (!variable) return "";

  const c = ctx.cliente;
  const end = c.endereco;
  const clienteDados = extras.cliente_dados as Record<string, unknown> | undefined;
  const email = Array.isArray(c.emails) && c.emails.length > 0 ? c.emails[0] : "";
  const celular = formatPhone(c.ddd_celular, c.numero_celular)
    || formatFullPhone(clienteDados?.celular as string);
  const telefone = formatPhone(c.ddd_residencial, c.numero_residencial)
    || formatFullPhone(clienteDados?.telefone as string);
  const estadoCivil = c.estado_civil ? (ESTADO_CIVIL_LABEL[c.estado_civil] ?? c.estado_civil) : "";
  const genero = c.genero ? (GENERO_LABEL[c.genero] ?? c.genero) : "";

  const cpfFormatado = formatCPF(c.cpf);
  const rgFormatado = formatRG(c.rg);
  const cepFormatado = formatCEP(end?.cep);

  const map: Record<string, unknown> = {
    // Cliente - identificação
    "cliente.nome_completo": c.nome,
    "cliente.nome": c.nome,
    "cliente.cpf": cpfFormatado,
    "cliente.cnpj": c.cnpj,
    "cliente.tipo_pessoa": c.tipo_pessoa,
    "cliente.rg": rgFormatado,

    // Cliente - dados pessoais
    "cliente.data_nascimento": formatDataNascimentoBR(c.data_nascimento),
    "cliente.estado_civil": estadoCivil,
    "cliente.genero": genero,
    "cliente.nacionalidade": c.nacionalidade,

    // Cliente - contato
    "cliente.email": email,
    "cliente.celular": celular,
    "cliente.telefone": telefone || celular,
    "cliente.ddd_celular": formatDDD(c.ddd_celular),
    "cliente.numero_celular": formatNumeroTelefone(c.numero_celular || ""),
    "cliente.ddd_residencial": formatDDD(c.ddd_residencial),
    "cliente.numero_residencial": formatNumeroTelefone(c.numero_residencial || ""),

    // Cliente - endereço (com prefixo endereco_)
    "cliente.endereco_logradouro": end?.logradouro,
    "cliente.endereco_numero": end?.numero,
    "cliente.endereco_complemento": end?.complemento,
    "cliente.endereco_bairro": end?.bairro,
    "cliente.endereco_cep": cepFormatado,
    "cliente.endereco_cidade": end?.municipio,
    "cliente.endereco_uf": end?.estado_sigla,

    // Cliente - endereço (aliases sem prefixo)
    "cliente.logradouro": end?.logradouro,
    "cliente.numero": end?.numero,
    "cliente.complemento": end?.complemento,
    "cliente.bairro": end?.bairro,
    "cliente.cep": cepFormatado,
    "cliente.cidade": end?.municipio,
    "cliente.municipio": end?.municipio,
    "cliente.uf": end?.estado_sigla,
    "cliente.estado": end?.estado_sigla,

    // Parte contrária
    "parte_contraria.nome": ctx.parte_contraria?.nome,
    "parte_contraria.cpf": formatCPF(ctx.parte_contraria?.cpf),
    "parte_contraria.cnpj": ctx.parte_contraria?.cnpj,
    "parte_contraria.telefone": ctx.parte_contraria?.telefone,

    // Ação (aliases para campos do formulário dinâmico)
    "acao.nome_empresa_pessoa": ctx.parte_contraria?.nome,

    // Segmento
    "segmento.id": ctx.segmento.id,
    "segmento.nome": ctx.segmento.nome,
    "segmento.slug": ctx.segmento.slug,
    "segmento.descricao": (
      ctx.segmento as SegmentoBasico & { descricao?: string }
    ).descricao,

    // Sistema
    "sistema.protocolo": ctx.protocolo,
    "sistema.data_geracao": formatDataExtenso(new Date()),
    "sistema.ip_cliente": ctx.ip,
    "sistema.user_agent": ctx.user_agent,

    // Formulário
    "formulario.nome": ctx.formulario.nome,
    "formulario.slug": ctx.formulario.slug,
    "formulario.id": ctx.formulario.id,

    // Aliases sem prefixo (para templates que usam {{celular}} ao invés de {{cliente.celular}})
    "nome_completo": c.nome,
    "nome": c.nome,
    "cpf": cpfFormatado,
    "cnpj": c.cnpj,
    "rg": rgFormatado,
    "email": email,
    "celular": celular,
    "telefone": telefone || celular,
    "ddd_celular": formatDDD(c.ddd_celular),
    "numero_celular": formatNumeroTelefone(c.numero_celular || ""),
    "ddd_residencial": formatDDD(c.ddd_residencial),
    "numero_residencial": formatNumeroTelefone(c.numero_residencial || ""),
    "data_nascimento": formatDataNascimentoBR(c.data_nascimento),
    "estado_civil": estadoCivil,
    "genero": genero,
    "nacionalidade": c.nacionalidade,
    "logradouro": end?.logradouro,
    "numero": end?.numero,
    "complemento": end?.complemento,
    "bairro": end?.bairro,
    "cep": end?.cep,
    "cidade": end?.municipio,
    "municipio": end?.municipio,
    "uf": end?.estado_sigla,
    "estado": end?.estado_sigla,
  };

  // Tentar resolver do contexto primeiro, depois de extras
  let value = map[variable];

  if (value === undefined || value === null) {
    value = extras[variable];

    // Fallback: buscar em extras.cliente_dados
    if (value === undefined && variable.startsWith("cliente.")) {
      const clienteKey = variable.replace("cliente.", "");
      const clienteDados = extras.cliente_dados as
        | Record<string, unknown>
        | undefined;
      if (clienteDados && clienteKey in clienteDados) {
        value = clienteDados[clienteKey];
      }
    }
  }

  return value === undefined || value === null ? "" : String(value);
}

function formatValue(tipo: string, raw: string) {
  const val = raw ?? "";
  switch (tipo) {
    case "cpf": {
      const digits = val.replace(/\D/g, "");
      if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }
      return val;
    }
    case "cnpj": {
      const digits = val.replace(/\D/g, "");
      if (digits.length === 14) {
        return digits.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5"
        );
      }
      return val;
    }
    case "data": {
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d.toLocaleDateString("pt-BR");
    }
    default:
      return val;
  }
}

async function loadTemplatePdf(url: string): Promise<Uint8Array> {
  let fetchUrl = url;

  // Se a URL é do Backblaze (bucket privado), gerar presigned URL
  const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET;
  if (bucket && url.includes(`/${bucket}/`)) {
    const { generatePresignedUrl } = await import('@/lib/storage/backblaze-b2.service');
    const fileKey = url.split(`/${bucket}/`)[1];
    fetchUrl = await generatePresignedUrl(fileKey, 3600);
  }

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(
      `Falha ao baixar template PDF: ${res.status} ${res.statusText}`
    );
  }
  const arr = new Uint8Array(await res.arrayBuffer());
  return arr;
}

function buildStyle(
  style: EstiloCampo | undefined,
  pdfLib: {
    rgb: typeof import("pdf-lib").rgb;
    StandardFonts: typeof import("pdf-lib").StandardFonts;
  }
) {
  return {
    fontName: style?.fonte || pdfLib.StandardFonts.Helvetica,
    fontSize: style?.tamanho_fonte || 12,
    color: style?.cor ? hexToRgb(style.cor, pdfLib.rgb) : pdfLib.rgb(0, 0, 0),
    align: style?.alinhamento || "left",
    bold: style?.negrito || false,
    italic: style?.italico || false,
  };
}

function hexToRgb(hex: string, rgb: typeof import("pdf-lib").rgb) {
  const sanitized = hex.replace("#", "");
  const num = parseInt(sanitized, 16);
  if (Number.isNaN(num)) return rgb(0, 0, 0);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return rgb(r / 255, g / 255, b / 255);
}

async function embedText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number
) {
  const chunks = wrapText(font, text, size, maxWidth);
  let currentY = y;
  chunks.forEach((line) => {
    page.drawText(line, { x, y: currentY, size, font });
    currentY -= size + 2;
  });
}

function wrapText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  text: string,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const tentative = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(tentative, fontSize);
    if (width <= maxWidth || !current) {
      current = tentative;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function renderRich(template: string, resolver: (variable: string) => string) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, v) => resolver(v));
}

export async function generatePdfFromTemplate(
  template: TemplateBasico,
  ctx: PdfDataContext,
  extras: Record<string, unknown>,
  images?: { assinaturaBase64?: string; fotoBase64?: string }
): Promise<Buffer> {
  const pdfLib = await loadPdfLib();
  const tpl = parseCampos(template);
  const pdfUrl = template.pdf_url || template.arquivo_original;
  const pdfBytes = await loadTemplatePdf(pdfUrl);
  const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes);

  const helvetica = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(
    pdfLib.StandardFonts.HelveticaBold
  );
  const helveticaOblique = await pdfDoc.embedFont(
    pdfLib.StandardFonts.HelveticaOblique
  );
  const helveticaBoldOblique = await pdfDoc.embedFont(
    pdfLib.StandardFonts.HelveticaBoldOblique
  );

  const fonts: FontSet = {
    regular: helvetica,
    bold: helveticaBold,
    italic: helveticaOblique,
    boldItalic: helveticaBoldOblique,
  };

  for (const campo of tpl.campos_parsed) {
    const pageIndex = Math.max((campo.posicao?.pagina ?? 1) - 1, 0);
    const page = pdfDoc.getPage(pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pos = campo.posicao;
    if (!pos) continue;

    const x = convertX(pos.x, pageWidth);
    const y = convertY(pos.y, pos.height, pageHeight);
    const w = convertWidth(pos.width, pageWidth);
    const h = convertHeight(pos.height, pageHeight);

    const style = buildStyle(campo.estilo, pdfLib);
    const font = style.bold ? helveticaBold : helvetica;

    if (campo.tipo === "assinatura" && images?.assinaturaBase64) {
      const { buffer, contentType } = decodeDataUrlToBuffer(
        images.assinaturaBase64
      );
      const image = contentType.includes("png")
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);
      page.drawImage(image, { x, y, width: w, height: h });
      continue;
    }

    if (campo.tipo === "foto" && images?.fotoBase64) {
      const { buffer, contentType } = decodeDataUrlToBuffer(images.fotoBase64);
      const image = contentType.includes("png")
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);
      page.drawImage(image, { x, y, width: w, height: h });
      continue;
    }

    const resolve = (v: string) =>
      resolveVariable(v as TipoVariavel, ctx, extras);

    // Se o campo é texto_composto e tem JSON do TipTap, usar renderização rica
    if (
      campo.tipo === "texto_composto" &&
      campo.conteudo_composto?.json &&
      typeof campo.conteudo_composto.json === "object"
    ) {
      embedRichText(
        page,
        fonts,
        campo.conteudo_composto.json,
        resolve,
        x,
        y + h - style.fontSize,
        w,
        style.fontSize,
        style.color
      );
      continue;
    }

    // Fallback: texto plano (campos simples ou texto_composto sem JSON)
    let value = "";
    if (campo.tipo === "texto_composto" && campo.conteudo_composto?.template) {
      value = renderRich(campo.conteudo_composto.template, resolve);
    } else {
      value = resolveVariable(campo.variavel, ctx, extras);
    }
    if (!value && campo.valor_padrao) value = campo.valor_padrao;
    value = formatValue(campo.tipo, value);

    await embedText(
      page,
      font,
      value,
      x,
      y + h - style.fontSize,
      w,
      style.fontSize
    );
  }

  const result = await pdfDoc.save();
  return Buffer.from(result);
}

// =============================================================================
// MANIFESTO DE ASSINATURA ELETRÔNICA - MP 2.200-2/2001
// =============================================================================

/**
 * Constantes para página de manifesto
 */
export const MANIFEST_PAGE_SIZE = {
  width: 595.28, // A4 width in points
  height: 841.89, // A4 height in points
} as const;

export const MANIFEST_LEGAL_TEXT =
  "O signatário reconhece a autenticidade deste documento e a validade da " +
  "assinatura eletrônica utilizada, conforme Art. 10, § 2º, da Medida Provisória " +
  "nº 2.200-2/2001. Declara que os dados biométricos coletados (foto e assinatura) " +
  "são prova de sua autoria e que o hash SHA-256 garante a integridade deste ato.";

/**
 * Formata data ISO para formato brasileiro (dd/mm/yyyy HH:mm:ss)
 * @param isoDate - Data em formato ISO 8601
 * @returns Data formatada em pt-BR ou o valor original se a data for inválida
 */
function formatDateTimeBrazil(isoDate: string): string {
  if (!isoDate) {
    return "Data não informada";
  }

  const date = new Date(isoDate);

  // Validar se a data é válida antes de formatar
  if (isNaN(date.getTime())) {
    return isoDate; // Retorna o valor original se inválido
  }

  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Embeda imagem no PDF a partir de data URL, detectando tipo automaticamente.
 *
 * IMPORTANTE: Apenas formatos PNG e JPEG são suportados pelo pdf-lib.
 * Enviar outros contentTypes (como WebP, GIF, BMP) causará erro.
 * O consumidor deve garantir que as imagens estejam em formato compatível
 * antes de chamar esta função.
 *
 * @param pdfDoc - Documento PDF onde a imagem será embedada
 * @param dataUrl - Data URL da imagem (formato: data:image/png;base64,...)
 * @param label - Rótulo opcional para identificar a imagem em mensagens de erro (ex: "foto", "assinatura")
 * @returns Imagem embedada no PDF
 * @throws {Error} Se o tipo de imagem não for PNG ou JPEG
 */
async function embedImageFromDataUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any,
  dataUrl: string,
  label?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { buffer, contentType } = decodeDataUrlToBuffer(dataUrl);
  const imageLabel = label ? ` (${label})` : "";

  if (contentType.includes("png")) {
    return await pdfDoc.embedPng(buffer);
  } else if (contentType.includes("jpg") || contentType.includes("jpeg")) {
    return await pdfDoc.embedJpg(buffer);
  } else {
    throw new Error(
      `Tipo de imagem não suportado${imageLabel}: ${contentType}. ` +
        `Apenas PNG e JPEG são aceitos.`
    );
  }
}

/**
 * Adiciona página de manifesto de assinatura eletrônica ao PDF.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Esta função implementa a página de evidências exigida para Assinatura Eletrônica
 * Avançada, incluindo:
 * - Identificação do documento (protocolo, hashes SHA-256)
 * - Dados do signatário (nome, CPF, data/hora, IP, geolocalização)
 * - Evidências biométricas (foto selfie e assinatura manuscrita EMBEDADAS)
 * - Declaração jurídica com aceite de termos
 *
 * As imagens são embedadas diretamente no PDF (não referenciadas) para garantir
 * integridade forense. Qualquer modificação no PDF após flatten alterará o hash
 * final, tornando adulteração detectável.
 *
 * @param pdfDoc - Documento PDF já carregado (será modificado in-place)
 * @param manifestData - Dados estruturados do manifesto
 * @returns PDFDocument modificado com página de manifesto anexada
 * @throws {Error} Se houver falha ao embedar imagens ou desenhar conteúdo
 *
 * @example
 * const pdfDoc = await PDFDocument.load(pdfBytes);
 * await appendManifestPage(pdfDoc, {
 *   protocolo: 'FS-20250101120000-12345',
 *   nomeArquivo: 'contrato.pdf',
 *   hashOriginalSha256: 'a3c5f1e2...',
 *   signatario: { ... },
 *   evidencias: { fotoBase64: '...', assinaturaBase64: '...' },
 *   termos: { ... }
 * });
 * const finalPdfBytes = await pdfDoc.save();
 *
 * AUDITORIA E PERÍCIA TÉCNICA
 *
 * O manifesto serve como "página de rosto" forense do documento assinado.
 * Em auditorias ou perícias judiciais, o perito pode:
 * 1. Extrair o manifesto do PDF (última página)
 * 2. Verificar que todos os campos obrigatórios estão presentes
 * 3. Recalcular o hash_final_sha256 do PDF completo
 * 4. Comparar com o hash exibido no manifesto
 * 5. Validar que foto e assinatura estão embedadas (não apenas referenciadas)
 *
 * Qualquer divergência indica adulteração pós-assinatura.
 */
export async function appendManifestPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any,
  manifestData: ManifestData
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const pdfLib = await loadPdfLib();
  const timer = createTimer();
  const context = { service: LogServices.PDF, operation: "append_manifest" };

  logger.info("Adicionando página de manifesto ao PDF", context, {
    protocolo: manifestData.protocolo,
    arquivo: manifestData.nomeArquivo,
  });

  try {
    // Validar dados obrigatórios
    if (!manifestData.protocolo || !manifestData.hashOriginalSha256) {
      throw new Error(
        "Protocolo e hash original são obrigatórios para manifesto"
      );
    }

    if (!manifestData.evidencias.assinaturaBase64) {
      throw new Error("Assinatura é obrigatória para manifesto");
    }

    if (!manifestData.signatario.nomeCompleto || !manifestData.signatario.cpf) {
      throw new Error("Nome completo e CPF do signatário são obrigatórios");
    }

    // Criar nova página A4
    const page = pdfDoc.addPage([
      MANIFEST_PAGE_SIZE.width,
      MANIFEST_PAGE_SIZE.height,
    ]);
    const { width, height } = page.getSize();

    // Embedar fontes
    const fontRegular = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);

    // Embedar imagens (com labels para mensagens de erro contextualizadas)
    const fotoImage = manifestData.evidencias.fotoBase64
      ? await embedImageFromDataUrl(
          pdfDoc,
          manifestData.evidencias.fotoBase64,
          "foto"
        )
      : null;
    const assinaturaImage = await embedImageFromDataUrl(
      pdfDoc,
      manifestData.evidencias.assinaturaBase64,
      "assinatura"
    );

    // Constantes de layout
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = width - marginLeft - marginRight;
    const lineColor = pdfLib.rgb(0.7, 0.7, 0.7);
    const textColor = pdfLib.rgb(0, 0, 0);
    const linkColor = pdfLib.rgb(0, 0, 0.8);

    let currentY = height - 50; // Começar do topo com margem

    // ==========================================================================
    // CABEÇALHO
    // ==========================================================================
    page.drawText("MANIFESTO DE ASSINATURA ELETRÔNICA", {
      x: marginLeft,
      y: currentY,
      size: 16,
      font: fontBold,
      color: textColor,
    });
    currentY -= 20;

    page.drawText("Conformidade MP 2.200-2/2001", {
      x: marginLeft,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: pdfLib.rgb(0.4, 0.4, 0.4),
    });
    currentY -= 35;

    // ==========================================================================
    // IDENTIFICAÇÃO DO DOCUMENTO
    // ==========================================================================
    page.drawText("IDENTIFICAÇÃO DO DOCUMENTO", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 15;

    const docFields = [
      `Nome do Arquivo: ${manifestData.nomeArquivo}`,
      `Protocolo: ${manifestData.protocolo}`,
    ];

    for (const field of docFields) {
      page.drawText(field, {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 15;
    }

    // Hash original (pode ser longo, quebrar se necessário)
    page.drawText("Hash SHA-256 Original:", {
      x: marginLeft,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: textColor,
    });
    currentY -= 12;

    const hashOriginal = manifestData.hashOriginalSha256;
    const hashChunks = hashOriginal.match(/.{1,64}/g) || [hashOriginal];
    for (const chunk of hashChunks) {
      page.drawText(chunk, {
        x: marginLeft + 10,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: pdfLib.rgb(0.3, 0.3, 0.3),
      });
      currentY -= 10;
    }
    currentY -= 5;

    // Hash final (se disponível)
    page.drawText("Hash SHA-256 Final:", {
      x: marginLeft,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: textColor,
    });
    currentY -= 12;

    const hashFinal = manifestData.hashFinalSha256 || "Calculado após flatten";
    if (manifestData.hashFinalSha256) {
      const finalChunks = hashFinal.match(/.{1,64}/g) || [hashFinal];
      for (const chunk of finalChunks) {
        page.drawText(chunk, {
          x: marginLeft + 10,
          y: currentY,
          size: 8,
          font: fontRegular,
          color: pdfLib.rgb(0.3, 0.3, 0.3),
        });
        currentY -= 10;
      }
    } else {
      page.drawText(hashFinal, {
        x: marginLeft + 10,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: pdfLib.rgb(0.5, 0.5, 0.5),
      });
      currentY -= 10;
    }
    currentY -= 20;

    // ==========================================================================
    // DADOS DO SIGNATÁRIO
    // ==========================================================================
    page.drawText("DADOS DO SIGNATÁRIO", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 15;

    const cpfFormatado = formatValue("cpf", manifestData.signatario.cpf);
    const signatarioFields = [
      `Nome Completo: ${manifestData.signatario.nomeCompleto}`,
      `CPF: ${cpfFormatado}`,
      `Data/Hora (UTC): ${manifestData.signatario.dataHora}`,
      `Data/Hora (Local): ${
        manifestData.signatario.dataHoraLocal ||
        formatDateTimeBrazil(manifestData.signatario.dataHora)
      }`,
      `IP de Origem: ${manifestData.signatario.ipOrigem || "Não disponível"}`,
    ];

    for (const field of signatarioFields) {
      page.drawText(field, {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 15;
    }

    // Geolocalização (se disponível)
    if (manifestData.signatario.geolocalizacao) {
      const geo = manifestData.signatario.geolocalizacao;
      const geoText = `Geolocalização: Lat ${geo.latitude.toFixed(
        6
      )}, Long ${geo.longitude.toFixed(6)}${
        geo.accuracy ? ` (±${Math.round(geo.accuracy)}m)` : ""
      }`;
      page.drawText(geoText, {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 12;

      const mapsLink = `https://maps.google.com/?q=${geo.latitude},${geo.longitude}`;
      page.drawText(mapsLink, {
        x: marginLeft,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: linkColor,
      });
      currentY -= 15;
    }

    // Dispositivo (se disponível)
    if (manifestData.dispositivo) {
      const { plataforma, navegador, resolucao } = manifestData.dispositivo;
      const dispositivoParts: string[] = [];

      if (plataforma) dispositivoParts.push(plataforma);
      if (navegador) dispositivoParts.push(navegador);
      if (resolucao) dispositivoParts.push(resolucao);

      if (dispositivoParts.length > 0) {
        const dispositivoText = `Dispositivo: ${dispositivoParts.join(" • ")}`;
        page.drawText(dispositivoText, {
          x: marginLeft,
          y: currentY,
          size: 9,
          font: fontRegular,
          color: pdfLib.rgb(0.4, 0.4, 0.4),
        });
        currentY -= 15;
      }
    }
    currentY -= 15;

    // ==========================================================================
    // EVIDÊNCIAS BIOMÉTRICAS
    // ==========================================================================
    page.drawText("EVIDÊNCIAS BIOMÉTRICAS", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 20;

    // Layout: Foto à esquerda (se presente), Assinatura à direita
    const imageY = currentY - 120;

    // Foto (lado esquerdo) - opcional
    if (fotoImage) {
      page.drawText("Foto (Selfie) no Momento da Assinatura:", {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });

      // Calcular dimensões mantendo proporção para foto (max 120x120)
      const fotoDims = fotoImage.scale(1);
      const fotoMaxSize = 120;
      const fotoScale = Math.min(
        fotoMaxSize / fotoDims.width,
        fotoMaxSize / fotoDims.height
      );
      const fotoWidth = fotoDims.width * fotoScale;
      const fotoHeight = fotoDims.height * fotoScale;

      page.drawImage(fotoImage, {
        x: marginLeft,
        y: imageY,
        width: fotoWidth,
        height: fotoHeight,
      });
    }

    // Assinatura (lado direito se houver foto, ou lado esquerdo se não houver)
    const assColumnX = fotoImage ? marginLeft + 180 : marginLeft;
    page.drawText("Assinatura Manuscrita Eletrônica:", {
      x: assColumnX,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: textColor,
    });

    // Calcular dimensões mantendo proporção para assinatura (max 200x80)
    const assDims = assinaturaImage.scale(1);
    const assMaxWidth = 200;
    const assMaxHeight = 80;
    const assScale = Math.min(
      assMaxWidth / assDims.width,
      assMaxHeight / assDims.height
    );
    const assWidth = assDims.width * assScale;
    const assHeight = assDims.height * assScale;

    page.drawImage(assinaturaImage, {
      x: assColumnX,
      y: imageY + (120 - assHeight), // Alinhar pelo topo
      width: assWidth,
      height: assHeight,
    });

    currentY = imageY - 25;

    // ==========================================================================
    // DECLARAÇÃO JURÍDICA
    // ==========================================================================
    page.drawText("DECLARAÇÃO JURÍDICA", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 15;

    // Texto da declaração (quebrar em múltiplas linhas)
    const declaracaoTexto =
      manifestData.termos.textoDeclaracao || MANIFEST_LEGAL_TEXT;
    const declaracaoLines = wrapText(
      fontRegular,
      declaracaoTexto,
      9,
      contentWidth
    );

    for (const line of declaracaoLines) {
      page.drawText(line, {
        x: marginLeft,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 12;
    }
    currentY -= 10;

    // Metadados dos termos
    page.drawText(`Versão dos Termos: ${manifestData.termos.versao}`, {
      x: marginLeft,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: pdfLib.rgb(0.4, 0.4, 0.4),
    });
    currentY -= 12;

    const dataAceiteFormatada = formatDateTimeBrazil(
      manifestData.termos.dataAceite
    );
    page.drawText(`Data de Aceite: ${dataAceiteFormatada}`, {
      x: marginLeft,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: pdfLib.rgb(0.4, 0.4, 0.4),
    });

    // ==========================================================================
    // RODAPÉ
    // ==========================================================================
    const footerText =
      "Documento gerado eletronicamente. Validade jurídica conforme Art. 10, § 2º, MP 2.200-2/2001.";
    const footerWidth = fontRegular.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 40,
      size: 8,
      font: fontRegular,
      color: pdfLib.rgb(0.5, 0.5, 0.5),
    });

    // Número da página
    const pageCount = pdfDoc.getPageCount();
    const pageNumText = `Página ${pageCount} de ${pageCount}`;
    const pageNumWidth = fontRegular.widthOfTextAtSize(pageNumText, 8);
    page.drawText(pageNumText, {
      x: width - marginRight - pageNumWidth,
      y: 25,
      size: 8,
      font: fontRegular,
      color: pdfLib.rgb(0.5, 0.5, 0.5),
    });

    timer.log("Página de manifesto adicionada com sucesso", context, {
      page_count: pageCount,
    });

    return pdfDoc;
  } catch (error) {
    logger.error("Erro ao adicionar página de manifesto", error, context);
    throw new Error(
      `Falha ao gerar manifesto: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`
    );
  }
}
