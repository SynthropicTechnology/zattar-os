# Gerar PDFs de Contratação a partir do Contrato — Design

**Data:** 2026-04-16
**Escopo:** Módulo `contratos` (admin) + integração com `assinatura-digital`
**Status:** Design aprovado; pronto para planejamento de implementação

---

## 1. Contexto e motivação

O fluxo de assinatura digital pública já permite que um cliente preencha um formulário e gere 4 documentos de contratação trabalhista (**Contrato**, **Procuração**, **Hipossuficiência Financeira**, **Declaração de Ciência e Responsabilidade**), que por sua vez são assinados digitalmente e vinculados a um contrato.

Porém, na rota admin de contratos (`/contratos/[id]`), **não existe um caminho** para o advogado:

1. **Baixar um rascunho dos 4 PDFs já preenchidos** a partir de um contrato cadastrado manualmente (com cliente + parte contrária), sem envolver o fluxo público. Útil para impressão, revisão interna ou assinatura física.
2. **Disparar o fluxo formal de assinatura digital diretamente do contrato**, criando os documentos com `contrato_id` preenchido — FK que hoje existe no schema mas nunca é populada pela UI.

Este design entrega ambos os caminhos a partir do mesmo ponto visual: um novo card "Documentos de Contratação" dentro da tela de detalhe do contrato.

### Estado atual confirmado via banco (projeto Supabase `cxxdivtgeslrujpfpivs`)

- Formulário `Contratação` (id=3, slug=`contratacao`, `segmento_id=1` Trabalhista) existe e está ativo.
- Vincula 4 templates PDF reais: **Contrato**, **Procuração**, **Hipossuficiência Financeira**, **Declaração de Ciência e Responsabilidade** — todos com `arquivo_original` no storage e `campos` (mapa de ancoras) populados.
- FK `assinatura_digital_documentos.contrato_id` existe no schema, **nunca foi preenchida** por qualquer fluxo atual (query retornou zero linhas).
- Variáveis usadas pelos templates (`cliente.*`, `acao.nome_empresa_pessoa`, `sistema.data_geracao`, `assinatura.assinatura_base64`) são 100% cobertas pelos dados que o módulo `contratos` já armazena (`contratos` + `clientes` + `enderecos` + `contrato_partes`).

---

## 2. Decisões de design

| Tópico | Decisão |
|---|---|
| Fluxo principal (baixar PDFs) | Híbrido: se dados completos → download direto; se faltar campo obrigatório → modal de overrides stateless |
| Persistência do rascunho | **Stateless** — zero side effects no banco; regenera on-demand |
| Abordagem arquitetural | Server action (valida) + API route (stream do ZIP) separadas |
| Política do slot de assinatura (caminho rascunho) | Vazio (PDF sai "pronto para assinatura física") |
| Caminho secundário | Botão "Enviar pra cliente assinar" que dispara o fluxo público persistente |
| Envio do link | MVP: só copiar link (sem email/WhatsApp integrado) |
| Expiração do token | 7 dias (configurável via env) |
| Email do cliente | `clientes.emails[0]` (primeiro = principal) |
| Múltiplas partes contrárias | Concatenadas via `Intl.ListFormat` pt-BR (produz "A, B e C") |
| Labels do modal | Dicionário manual (garantia de qualidade do texto jurídico) |
| Gate de exibição | `contrato.segmento_id = 1` **e** existe formulário ativo com esse segmento |
| Cliente PJ em contrato trabalhista | Bloqueado com erro explícito |

---

## 3. User flow

### 3.1 Entrada — card no detalhe do contrato

Um novo `GlassPanel depth={2}` renderizado em `contrato-detalhes-client.tsx` com título **"Documentos de Contratação"** e dois botões:

- **Primário:** `Baixar PDFs preenchidos` — rascunho efêmero, sem assinatura.
- **Secundário:** `Enviar para cliente assinar` — dispara fluxo público persistente.

Visibilidade condicional: o card só aparece quando o contrato tem `segmento_id = 1` (Trabalhista) e existe um formulário `ativo=true` para esse segmento.

