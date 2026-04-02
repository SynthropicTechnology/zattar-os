export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  preserveParagraphs?: boolean;
}

export interface Chunk {
  content: string;
  index: number;
  metadata: {
    start_char: number;
    end_char: number;
    page?: number;
  };
}

export async function chunkText(text: string, options: ChunkOptions = {}): Promise<Chunk[]> {
  const { chunkSize = 1000, chunkOverlap = 200, preserveParagraphs = true } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  // Separar por parágrafos se solicitado
  const segments = preserveParagraphs ? text.split(/\n\n+/).filter((s) => s.trim()) : [text];

  let currentChunk = '';
  let currentStartChar = 0;
  let runningPosition = 0;

  for (const segment of segments) {
    const segmentWithSeparator = currentChunk ? '\n\n' + segment : segment;

    if (currentChunk.length + segmentWithSeparator.length <= chunkSize) {
      if (currentChunk) {
        currentChunk += '\n\n' + segment;
      } else {
        currentChunk = segment;
        currentStartChar = runningPosition;
      }
    } else {
      // Salvar chunk atual se existir
      if (currentChunk) {
        chunks.push({
          content: currentChunk,
          index: chunkIndex++,
          metadata: {
            start_char: currentStartChar,
            end_char: currentStartChar + currentChunk.length,
          },
        });
      }

      // Se o segmento for maior que chunkSize, quebrar em partes menores
      if (segment.length > chunkSize) {
        const subChunks = splitLargeSegment(segment, chunkSize, chunkOverlap);
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk.content,
            index: chunkIndex++,
            metadata: {
              start_char: runningPosition + subChunk.start,
              end_char: runningPosition + subChunk.end,
            },
          });
        }
        currentChunk = '';
        currentStartChar = runningPosition + segment.length;
      } else {
        currentStartChar = runningPosition;
        currentChunk = segment;
      }
    }

    runningPosition += segment.length + 2; // +2 para \n\n
  }

  // Adicionar último chunk
  if (currentChunk) {
    chunks.push({
      content: currentChunk,
      index: chunkIndex,
      metadata: {
        start_char: currentStartChar,
        end_char: currentStartChar + currentChunk.length,
      },
    });
  }

  return chunks;
}

function splitLargeSegment(
  text: string,
  chunkSize: number,
  overlap: number
): { content: string; start: number; end: number }[] {
  const result: { content: string; start: number; end: number }[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    result.push({
      content: text.slice(start, end),
      start,
      end,
    });

    if (end >= text.length) break;
    start = end - overlap;
  }

  return result;
}
