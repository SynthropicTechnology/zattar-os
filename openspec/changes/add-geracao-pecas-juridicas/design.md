# Design: Geração de Peças Jurídicas

## Context

O sistema Synthropic gerencia contratos jurídicos que frequentemente resultam no ajuizamento de ações. A primeira peça necessária é a petição inicial, que requer dados de qualificação completa das partes (cliente e parte contrária). Atualmente não existe automação para gerar documentos jurídicos a partir de dados do sistema.

### Stakeholders
- Advogados: Criam modelos e geram peças
- Assistentes: Utilizam modelos pré-configurados
- Clientes: Beneficiários indiretos (documentos mais precisos)

### Constraints
- Deve integrar com editor Plate.js existente
- Deve reutilizar exportação DOCX/PDF existente
- Placeholders devem ser intuitivos para advogados não-técnicos
- Performance: geração deve ser < 2s

## Goals / Non-Goals

### Goals
- Automatizar geração de petições iniciais a partir de contratos
- Sistema de placeholders flexível e extensível
- Vincular documentos gerados aos contratos de origem
- Interface intuitiva para criação de modelos

### Non-Goals
- Geração automática de peças sem intervenção humana
- IA para redação de peças (fora do escopo inicial)
- Integração com sistemas externos (PJE) para protocolo
- Assinatura digital de documentos

## Decisions

### 1. Sistema de Placeholders Indexados

**Decision**: Usar formato `{{entidade_indice.campo}}` (ex: `{{autor_1.nome}}`, `{{reu_2.cpf}}`)

**Rationale**:
- Contratos podem ter múltiplos autores e réus
- Advogados precisam controlar ordem e formatação individual
- Compatível com Plate.js (texto simples que é substituído)

**Alternatives considered**:
- Blocos iterativos (`{{#each autor}}`) - rejeitado: muito técnico para usuários
- Lista automática (`{{autores_qualificacao}}`) - rejeitado: pouca flexibilidade

### 2. Placeholders Disponíveis

```typescript
// Estrutura base de placeholders
const PLACEHOLDERS = {
  // Identificação do contrato
  contrato: {
    id: '{{contrato.id}}',
    tipo: '{{contrato.tipo}}',
    data_contratacao: '{{contrato.data_contratacao}}',
  },

  // Autores (clientes) - indexados de 1 a N
  autor: {
    // Pessoa Física
    nome: '{{autor_N.nome}}',
    cpf: '{{autor_N.cpf}}',
    cpf_formatado: '{{autor_N.cpf_formatado}}', // XXX.XXX.XXX-XX
    rg: '{{autor_N.rg}}',
    nacionalidade: '{{autor_N.nacionalidade}}',
    estado_civil: '{{autor_N.estado_civil}}',
    profissao: '{{autor_N.profissao}}',
    data_nascimento: '{{autor_N.data_nascimento}}',
    data_nascimento_extenso: '{{autor_N.data_nascimento_extenso}}',
    nome_mae: '{{autor_N.nome_mae}}',

    // Pessoa Jurídica
    cnpj: '{{autor_N.cnpj}}',
    cnpj_formatado: '{{autor_N.cnpj_formatado}}',
    razao_social: '{{autor_N.razao_social}}',
    nome_fantasia: '{{autor_N.nome_fantasia}}',
    inscricao_estadual: '{{autor_N.inscricao_estadual}}',

    // Endereço
    endereco_completo: '{{autor_N.endereco_completo}}',
    logradouro: '{{autor_N.logradouro}}',
    numero: '{{autor_N.numero}}',
    complemento: '{{autor_N.complemento}}',
    bairro: '{{autor_N.bairro}}',
    cidade: '{{autor_N.cidade}}',
    estado: '{{autor_N.estado}}',
    cep: '{{autor_N.cep}}',
    cep_formatado: '{{autor_N.cep_formatado}}',

    // Contato
    email: '{{autor_N.email}}',
    telefone: '{{autor_N.telefone}}',
    celular: '{{autor_N.celular}}',
  },

  // Réus (partes contrárias) - mesma estrutura, indexados de 1 a N
  reu: {
    // ... mesmos campos que autor
  },

  // Metadados
  meta: {
    data_atual: '{{meta.data_atual}}',
    data_atual_extenso: '{{meta.data_atual_extenso}}',
    advogado_responsavel: '{{meta.advogado_responsavel}}',
    oab_advogado: '{{meta.oab_advogado}}',
  }
};
```

### 3. Entidade Separada para Modelos

**Decision**: Criar tabela `pecas_modelos` separada de `templates`

