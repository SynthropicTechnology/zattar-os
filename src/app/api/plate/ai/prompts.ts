import type { ChatMessage } from '@/components/editor/types/chat-editor-types';
import type { SlateEditor } from 'platejs';

import { getMarkdown } from '@platejs/ai';
import dedent from 'dedent';

import {
  addSelection,
  buildStructuredPrompt,
  formatTextFromMessages,
  getLastUserInstruction,
  getMarkdownWithSelection,
  isMultiBlocks,
  isSelectionInTable,
  isSingleCellSelection,
} from '../../ai/command/utils';
import { getPromptContent } from '@/lib/system-prompts/get-prompt';

/**
 * System prompts especializados em Direito Brasileiro para o editor de documentos.
 * O conteúdo dos prompts (campo `task`) é carregado do banco de dados via getPromptContent().
 * Caso não exista no banco, usa o fallback hardcoded em defaults.ts.
 * Os examples e rules permanecem hardcoded pois são acoplados à API do editor.
 */

export async function getChooseToolPrompt({ isSelecting, messages }: { isSelecting: boolean; messages: ChatMessage[] }) {
  const task = await getPromptContent('plate_choose_tool');

  const editRule = isSelecting ? dedent`
    - Retorne "edit" apenas para pedidos que requerem reescrever o texto selecionado como substituição in-place (ex.: corrigir gramática, melhorar redação, encurtar/expandir, traduzir, simplificar).
    - Pedidos como resumir/explicar/extrair/tópicos/tabela/perguntas devem ser "generate" mesmo com texto selecionado.` : '';

  return buildStructuredPrompt({
    examples: [
      // GENERATE
      'User: "Redija uma cláusula de confidencialidade" → Good: "generate" | Bad: "edit"',
      'User: "Escreva um parágrafo sobre prescrição trabalhista" → Good: "generate" | Bad: "comment"',
      'User: "Crie uma petição inicial" → Good: "generate" | Bad: "edit"',
      'User: "Resuma este texto" → Good: "generate" | Bad: "edit"',

      // EDIT (only when selecting)
      ...(isSelecting ? [
        'User: "Corrija a gramática." → Good: "edit" | Bad: "generate"',
        'User: "Melhore a redação jurídica." → Good: "edit" | Bad: "generate"',
        'User: "Torne mais conciso." → Good: "edit" | Bad: "generate"',
        'User: "Traduza este parágrafo para o inglês" → Good: "edit" | Bad: "generate"',
        'User: "Formalize o tom do texto" → Good: "edit" | Bad: "generate"',
      ] : []),

      // COMMENT
      'User: "Revise este texto e dê feedback" → Good: "comment" | Bad: "edit"',
      'User: "Adicione comentários sobre a segurança jurídica deste contrato" → Good: "comment" | Bad: "generate"',
      'User: "Analise este documento" → Good: "comment" | Bad: "edit"',
    ],
    instruction: getLastUserInstruction(messages),
    history: formatTextFromMessages(messages),
    rules: dedent`
      - Default é "generate". Qualquer pergunta aberta, pedido de ideia ou criação → "generate".
      - Retorne "comment" apenas se o usuário pedir explicitamente comentários, feedback, anotações ou revisão. Não infira "comment" implicitamente.
      - Retorne apenas um valor enum sem explicação.
      - CRÍTICO: Exemplos servem apenas como referência de formato. NUNCA reproduza conteúdo dos exemplos.
    `.trim() + editRule,
    task: task || `Você é um classificador estrito. Classifique a última solicitação do usuário como ${isSelecting ? '"generate", "edit" ou "comment"' : '"generate" ou "comment"'}.`,
  });
}

