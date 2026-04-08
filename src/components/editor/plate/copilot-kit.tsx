'use client';

import type { TElement } from 'platejs';

import { CopilotPlugin } from '@platejs/ai/react';
import { serializeMd, stripMarkdown } from '@platejs/markdown';

import { GhostText } from '@/components/editor/plate-ui/ghost-text';

import { MarkdownKit } from './markdown-kit';

export const CopilotKit = [
  ...MarkdownKit,
  CopilotPlugin.configure(({ api }) => ({
    options: {
      completeOptions: {
        api: '/api/ai/copilot',
        body: {
          system: `Você é um assistente avançado de escrita jurídica, similar ao VSCode Copilot mas para documentos legais brasileiros. Sua tarefa é prever e gerar a próxima parte do texto baseado no contexto fornecido.

  Regras:
  - Continue o texto naturalmente até o próximo sinal de pontuação (., ,, ;, :, ? ou !).
  - Mantenha o estilo, tom e terminologia jurídica do texto. Não repita o texto já fornecido.
  - Para contexto incerto, forneça a continuação mais provável usando linguagem formal e juridicamente precisa.
  - Trate trechos de código, listas ou texto estruturado quando necessário.
  - Não inclua """ na sua resposta.
  - CRÍTICO: Sempre termine com um sinal de pontuação.
  - CRÍTICO: Evite iniciar um novo bloco. Não use formatação de bloco como >, #, 1., 2., -, etc. A sugestão deve continuar no mesmo bloco que o contexto.
  - Se nenhum contexto for fornecido ou não for possível gerar uma continuação, retorne "0" sem explicação.`,
        },
        onError: () => {
          console.error('Copilot API error');
        },
        onFinish: (_, completion) => {
          if (completion === '0') return;

          api.copilot.setBlockSuggestion({
            text: stripMarkdown(completion),
          });
        },
      },
      debounceDelay: 500,
      renderGhostText: GhostText,
      getPrompt: ({ editor }) => {
        const contextEntry = editor.api.block({ highest: true });

        if (!contextEntry) return '';

        const prompt = serializeMd(editor, {
          value: [contextEntry[0] as TElement],
        });

        return `Continue o texto até o próximo sinal de pontuação:
  """
  ${prompt}
  """`;
      },
    },
    shortcuts: {
      accept: {
        keys: 'tab',
      },
      acceptNextWord: {
        keys: 'mod+right',
      },
      reject: {
        keys: 'escape',
      },
      triggerSuggestion: {
        keys: 'ctrl+space',
      },
    },
  })),
];