**Rationale**:
- Campos específicos: `tipo_peca`, `entidade_vinculada`, `placeholders_definidos`
- Validação específica (placeholders válidos)
- Workflow diferente (geração vinculada vs criação livre)
- Categorização jurídica específica

**Schema**:
```sql
CREATE TABLE pecas_modelos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  conteudo JSONB NOT NULL, -- Plate.js Value
  tipo_peca tipo_peca_enum NOT NULL,
  entidade_vinculada entidade_vinculada_enum DEFAULT 'contrato',
  placeholders_definidos JSONB, -- Lista de placeholders usados
  categoria VARCHAR(100),
  visibilidade visibilidade_enum DEFAULT 'privado',
  ativo BOOLEAN DEFAULT true,
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE tipo_peca_enum AS ENUM (
  'peticao_inicial',
  'contestacao',
  'recurso_ordinario',
  'agravo',
  'embargos_declaracao',
  'manifestacao',
  'parecer',
  'contrato_honorarios',
  'procuracao',
  'outro'
);

CREATE TYPE entidade_vinculada_enum AS ENUM (
  'contrato',
  'processo',
  'cliente'
);
```

### 4. Vinculação Contrato-Documento

**Decision**: Nova tabela `contrato_documentos` para rastrear peças geradas

**Rationale**:
- Permite listar todas as peças de um contrato
- Mantém referência ao modelo usado (para re-geração)
- Separa vínculo de propriedade (documento pode ser compartilhado)

**Schema**:
```sql
CREATE TABLE contrato_documentos (
  id SERIAL PRIMARY KEY,
  contrato_id INTEGER NOT NULL REFERENCES contratos(id),
  documento_id INTEGER NOT NULL REFERENCES documentos(id),
  tipo_documento tipo_peca_enum,
  gerado_de_modelo_id INTEGER REFERENCES pecas_modelos(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contrato_id, documento_id)
);
```

### 5. Engine de Substituição

**Decision**: Engine simples com regex, sem templating engine externa

**Rationale**:
- Placeholders são texto simples no Plate.js (nodes de texto)
- Substituição é straightforward: find/replace no JSON
- Não precisa de lógica condicional (por enquanto)
- Evita dependência externa

**Algorithm**:
```typescript
function substituirPlaceholders(
  conteudo: PlateValue,
  dados: DadosSubstituicao
): PlateValue {
  // 1. Serializar Plate.js para string
  const jsonStr = JSON.stringify(conteudo);

  // 2. Encontrar todos os placeholders
  const placeholderRegex = /\{\{(\w+)_(\d+)\.(\w+)\}\}/g;
  // ou formato simples: /\{\{(\w+)\.(\w+)\}\}/g

  // 3. Substituir cada placeholder pelo valor
  const resultado = jsonStr.replace(placeholderRegex, (match, entidade, indice, campo) => {
    const valor = dados[entidade]?.[indice]?.[campo];
    return valor ?? match; // mantém placeholder se não encontrar
  });

  // 4. Deserializar de volta para PlateValue
  return JSON.parse(resultado);
}
```

## Risks / Trade-offs

### Risk: Placeholders inválidos no modelo
**Mitigation**: Validação ao salvar modelo, lista de placeholders disponíveis na UI

### Risk: Dados incompletos no contrato
**Mitigation**: Preview antes de gerar, indicação visual de dados faltantes

### Risk: Performance com muitas partes
**Mitigation**: Limite de 10 partes por polo, lazy loading de dados

### Trade-off: Simplicidade vs Flexibilidade
- Escolhemos placeholders simples (sem lógica condicional)
- Usuários avançados podem editar documento após geração
- Futuro: adicionar condicionais se demanda justificar

## Migration Plan

1. **Fase 1**: Schema e backend (sem UI)
2. **Fase 2**: Página de gestão de modelos
3. **Fase 3**: Integração na página de contratos
4. **Fase 4**: Melhorias (preview, validação, categorias)

### Rollback
- Novas tabelas podem ser removidas sem impacto
- Documentos gerados são documentos normais (não há lock-in)

## Open Questions

1. **Formatação de qualificação completa**: Devemos ter um placeholder especial `{{autor_N.qualificacao_completa}}` que gera o texto formatado automaticamente ("FULANO, brasileiro, solteiro...")?
   - Resposta do usuário: Blocos separados são preferidos, mas podemos adicionar qualificação completa como conveniência

2. **Limite de partes**: Qual o número máximo de autores/réus suportado?
   - Sugestão: 10 por polo (total 20 partes)

3. **Re-geração**: Se o modelo for atualizado, documentos já gerados devem ser atualizados?
   - Sugestão: Não, documento gerado é independente. Usuário pode re-gerar manualmente.