export async function getCommentPrompt(
  editor: SlateEditor,
  {
    messages,
  }: {
    messages: ChatMessage[];
  }
) {
  const selectingMarkdown = getMarkdown(editor, {
    type: 'blockWithBlockId',
  });

  const task = await getPromptContent('plate_comment');

  return buildStructuredPrompt({
    backgroundData: selectingMarkdown,
    examples: [
      // 1) Comentário jurídico básico
      `User: Revise esta cláusula.

    backgroundData:
  <block id="1">O empregador poderá rescindir o contrato a qualquer momento sem justa causa.</block>

  Output:
  [
    {
      "blockId": "1",
      "content": "O empregador poderá rescindir o contrato a qualquer momento sem justa causa.",
      "comments": "Esta cláusula pode ser considerada abusiva. Recomenda-se incluir referência ao artigo 477 da CLT e especificar o aviso prévio."
    }
  ]`,

      // 2) Múltiplos comentários em uma cláusula longa
      `User: Analise esta seção do contrato.

  backgroundData:
  <block id="2">O colaborador concorda em não trabalhar para concorrentes por 5 anos após o término do contrato. O descumprimento resultará em multa de 100 salários mínimos.</block>

  Output:
  [
    {
      "blockId": "2",
      "content": "não trabalhar para concorrentes por 5 anos",
      "comments": "Prazo excessivo. A jurisprudência trabalhista considera razoável cláusulas de não-concorrência de até 2 anos."
    },
    {
      "blockId": "2",
      "content": "multa de 100 salários mínimos",
      "comments": "Valor desproporcional pode ser considerado cláusula penal abusiva. Considere revisar para um valor proporcional ao dano potencial."
    }
  ]`,

      // 3) Com <Selection> – usuário destacou parte do texto
      `User: Dê feedback sobre a frase destacada.

  backgroundData:
  <block id="5">O contrato terá vigência <Selection>por prazo indeterminado</Selection> a partir da assinatura.</block>

  Output:
  [
    {
      "blockId": "5",
      "content": "por prazo indeterminado",
      "comments": "Recomenda-se especificar as condições de rescisão e período de experiência, conforme artigo 443 da CLT."
    }
  ]`,
    ],
    history: formatTextFromMessages(messages),
    rules: dedent`
      - IMPORTANTE: Se um comentário abranger múltiplos blocos, use o id do **primeiro** bloco.
      - O campo **content** deve ser o conteúdo original dentro da tag block. O conteúdo retornado não deve incluir as tags block, mas deve reter outras tags MDX.
      - IMPORTANTE: O campo **content** deve ser flexível:
        - Pode cobrir um bloco inteiro, apenas parte de um bloco, ou múltiplos blocos.
        - Se múltiplos blocos forem incluídos, separe-os com dois \\n\\n.
        - NÃO use o bloco inteiro por padrão—use o menor span relevante.
      - Pelo menos um comentário deve ser fornecido.
      - Se existir <Selection>, seus comentários devem focar no texto selecionado. Se a <Selection> for muito longa, deve haver mais de um comentário.
      - CONTEXTO JURÍDICO: Sempre considere aspectos de segurança jurídica, conformidade legal, clareza contratual e boas práticas de redação jurídica brasileira.
    `,
    task,
  });
}

export async function getGeneratePrompt(
  editor: SlateEditor,
  { isSelecting, messages }: { isSelecting: boolean; messages: ChatMessage[] }
) {
  const task = await getPromptContent('plate_generate');

  // Geração freeform: criação livre sem contexto do editor
  if (!isSelecting) {
    return buildStructuredPrompt({
      examples: [
        'User: Redija uma cláusula de confidencialidade.\nOutput:\n**CLÁUSULA DÉCIMA - DA CONFIDENCIALIDADE**\n\n10.1. As partes obrigam-se a manter em sigilo todas as informações confidenciais...',
        'User: Redija uma introdução para petição de horas extras.\nOutput:\n**EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A)...**',
        'User: Liste três dicas para redigir contratos claros.\nOutput:\n1. Use linguagem objetiva e direta.\n2. Defina claramente os termos técnicos.\n3. Inclua cláusulas de resolução de conflitos.',
      ],
      instruction: getLastUserInstruction(messages),
      history: formatTextFromMessages(messages),
      rules: dedent`
        - Produza apenas o resultado final. Não adicione preâmbulos como "Aqui está..." a menos que explicitamente solicitado.
        - CRÍTICO: ao escrever Markdown ou MDX, NÃO envolva a saída em code fences.
        - CRÍTICO: Exemplos servem apenas como referência de formato. NUNCA reproduza conteúdo dos exemplos.
        - CONTEXTO JURÍDICO: Use linguagem formal e juridicamente precisa. Cite artigos de lei quando relevante.
      `,
      task: task || dedent`
        Você é um assistente avançado de geração de conteúdo jurídico.
        Gere conteúdo baseado nas instruções do usuário.
        Produza diretamente o resultado final sem pedir informações adicionais.
      `,
    });
  }

  // Geração com contexto: usa texto selecionado como base
  if (!isMultiBlocks(editor)) {
    addSelection(editor);
  }

  const selectingMarkdown = getMarkdownWithSelection(editor);

  return buildStructuredPrompt({
    context: selectingMarkdown,
    examples: [
      'User: Resuma os principais pontos deste contrato.\nContext:\nContrato de locação comercial com prazo de 5 anos, valor mensal de R$ 10.000.\nOutput:\n**Principais Pontos:**\n- **Prazo:** 5 anos\n- **Valor:** R$ 10.000/mês',
      'User: Explique o significado da frase selecionada.\nContext:\nA rescisão indireta ocorre quando o empregador comete <Selection>falta grave</Selection>.\nOutput:\n"Falta grave" refere-se ao descumprimento contratual pelo empregador, prevista no artigo 483 da CLT.',
    ],
    instruction: getLastUserInstruction(messages),
    history: formatTextFromMessages(messages),
    rules: dedent`
      - <Selection> é o texto destacado pelo usuário.
      - CRÍTICO: NÃO remova ou altere tags MDX customizadas como <u>, <callout>, <kbd>, <toc>, <sub>, <sup>, <mark>, <del>, <date>, <span>, <column>, <column_group>, <file>, <audio>, <video> a menos que explicitamente solicitado.
      - CRÍTICO: ao escrever Markdown ou MDX, NÃO envolva a saída em code fences.
      - Preserve indentação e quebras de linha ao editar dentro de colunas ou layouts estruturados.
      - Tags <Selection> são marcadores de entrada. NÃO devem aparecer na saída.
      - CRÍTICO: Exemplos servem apenas como referência de formato. NUNCA reproduza conteúdo dos exemplos.
      - CONTEXTO JURÍDICO: Use linguagem formal e juridicamente precisa. Cite artigos de lei quando relevante. Priorize clareza e segurança jurídica.
    `,
    task: task || dedent`
      Você é um assistente avançado de geração de conteúdo jurídico.
      Gere conteúdo baseado nas instruções do usuário, usando <context> como fonte.
      Se a instrução pede criação ou transformação (resumir, traduzir, reescrever, criar tabela), produza diretamente o resultado final.
    `,
  });
}

