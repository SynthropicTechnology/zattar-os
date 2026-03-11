## Context

O escritório atualmente coleta dados de entrevistas trabalhistas de forma desestruturada (caderno, WhatsApp, e-mail). Isso impede automação e causa perda de informações probatórias. O módulo de contratos (`src/features/contratos/`) já possui uma página de detalhe com 4 abas (Resumo, Financeiro, Documentos, Histórico) usando `AnimatedIconTabs`. O app utiliza JSONB extensivamente para dados flexíveis, React Hook Form + Zod para formulários, e já possui componentes de stepper multi-step (`FormStepLayout`, `DesktopStepper`).

**Estado atual:** Nenhuma estrutura de entrevista existe. O campo `observacoes` do contrato é usado para anotações livres.

**Stakeholders:** Advogados, paralegais, estagiários (operadores da entrevista), sistema de IA (consumidor futuro do payload).

## Goals / Non-Goals

**Goals:**
- Implementar uma ficha de entrevista trabalhista integrada ao contrato, acessível como nova aba
- Criar a trilha Trabalhista Clássica completa (Nó Zero + 4 módulos: Vínculo, Jornada, Saúde/Ambiente, Ruptura)
- Permitir save & continue (o operador pode pausar e retomar a entrevista)
- Suportar upload de anexos probatórios contextualizados por módulo/nó
- Gerar payload JSON estruturado pronto para consumo por IA

**Non-Goals:**
- Implementar trilhas Gig Economy ou Pejotização (infraestrutura preparada, implementação futura)
- Geração automática de petição pela IA (fase 2)
- Formulário dinâmico configurável pelo admin (schemas hardcoded no MVP)
- Cálculos automáticos de verbas rescisórias ou horas extras
- Versionamento de respostas (histórico de alterações dentro da entrevista)

## Decisions

### D1: JSONB para respostas vs. tabelas normalizadas

**Decisão:** Usar coluna `respostas JSONB` na tabela principal para armazenar todas as respostas dos módulos.

**Alternativas consideradas:**
- **Tabelas normalizadas** (uma tabela por módulo, uma coluna por campo): Rígido, difícil de evoluir quando novos campos são adicionados ou trilhas diferentes têm estruturas diferentes.
- **Tabela genérica key-value** (`entrevista_id, campo, valor`): Flexível demais, difícil de validar, consultas complexas.

**Rationale:** Cada trilha (clássico, gig, pejotização) tem módulos e campos diferentes. JSONB permite que cada trilha tenha sua própria estrutura validada no app-level via Zod, mantendo flexibilidade no banco. O app já usa esse padrão com sucesso em `contratos.dados_anteriores`, `contrato_status_historico.metadata` e `assinatura_digital_formularios.form_schema`.

### D2: Relação 1:1 contrato ↔ entrevista

**Decisão:** Uma entrevista por contrato, com constraint `UNIQUE(contrato_id)`.

**Alternativas consideradas:**
- **1:N** (múltiplas entrevistas por contrato): Necessário se um contrato tiver múltiplas partes reclamantes com entrevistas separadas.

**Rationale:** No modelo atual, cada contrato tem um `cliente_id` principal (o reclamante). Se houver múltiplos reclamantes, já são contratos separados. 1:1 simplifica o fluxo e a UI. Se no futuro precisarmos de 1:N, basta remover o UNIQUE.

### D3: Auto-save por módulo (não debounced em tempo real)

**Decisão:** Salvar progresso quando o operador avança para o próximo módulo (clica "Próximo") ou clica "Salvar Rascunho" explicitamente.

**Alternativas consideradas:**
- **Debounced real-time** (salva a cada N segundos): Mais requests, complexidade de conflito, UX confusa.
- **Salvar só no final**: Risco de perder tudo se fechar o browser.

**Rationale:** Equilíbrio entre segurança dos dados e simplicidade. O operador tem feedback claro de quando os dados foram salvos. O campo `modulo_atual` rastreia onde o operador parou para retomar depois.

### D4: Schemas hardcoded no frontend vs. schema dinâmico no banco

**Decisão:** Schemas dos módulos definidos como tipos TypeScript/Zod no código, não armazenados no banco.

**Alternativas consideradas:**
- **Schema no banco** (como `DynamicFormRenderer` faz): Permite configuração pelo admin sem deploy.

**Rationale:** A trilha trabalhista clássica tem estrutura fixa baseada na legislação (CLT). Não faz sentido permitir que um admin altere perguntas sobre CTPS ou FGTS. Schemas hardcoded são mais rápidos de implementar, com tipagem completa e validação em compile-time. Se no futuro quisermos permitir customização de perguntas complementares, podemos adicionar um campo `perguntas_extras JSONB`.

### D5: Feature module independente vs. sub-módulo de contratos

