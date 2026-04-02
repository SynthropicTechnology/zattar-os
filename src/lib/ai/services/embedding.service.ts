// Usa variável de ambiente ou fallback para o modelo padrão
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

/**
 * Gera embedding usando API direta da OpenAI (compatível com AI SDK v5)
 * Usa batching automático para reduzir custos
 */
async function generateEmbeddingOpenAI(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const normalized = text.replace(/\n/g, ' ').trim();
  if (!normalized) {
    throw new Error('Texto vazio não pode ser vetorizado');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: normalized,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_MODEL.includes('3-small') ? 1536 : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Gera embeddings em batch usando API direta da OpenAI
 * Processa até 2048 textos por requisição (limite da API)
 */
async function generateEmbeddingsOpenAI(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const normalized = texts.map((t) => t.replace(/\n/g, ' ').trim());

  if (normalized.length === 0) {
    return [];
  }

  // Verificar se há textos vazios
  const emptyIndices = normalized
    .map((t, i) => (t.length === 0 ? i : -1))
    .filter((i) => i !== -1);
  if (emptyIndices.length > 0) {
    throw new Error(
      `generateEmbeddings recebeu ${emptyIndices.length} texto(s) vazio(s) nos índices: ${emptyIndices.join(', ')}. Filtre textos vazios antes de chamar esta função.`
    );
  }

  // Batch de até 2048 textos por requisição (limite da API OpenAI)
  const BATCH_SIZE = 2048;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
    const batch = normalized.slice(i, i + BATCH_SIZE);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: batch,
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_MODEL.includes('3-small') ? 1536 : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const batchEmbeddings = data.data.map((item: { embedding: number[] }) => item.embedding);
    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return generateEmbeddingOpenAI(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return generateEmbeddingsOpenAI(texts);
}