### 3.2 Caminho A — Baixar PDFs preenchidos (stateless)

```
click → action: gerarPdfsContrato(contratoId)
      ├─ carrega contrato + cliente + endereço + partes
      ├─ mapper: contratoParaInputData(dados)
      ├─ detectarCamposFaltantes(inputData, templates)
      │
      ├─ faltam campos? → return { camposFaltantes: [...] }
      │                   ↓
      │                   UI: abre modal-campos-faltantes
      │                   submit overrides → próximo passo com overrides
      │
      └─ completo → fetch POST /api/contratos/{id}/pdfs-contratacao
                    ↓
                    server: service.gerarZip(inputData)
                            ├─ template-pdf.service.merge x4 em paralelo
                            ├─ jszip empacota os 4 PDFs
                            └─ stream de application/zip
                    ↓
                    browser baixa "Contratacao-{nome-cliente}.zip"
```

### 3.3 Caminho B — Enviar pra cliente assinar (persistente)

```
click → action: enviarContratoAssinatura(contratoId)
      ├─ carrega dados + mapper + detecção de faltantes (mesmo que A)
      │
      ├─ transação Supabase:
      │   ├─ insere 4 linhas em assinatura_digital_documentos
      │   │   └─ contrato_id populado ← novidade
      │   │   └─ pdf_original_url = template.arquivo_original
      │   │   └─ status = 'aguardando_assinatura'
      │   ├─ insere 4 linhas em assinatura_digital_documento_assinantes
      │   │   └─ cliente snapshot (nome, cpf)
      │   ├─ insere 1 sessão em assinatura_digital_sessoes_assinatura
      │   │   └─ token UUID, expira_em = now() + 7 dias
      │   │   └─ input_data_preenchido = inputData
      │   └─ commit
      │
      └─ retorna { sessaoUrl, token, expiraEm }
      ↓
UI: modal "Documentos prontos" com link copiável
```

Quando o cliente abre o link e completa a assinatura pelo fluxo público existente, todos os documentos ficam associados ao contrato e aparecem automaticamente na aba de documentos do contrato.

---

## 4. Arquitetura técnica

### 4.1 Novos arquivos

```
src/app/(authenticated)/contratos/
├── components/
│   ├── contrato-detalhes-client.tsx             ← MODIFICAR (renderiza novo card)
│   ├── documentos-contratacao-card.tsx          ← NOVO
│   └── modal-campos-faltantes-dialog.tsx        ← NOVO
├── actions/
│   ├── gerar-pdfs-contrato-action.ts            ← NOVO (valida + retorna camposFaltantes|ok)
│   └── enviar-contrato-assinatura-action.ts     ← NOVO (caminho B, persistente)
├── services/
│   ├── documentos-contratacao.service.ts        ← NOVO (orquestra merge + zip)
│   └── mapeamento-contrato-input-data.ts        ← NOVO (mapper puro)
└── index.ts                                      ← atualizar exports

src/app/api/contratos/[id]/pdfs-contratacao/
└── route.ts                                      ← NOVO (POST → stream ZIP)
```

### 4.2 Responsabilidades por arquivo

| Arquivo | Responsabilidade | Dependências |
|---|---|---|
| `mapeamento-contrato-input-data.ts` | Função pura. Recebe `{ contrato, cliente, endereco, partes }`; devolve `inputData` no formato dos templates (`cliente.*`, `acao.*`, `sistema.*`). Também detecta campos obrigatórios ausentes. | Nenhuma externa |
| `documentos-contratacao.service.ts` | Carrega dados (cliente + endereço + partes). Chama o mapper. Chama `template-pdf.service` para cada um dos 4 templates em paralelo. Empacota em ZIP. | `@/shared/assinatura-digital/services/template-pdf.service`, `jszip` |
| `gerar-pdfs-contrato-action.ts` | Server action `authenticatedAction`. Só valida: roda mapper + detecta faltantes. Retorna `{ready: true}` ou `{camposFaltantes: [...]}`. Não gera PDF nesta etapa. | service acima |
| `route.ts` (API route) | `POST`. Body opcional `{overrides?: {...}}`. Gera ZIP e retorna stream `application/zip`. Usa mesmo service. | service acima |
| `enviar-contrato-assinatura-action.ts` | Server action `authenticatedAction`. Cria 4 `assinatura_digital_documentos` com `contrato_id`, assinantes e sessão. Retorna link/token. | `@/shared/assinatura-digital/services/documentos.service`, mapper |