export type EditType = 'table' | 'multi-block' | 'selection';

export async function getEditPrompt(
  editor: SlateEditor,
  { isSelecting, messages }: { isSelecting: boolean; messages: ChatMessage[] }
): Promise<[string, EditType]> {
  if (!isSelecting)
    throw new Error('Edit tool is only available when selecting');

  const task = await getPromptContent('plate_edit');

  // Edição de tabela multi-célula
  if (isSelectionInTable(editor) && !isSingleCellSelection(editor)) {
    return [buildEditTableMultiCellPrompt(editor, messages), 'table'];
  }

  // Edição multi-bloco
  if (isMultiBlocks(editor)) {
    const selectingMarkdown = getMarkdownWithSelection(editor);

    const prompt = buildStructuredPrompt({
      context: selectingMarkdown,
      examples: [
        'User: Corrija a gramática.\nContext: # Contrato de Prestação\nEste contrato estabelece as condição de prestação de serviço.\nOutput:\n# Contrato de Prestação\nEste contrato estabelece as condições de prestação de serviços.',
        'User: Formalize o tom para uso em contrato.\nContext: ## Introdução\nA gente vai explicar como funciona o serviço aqui.\nOutput:\n## Introdução\nO presente instrumento tem por objeto estabelecer os termos e condições da prestação de serviços.',
        'User: Torne mais conciso sem perder o significado.\nContext: O objetivo deste documento é apresentar uma explicação detalhada e abrangente de todos os passos necessários para completar o processo de instalação do software.\nOutput:\nEste documento apresenta os passos necessários para instalação do software.',
      ],
      instruction: getLastUserInstruction(messages),
      history: formatTextFromMessages(messages),
      outputFormatting: 'markdown',
      rules: dedent`
        - Produza APENAS o conteúdo de substituição. Não inclua tags de markup na saída.
        - Certifique-se de que a substituição seja gramaticalmente correta e leia naturalmente.
        - Preserve quebras de linha no conteúdo original a menos que explicitamente instruído a removê-las.
        - Preserve a contagem de blocos, quebras de linha e toda sintaxe Markdown existente; apenas modifique o conteúdo textual dentro de cada bloco.
        - Não altere níveis de heading, marcadores de lista, URLs de links, ou adicione/remova linhas em branco a menos que explicitamente instruído.
        - CRÍTICO: Exemplos servem apenas como referência de formato. NUNCA reproduza conteúdo dos exemplos.
        - CONTEXTO JURÍDICO: Mantenha a terminologia legal adequada e a estrutura formal de documentos jurídicos brasileiros.
      `,
      task: dedent`
        ${task || ''}

        O seguinte <context> é conteúdo Markdown fornecido pelo usuário que precisa de melhorias.
        Sua saída deve ser uma substituição perfeita do conteúdo original.
      `,
    });
    return [prompt, 'multi-block'];
  }

  // Edição de seleção dentro de um bloco
  addSelection(editor);

  const selectingMarkdown = getMarkdownWithSelection(editor);
  const endIndex = selectingMarkdown.indexOf('<Selection>');
  const prefilledResponse = endIndex === -1 ? '' : selectingMarkdown.slice(0, endIndex);

  const prompt = buildStructuredPrompt({
    context: selectingMarkdown,
    examples: [
      'User: Melhore a escolha de palavras.\nContext: Este é um <Selection>bom</Selection> contrato.\nOutput: excelente',
      'User: Corrija a gramática.\nContext: O empregado <Selection>recebe</Selection> suas férias anualmente.\nOutput: receberá',
      'User: Formalize o tom.\nContext: <Selection>Me dá</Selection> o documento.\nOutput: Solicito a apresentação do',
      'User: Use o termo jurídico correto.\nContext: O <Selection>trabalhador</Selection> terá direito a férias.\nOutput: empregado',
      'User: Traduza para inglês.\nContext: <Selection>Contrato de Trabalho</Selection>\nOutput: Employment Agreement',
    ],
    instruction: getLastUserInstruction(messages),
    history: formatTextFromMessages(messages),
    outputFormatting: 'markdown',
    prefilledResponse,
    rules: dedent`
      - Produza APENAS o conteúdo de substituição. Não inclua tags de markup na saída.
      - Sua resposta será diretamente concatenada com o prefilledResponse, então certifique-se de que o resultado seja suave e coerente.
      - Você pode usar o texto circundante em <context> para garantir que a substituição se encaixe naturalmente.
      - CRÍTICO: Exemplos servem apenas como referência de formato. NUNCA reproduza conteúdo dos exemplos.
      - CONTEXTO JURÍDICO: Priorize precisão terminológica e adequação ao padrão formal de documentos jurídicos brasileiros.
    `,
    task: dedent`
      ${task || ''}

      O <context> a seguir contém tags <Selection> marcando a parte editável.
      Produza apenas a substituição para o texto selecionado.
    `,
  });
  return [prompt, 'selection'];
}

