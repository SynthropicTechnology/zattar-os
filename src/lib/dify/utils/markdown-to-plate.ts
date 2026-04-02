/**
 * Converte markdown em conteúdo Plate.js (array de nodes).
 * Trata: headings, parágrafos, listas, bold e italic inline.
 */

interface PlateTextChild {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface PlateNode {
  type: string;
  children: (PlateTextChild | PlateNode)[];
}

export function markdownToPlate(markdown: string): PlateNode[] {
  const blocks = markdown.split(/\n\n+/);
  const nodes: PlateNode[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');

    // Heading (first line starts with #)
    const headingMatch = lines[0].match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch && lines.length === 1) {
      const level = headingMatch[1].length;
      nodes.push({
        type: `h${level}`,
        children: parseInline(headingMatch[2]),
      });
      continue;
    }

    // Unordered list (all lines start with - or *)
    if (lines.every((l) => /^[-*]\s/.test(l.trim()))) {
      const listItems: PlateNode[] = lines.map((line) => ({
        type: 'li',
        children: [
          {
            type: 'lic',
            children: parseInline(line.replace(/^[-*]\s+/, '')),
          },
        ],
      }));
      nodes.push({ type: 'ul', children: listItems });
      continue;
    }

    // Ordered list (all lines start with number.)
    if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
      const listItems: PlateNode[] = lines.map((line) => ({
        type: 'li',
        children: [
          {
            type: 'lic',
            children: parseInline(line.replace(/^\d+\.\s+/, '')),
          },
        ],
      }));
      nodes.push({ type: 'ol', children: listItems });
      continue;
    }

    // Blockquote (lines start with >)
    if (lines[0].startsWith('>')) {
      const text = lines.map((l) => l.replace(/^>\s?/, '')).join(' ');
      nodes.push({
        type: 'blockquote',
        children: [{ type: 'p', children: parseInline(text) }],
      });
      continue;
    }

    // Regular paragraph (join lines into single paragraph)
    const text = lines.join(' ');
    nodes.push({ type: 'p', children: parseInline(text) });
  }

  return nodes.length > 0
    ? nodes
    : [{ type: 'p', children: [{ text: '' }] }];
}

function parseInline(text: string): PlateTextChild[] {
  const children: PlateTextChild[] = [];
  // Match **bold** and *italic* (bold first to avoid conflicts)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[2]) {
      children.push({ text: match[2], bold: true });
    } else if (match[3]) {
      children.push({ text: match[3], italic: true });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    children.push({ text: text.slice(lastIndex) });
  }

  return children.length > 0 ? children : [{ text }];
}