**Decisão:** Criar `src/features/entrevistas-trabalhistas/` como feature module separado.

**Alternativas consideradas:**
- **Sub-módulo dentro de contratos** (`src/features/contratos/entrevistas/`): Mais acoplado.

**Rationale:** A entrevista tem domínio próprio (schemas, repository, service, components) e pode ser referenciada por outros módulos no futuro (ex: módulo de IA para geração de petições). Separação clara de responsabilidades seguindo o padrão existente do projeto onde cada feature tem seu próprio diretório.

### D6: Nova aba inline na página de detalhe (não tela cheia)

**Decisão:** A entrevista é renderizada dentro de uma nova aba na página de detalhe do contrato.

**Alternativas consideradas:**
- **Tela cheia** (rota própria `/app/contratos/[id]/entrevista`): Mais espaço, mas perde contexto do contrato.

**Rationale:** Manter o header do contrato visível (cliente, status, responsável) dá contexto ao operador durante a entrevista. O wizard pode ocupar todo o espaço horizontal da aba. Se necessário, pode-se adicionar um botão "Expandir" que abre em fullscreen (enhancement futuro).

### D7: Estrutura JSONB das respostas

**Decisão:** O campo `respostas` segue a estrutura do payload proposto pelo usuário, organizado por módulos:

```typescript
interface RespostasClassico {
  vinculo: {
    ctps_assinada: 'sim_ok' | 'sim_atrasada' | 'nao_informal' | 'obrigado_mei';
    narrativa_subordinacao?: string; // condicional: só se informal/MEI
  };
  jornada: {
    controle_ponto: ('eletronico' | 'manual' | 'nenhum' | 'britanico')[];
    intervalo_concedido: boolean;
    minutos_intervalo_real?: number;
    horas_extras_pagas: boolean;
    banco_horas_compensado: boolean;
    narrativa_dia_tipico?: string;
  };
  saude_ambiente: {
    exposicao_riscos: boolean;
    tipos_risco?: ('ruido' | 'calor' | 'quimico' | 'biologico' | 'inflamavel' | 'eletricidade')[];
    descricao_risco?: string;
    assedio_moral: boolean;
    relato_assedio?: string;
    testemunhas_assedio?: string;
  };
  ruptura: {
    motivo: 'demissao_sem_justa_causa' | 'pedido_demissao' | 'justa_causa' | 'empresa_faliu' | 'rescisao_indireta';
    verbas_recebidas: ('tudo' | 'parcial_acordo' | 'nada' | 'fgts_nao_depositado')[];
  };
}
```

**Rationale:** Estrutura espelha os módulos da entrevista. Tipos union garantem validação. Campos condicionais são opcionais (`?`). Esta estrutura se converte diretamente no payload para IA sem transformação adicional.

## Risks / Trade-offs

### [Risco] JSONB sem schema enforcement no banco
→ **Mitigação:** Validação via Zod no app-level antes de persistir. Testes unitários para schemas. O banco aceita qualquer JSON, mas o app garante a estrutura.

### [Risco] Schemas hardcoded dificultam evolução rápida
→ **Mitigação:** Schemas são Zod com types — adicionar campos é trivial (PR + deploy). Para campos opcionais novos, o JSONB existente simplesmente não terá o campo (backward compatible).

### [Risco] Uploads de anexos podem crescer significativamente
→ **Mitigação:** Usar o mesmo padrão de upload para B2 já existente no projeto. Limite de tamanho por arquivo (ex: 10MB). Anexos são referências (URL), não blobs no banco.

### [Trade-off] 1:1 pode ser limitante para contratos com múltiplos reclamantes
→ **Aceitação:** No modelo atual, cada reclamante tem seu próprio contrato. Se isso mudar, migração é simples (remover UNIQUE constraint).

### [Trade-off] Tooltips para operador hardcoded no frontend
→ **Aceitação:** Textos de orientação jurídica ficam no código. É aceitável porque refletem a legislação (CLT) e não mudam frequentemente. Se precisar de customização, pode-se mover para um JSON de configuração.

## Migration Plan

### Deploy
1. **Migration SQL**: Criar enums + tabelas + indexes + RLS (uma migration)
2. **Backend**: Deploy do feature module (repository, service, actions) — sem impacto em funcionalidades existentes
3. **Frontend**: Deploy da nova aba — a aba simplesmente não aparece se não houver dados, sem breaking change

### Rollback
- Remover a aba do frontend (1 arquivo)
- Feature module pode permanecer sem impacto
- Tabelas podem ser mantidas ou dropadas sem afetar o restante do sistema (FK é do lado da entrevista)

## Open Questions

- Nenhuma questão aberta bloqueante. As decisões acima cobrem o escopo do MVP.