/** Prompt para edição de múltiplas células de tabela */
export function buildEditTableMultiCellPrompt(
  editor: SlateEditor,
  messages: ChatMessage[]
): string {
  const tableCellMarkdown = getMarkdown(editor, {
    type: 'tableCellWithId',
  });

  return buildStructuredPrompt({
    context: tableCellMarkdown,
    examples: [
      dedent`
        <instruction>
        Corrija a gramática
        </instruction>

        <context>
        | Nome | Idade | Cidade |
        | --- | --- | --- |
        | João | 28 | <CellRef id="c1" /> |

        <Cell id="c1">
        São paulo
        </Cell>
        </context>

        <output>
        [
          { "id": "c1", "content": "São Paulo" }
        ]
        </output>
      `,
      dedent`
        <instruction>
        Traduza para inglês
        </instruction>

        <context>
        | Nome | Cargo |
        | --- | --- |
        | Alice | <CellRef id="c1" /> |
        | Bob | <CellRef id="c2" /> |

        <Cell id="c1">
        Engenheiro
        </Cell>

        <Cell id="c2">
        Designer
        </Cell>
        </context>

        <output>
        [
          { "id": "c1", "content": "Engineer" },
          { "id": "c2", "content": "Designer" }
        ]
        </output>
      `,
    ],
    instruction: getLastUserInstruction(messages),
    history: formatTextFromMessages(messages),
    rules: dedent`
      - A tabela contém placeholders <CellRef id="..." /> marcando células selecionadas.
      - O conteúdo real de cada célula está nos blocos <Cell id="...">conteúdo</Cell> após a tabela.
      - Você deve APENAS modificar o conteúdo dos blocos <Cell>.
      - Produza um array JSON onde cada objeto tem "id" (id da célula) e "content" (novo conteúdo).
      - O campo "content" pode conter múltiplos parágrafos separados por \\n\\n.
      - NÃO produza <Cell>, <CellRef>, ou markdown de tabela — apenas o array JSON.
      - CRÍTICO: Exemplos servem apenas como referência de formato. NUNCA reproduza conteúdo dos exemplos.
    `,
    task: dedent`
      Você é um assistente de edição de células de tabela.
      O <context> contém uma tabela markdown com placeholders <CellRef /> e blocos <Cell> correspondentes.
      Sua tarefa é modificar o conteúdo das células selecionadas de acordo com a instrução do usuário.
      Produza APENAS um array JSON válido com os conteúdos das células modificados.
    `,
  });
}
