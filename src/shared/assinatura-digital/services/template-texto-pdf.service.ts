/**
 * Template Texto PDF Service
 *
 * Service for converting Plate editor content to PDF documents.
 * Uses HTML as intermediate format and Puppeteer for PDF generation.
 */

import type { Descendant } from 'platejs';

interface PlateNode {
  type?: string;
  text?: string;
  children?: PlateNode[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  value?: string; // For mentions
  indent?: number;
  listStyleType?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * Converts Plate node to HTML
 */
function nodeToHtml(node: PlateNode): string {
  // Text node (leaf)
  if ('text' in node && typeof node.text === 'string') {
    let text = escapeHtml(node.text);

    // Apply marks
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    if (node.underline) text = `<u>${text}</u>`;
    if (node.strikethrough) text = `<del>${text}</del>`;
    if (node.code) text = `<code>${text}</code>`;

    return text;
  }

  // Element nodes
  const children = node.children?.map(nodeToHtml).join('') ?? '';
  const align = node.align ? ` style="text-align: ${node.align}"` : '';
  const indent = node.indent ? ` style="margin-left: ${node.indent * 2}rem"` : '';

  switch (node.type) {
    case 'h1':
      return `<h1${align}>${children}</h1>`;
    case 'h2':
      return `<h2${align}>${children}</h2>`;
    case 'h3':
      return `<h3${align}>${children}</h3>`;
    case 'h4':
      return `<h4${align}>${children}</h4>`;
    case 'h5':
      return `<h5${align}>${children}</h5>`;
    case 'h6':
      return `<h6${align}>${children}</h6>`;
    case 'p':
      return `<p${align}${indent}>${children || '&nbsp;'}</p>`;
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`;
    case 'ul':
      return `<ul>${children}</ul>`;
    case 'ol':
      return `<ol>${children}</ol>`;
    case 'li':
      return `<li>${children}</li>`;
    case 'a':
      return `<a href="${escapeHtml(node.url || '#')}">${children}</a>`;
    case 'mention':
      // Render mention as variable placeholder
      return `<span class="variable">{{${escapeHtml(node.value || '')}}}</span>`;
    case 'code_block':
      return `<pre><code>${children}</code></pre>`;
    case 'code_line':
      return `${children}\n`;
    case 'hr':
      return '<hr />';
    default:
      return children;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert Plate content to HTML document
 */
export function plateContentToHtml(content: Descendant[]): string {
  const bodyHtml = content.map((node) => nodeToHtml(node as PlateNode)).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento</title>
  <style>
    @page {
      size: A4;
      margin: 2.5cm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin: 1em 0 0.5em;
    }

    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin: 1em 0 0.5em;
    }

    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin: 1em 0 0.5em;
    }

    h4, h5, h6 {
      font-size: 12pt;
      font-weight: bold;
      margin: 1em 0 0.5em;
    }

    p {
      margin: 0.5em 0;
      text-align: justify;
    }

    blockquote {
      margin: 1em 2em;
      padding-left: 1em;
      border-left: 3px solid #ccc;
      font-style: italic;
    }

    ul, ol {
      margin: 0.5em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.25em 0;
    }

    pre {
      background: #f5f5f5;
      padding: 1em;
      margin: 1em 0;
      overflow-x: auto;
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
    }

    code {
      font-family: 'Courier New', Courier, monospace;
      background: #f5f5f5;
      padding: 0.1em 0.3em;
      border-radius: 3px;
    }

    a {
      color: #0066cc;
      text-decoration: underline;
    }

    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 1em 0;
    }

    .variable {
      background: #fef3c7;
      padding: 0.1em 0.3em;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
    }

    strong {
      font-weight: bold;
    }

    em {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    del {
      text-decoration: line-through;
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * Replace variable placeholders with actual values
 */
export function replaceVariables(
  html: string,
  variables: Record<string, string>
): string {
  let result = html;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(escapeRegExp(placeholder), 'g'), escapeHtml(value));
  }

  // Remove unreplaced variables (show empty)
  result = result.replace(/\{\{[\w.]+\}\}/g, '');

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract variable keys from Plate content
 */
export function extractVariables(content: Descendant[]): string[] {
  const variables: Set<string> = new Set();

  function traverse(node: PlateNode) {
    if (node.type === 'mention' && node.value) {
      variables.add(node.value);
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of content) {
    traverse(node as PlateNode);
  }

  return Array.from(variables);
}

/**
 * Generate a preview of the document with sample data
 */
export function generatePreviewHtml(
  content: Descendant[],
  sampleData?: Record<string, string>
): string {
  const html = plateContentToHtml(content);

  if (sampleData) {
    return replaceVariables(html, sampleData);
  }

  return html;
}

/**
 * Default sample data for preview
 */
export const DEFAULT_SAMPLE_DATA: Record<string, string> = {
  'cliente.nome_completo': 'João da Silva',
  'cliente.cpf': '123.456.789-00',
  'cliente.cnpj': '12.345.678/0001-00',
  'cliente.email': 'joao@email.com',
  'cliente.telefone': '(11) 99999-9999',
  'cliente.data_nascimento': '01/01/1990',
  'cliente.endereco_completo': 'Rua das Flores, 123 - Centro - São Paulo/SP',
  'cliente.endereco_cidade': 'São Paulo',
  'cliente.endereco_uf': 'SP',
  'cliente.endereco_cep': '01234-567',
  'segmento.nome': 'Trabalhista',
  'segmento.slug': 'trabalhista',
  'segmento.descricao': 'Processos trabalhistas',
  'sistema.protocolo': 'PROTO-2024-00001',
  'sistema.ip_cliente': '192.168.1.1',
  'sistema.user_agent': 'Mozilla/5.0',
  'formulario.nome': 'Formulário de Contrato',
  'formulario.slug': 'formulario-contrato',
  'processo.numero': '0001234-56.2024.8.26.0100',
  'processo.vara': '1ª Vara do Trabalho',
  'processo.comarca': 'São Paulo',
  'processo.data_autuacao': '01/01/2024',
  'processo.valor_causa': 'R$ 50.000,00',
  'processo.tipo': 'Reclamação Trabalhista',
};