### 4.3 Por que action de validação + API route de download separadas?

- **Validação antecipada:** descobre se precisa de modal antes do browser tentar baixar. Evita experiência ruim de "clica → erro 422 → frustração".
- **Download real:** server actions Next.js retornam JSON por natureza; forçar retorno binário grande exige base64 (duplica RAM, complica streaming). API route faz stream nativo e cabe bem para `Content-Disposition`.
- Mesmo service é consumido por ambos, zero duplicação.

---

## 5. Mapeamento de dados

### 5.1 Tabela de mapeamento (contrato → inputData)

| Variável (template) | Fonte | Transformação | Obrigatório |
|---|---|---|---|
| `cliente.nome_completo` | `clientes.nome` via `contratos.cliente_id` | trim | sim |
| `cliente.nacionalidade` | `clientes.nacionalidade` | — | sim |
| `cliente.estado_civil` | `clientes.estado_civil` (enum) | enum → label ("Solteiro(a)", "Casado(a)", etc.) | sim |
| `cliente.rg` | `clientes.rg` | — | sim |
| `cliente.cpf` | `clientes.cpf` | formatar `000.000.000-00` | sim |
| `cliente.endereco_logradouro` | `enderecos.logradouro` via `clientes.endereco_id` | — | sim |
| `cliente.endereco_numero` | `enderecos.numero` | — | sim |
| `cliente.endereco_bairro` | `enderecos.bairro` | — | sim |
| `cliente.endereco_cidade` | `enderecos.municipio` | — | sim |
| `cliente.endereco_estado` | `enderecos.estado_sigla` | — | sim |
| `cliente.endereco_cep` | `enderecos.cep` | formatar `00000-000` | sim |
| `cliente.ddd_celular` | `clientes.ddd_celular` | — | sim |
| `cliente.numero_celular` | `clientes.numero_celular` | formatar `00000-0000` | sim |
| `cliente.email` | `clientes.emails[0]` (jsonb array) | pega o primeiro email | sim |
| `acao.nome_empresa_pessoa` | `contrato_partes.nome_snapshot` filtrando `papel_contratual='parte_contraria'` | `Intl.ListFormat('pt-BR', {style:'long'})` | sim (só no template "Contrato") |
| `sistema.data_geracao` | `new Date()` | "16 de abril de 2026" (PT-BR extenso) | sim (auto) |
| `assinatura.assinatura_base64` | vazio no caminho A | — | não (excluído da detecção no caminho A) |

### 5.2 Data loader

```ts
async function carregarDadosContrato(contratoId: number) {
  const { data } = await supabase
    .from('contratos')
    .select(`
      id, tipo_contrato, segmento_id, cliente_id,
      cliente:clientes!cliente_id (
        id, tipo_pessoa, nome, cpf, rg, nacionalidade, estado_civil,
        ddd_celular, numero_celular, emails,
        endereco:enderecos!endereco_id (
          logradouro, numero, complemento, bairro,
          municipio, estado_sigla, cep
        )
      ),
      partes:contrato_partes (
        papel_contratual, nome_snapshot, cpf_cnpj_snapshot,
        ordem, tipo_entidade, entidade_id
      )
    `)
    .eq('id', contratoId)
    .single();
  return data;
}
```

### 5.3 Detecção de campos faltantes (dinâmica, não hardcoded)

Leitura direta do campo `campos` dos 4 templates. Para cada variável com `obrigatorio=true`, verifica se existe no `inputData` resolvido. Chaves excluídas: `assinatura.assinatura_base64` e `sistema.data_geracao`.

