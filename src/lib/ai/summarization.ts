import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { TipoChamada } from '@/app/(authenticated)/chat';

export async function gerarResumoTranscricao(
  transcricao: string,
  contexto?: { tipo: TipoChamada; duracao?: number }
): Promise<string> {
  const tipoChamada = contexto?.tipo === 'audio' ? 'áudio' : 'vídeo';
  
  const systemPrompt = `
Você é um assistente especializado em resumir transcrições de chamadas jurídicas e corporativas.
Analise a transcrição fornecida e crie um resumo conciso e estruturado em português brasileiro.

Estrutura desejada:
1. **Principais Tópicos**: Lista dos assuntos discutidos.
2. **Decisões/Acordos**: O que foi decidido ou combinado (se houver).
3. **Próximos Passos**: Ações pendentes ou tarefas atribuídas (se houver).
4. **Resumo Geral**: Breve parágrafo narrativo.

Contexto da chamada:
- Tipo: Chamada de ${tipoChamada}
- Duração aprox: ${contexto?.duracao ? `${Math.floor(contexto.duracao / 60)} min` : 'N/A'}

Mantenha o tom profissional, objetivo e formal. Ignore conversas fiadas ou irrelevantes.
Se a transcrição for muito curta ou sem conteúdo relevante, indique que não houve discussão substancial.
`;

  try {
    const { text } = await generateText({
      model: google('gemini-3.1-flash-lite-preview'),
      system: systemPrompt,
      prompt: `Aqui está a transcrição da chamada:\n\n${transcricao}`,
    });

    return text;
  } catch (error) {
    console.error('Erro ao gerar resumo com OpenAI:', error);
    // Fallback or re-throw
    throw new Error('Falha na geração do resumo.');
  }
}