```ts
function detectarCamposFaltantes(
  inputData: Record<string, unknown>,
  templates: Template[],
  ignorarChaves = ['assinatura.assinatura_base64', 'sistema.data_geracao']
): CampoFaltante[] {
  const obrigatorias = new Set<string>();

  for (const template of templates) {
    for (const campo of template.campos) {
      if (!campo.obrigatorio) continue;
      const chaves = extrairVariaveisDoCampo(campo); // lida com texto_composto + texto
      for (const chave of chaves) {
        if (ignorarChaves.includes(chave)) continue;
        obrigatorias.add(chave);
      }
    }
  }

  return Array.from(obrigatorias)
    .filter(chave => !temValor(inputData, chave))
    .map(chave => ({
      chave,
      label: LABELS[chave] ?? chave,           // dicionário manual
      templates: templatesQueUsam(chave, templates)
    }));
}
```

### 5.4 Modal de campos faltantes

Layout:

```
┌─────────────────────────────────────────────────┐
│  Alguns dados do cliente estão incompletos      │
│                                                  │
│  ⚠ RG do cliente                                 │
│     usado em: Contrato, Procuração              │
│     [_____________________]                      │
│                                                  │
│  ⚠ Email do cliente                              │
│     usado em: todos os 4 documentos              │
│     [_____________________]                      │
│                                                  │
│  💡 Esses valores não serão salvos no cadastro  │
│     do cliente — só usados para gerar os PDFs   │
│     agora. Para persistir, edite o cadastro.    │
│                                                  │
│  [Cancelar]       [Gerar PDFs com esses dados]  │
└─────────────────────────────────────────────────┘
```

Valores preenchidos **não** atualizam `clientes`/`enderecos`. Viram apenas o parâmetro `overrides` da próxima chamada à API route. Decisão consistente com a diretriz de statelessness.

---

## 6. UI do caminho B (modal pós-envio)

```
┌──────────────────────────────────────────────────┐
│  ✓ Documentos prontos para assinatura            │
│                                                   │
│  4 documentos foram preparados e vinculados ao   │
│  contrato. Envie o link abaixo para o cliente:   │
│                                                   │
│  🔗 https://zattar.app/assinatura/a3f9-b2e1…      │
│     [ Copiar link ]                               │
│                                                   │
│  Expira em: 23 de abril de 2026                   │
│                                                   │
│  [Fechar]                                         │
└──────────────────────────────────────────────────┘
```

Sem integração de envio por email/WhatsApp no MVP. O advogado copia e envia pelo canal que preferir.

Quando a sessão existente ainda estiver ativa (não expirada), o segundo clique em "Enviar pra cliente assinar" **reaproveita** a sessão e mostra o link existente — evita poluição do banco com sessões duplicadas.

---

## 7. Tratamento de erros e edge cases

| Caso | Comportamento |
|---|---|
| Contrato sem `cliente_id` | Action retorna erro `"Contrato sem cliente vinculado"`. Botão desabilita com tooltip. |
| Cliente sem `endereco_id` | Todos os `endereco_*` viram faltantes → modal cobre. |
| Cliente PJ em contrato trabalhista | Erro explícito: `"Templates trabalhistas exigem cliente Pessoa Física. Altere o cadastro do cliente ou use outro tipo de contrato."` Botão desabilita com tooltip. |
| Contrato sem parte contrária | `acao.nome_empresa_pessoa` vira faltante → modal cobre. |
| Template PDF inacessível no storage | `template-pdf.service` lança → API route retorna 502 com mensagem `"Não foi possível carregar o template 'X'. Contate o administrador."` |
| Falha em 1 dos 4 merges | Aborta o ZIP inteiro. Não entrega download parcial silenciosamente. |
| Cliques múltiplos rápidos | Botão entra em `disabled + spinner` enquanto request está em flight. |
| Sessão ativa já existe (caminho B) | Reaproveita sessão existente em vez de criar nova. |
| RLS bloqueia acesso | Supabase retorna vazio → mesma mensagem de erro genérica ("Contrato sem cliente vinculado"). |

### 7.1 Rate limiting

API route `/api/contratos/[id]/pdfs-contratacao`: **10 requests / minuto / usuário**. O merge é CPU-intenso (4 pdf-lib em paralelo). Reusa o utilitário de rate limit introduzido no commit `d8db22816` adaptado para auth.

### 7.2 Observabilidade

Log estruturado:
- Início: `{contratoId, clienteId, segmentoId, qtdTemplates}`
- Sucesso: `{duracaoMs, tamanhoZipBytes}`
- Erro: `{tipo, mensagem, stack?}` (stack só em dev)

---

## 8. Testes

### 8.1 Unit (alto valor, baixo custo)

`mapeamento-contrato-input-data.test.ts`:
- Cliente PF completo → inputData completo
- Cliente sem RG → `RG do cliente` em camposFaltantes
- Cliente PJ → rejeição explícita
- 1 parte contrária → nome único
- 3 partes contrárias → "A, B e C" (Intl.ListFormat)
- `sistema.data_geracao` formatado PT-BR extenso
- `clientes.emails`: vazio → faltante; 1 item → primeiro; N itens → primeiro

### 8.2 Integration

`documentos-contratacao.service.test.ts`:
- Happy path: 4 templates mockados + merges mockados → ZIP com 4 entradas nomeadas
- Falha em 1 merge → propaga erro, ZIP não é gerado

### 8.3 E2E (Playwright, reusa padrão de `src/shared/assinatura-digital/tests/`)

`gerar-pdfs-contrato.spec.ts`:
- Contrato trabalhista completo → botão visível → download ZIP
- Contrato com cliente sem RG → modal aparece → preenche → ZIP baixa
- Contrato não-trabalhista → botão ausente

### 8.4 Não cobrir

- `template-pdf.service` (já coberto no código existente).
- UI pura do card (inspeção visual manual).

---

## 9. Performance esperada

- 4 merges pdf-lib em paralelo: **~800ms–2s** dependendo do tamanho dos templates.
- ZIP em memória: **~500KB–2MB** total.
- Response streaming: sem carregar ZIP inteiro no cliente antes do download.

Se em amostra real exceder 5s, mover para edge runtime ou job queue (fora do MVP).

---

## 10. Evoluções fora do MVP

Anotadas aqui para referência futura, não entram no escopo atual:

1. **Envio integrado por email/WhatsApp** no caminho B (reusa infra de email do projeto + `wa.me` para WhatsApp).
2. **Salvar overrides no cadastro do cliente** (botão secundário no modal de campos faltantes: "Persistir estes valores no cadastro").
3. **Templates PJ para contratos trabalhistas** (hoje os 4 templates exigem cliente PF).
4. **Extensão para outros segmentos** (civil, previdenciário, etc.) — o gate já está em lugar; basta cadastrar formulários para esses segmentos.
5. **Histórico de gerações** — hoje é efêmero; uma tabela opcional de `logs_geracao_pdf` se precisar auditar quando o advogado baixou os PDFs.

---

## 11. Integração com a UI existente

### 11.1 `contrato-documentos-card.tsx`

Hoje lista apenas `contrato_documentos` (tabela de documentos do contrato). Passa a listar também `assinatura_digital_documentos WHERE contrato_id = ?` com badge tipo **"Assinado digitalmente"** para diferenciar. Isso fecha o loop do caminho B: quando o cliente assina, os documentos aparecem automaticamente na aba de documentos do contrato.

### 11.2 `contrato-detalhes-client.tsx`

Renderiza o novo `<DocumentosContratacaoCard contrato={...} />` entre as seções existentes. O componente decide sozinho se aparece (baseado em `segmento_id` + existência de formulário).

---

## 12. Resumo

Esta feature ativa um FK que já existe há tempos mas nunca foi usado (`assinatura_digital_documentos.contrato_id`), e entrega dois valores distintos partindo do mesmo ponto:

1. **Rascunho efêmero** — baixa 4 PDFs preenchidos imediatamente, sem persistir nada. Útil para revisão interna, impressão e assinatura física.
2. **Fluxo formal** — cria documentos persistentes vinculados ao contrato e gera link de assinatura digital para o cliente.

O mapeamento contrato → inputData é 100% coberto pelos dados já armazenados, e o mapper puro isola a lógica de transformação para testes de alto valor. O merge de PDFs reutiliza integralmente o service compartilhado existente.
