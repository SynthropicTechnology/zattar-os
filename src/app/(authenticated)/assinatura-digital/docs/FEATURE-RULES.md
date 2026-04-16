# Assinatura Digital - Regras de Negocio

## Entidades

- **Segmento**: Agrupamento de negócio (ex: Trabalhista, Civil). Campos: id, nome, slug, ativo.
- **Template**: Modelo de documento (PDF ou Markdown). Campos: id, template_uuid, nome, tipo_template, status, ativo, segmento_id, pdf_url, conteudo_markdown, campos.
- **Formulário**: Formulário dinâmico vinculado a segmento. Campos: id, nome, slug, segmento_id, ativo, form_schema.
- **Documento**: Documento enviado para assinatura. Campos: id, documento_uuid, titulo, status, pdf_original_url, pdf_final_url, hash_original_sha256, hash_final_sha256, selfie_habilitada.
- **Assinante**: Signatário de um documento. Campos: id, documento_id, assinante_tipo, status, token, public_link, dados_snapshot.
- **Assinatura (Formulário)**: Registro de assinatura via formulário. Campos: id, protocolo, cliente_id, formulario_id, template_id, status, assinatura_url, pdf_url.

## Regras de Validação

- CPF deve ter 11 dígitos e passar na validação de dígitos verificadores
- CNPJ deve ter 14 dígitos e passar na validação de dígitos verificadores
- Email deve seguir formato RFC 5322
- Telefone deve ter DDD + número (10 ou 11 dígitos)
- CEP deve ter 8 dígitos
- Slug de segmento deve ser único no sistema
- Template do tipo `pdf` exige `pdf_url` preenchido
- Template do tipo `markdown` exige `conteudo_markdown` preenchido
- Assinatura requer imagem base64 válida (PNG/JPG)
- Aceite de termos (`termos_aceite = true`) é obrigatório para assinar

## Conformidade Legal

### MP 2.200-2/2001 (Infraestrutura de Chaves Publicas Brasileira)

O modulo de assinatura digital segue as diretrizes da Medida Provisoria 2.200-2/2001 que institui a ICP-Brasil e estabelece:

1. **Autenticidade**: Verificacao da identidade do signatario atraves de:
   - CPF/CNPJ validado
   - Foto do signatario (quando necessario)
   - Device fingerprint
   - Geolocalizacao (opcional)

2. **Integridade**: Garantia de que o documento nao foi alterado atraves de:
   - Hash SHA-256 do documento original
   - Hash SHA-256 do documento final com manifesto
   - Auditoria de integridade disponivel

3. **Nao-Repudio**: Evidencias de que a assinatura foi realizada pelo signatario:
   - Timestamp da assinatura
   - IP do dispositivo
   - User-Agent do navegador
   - Fingerprint do dispositivo
   - Aceite explicito dos termos

## Fluxo de Assinatura

### Etapas Obrigatorias

1. **Identificacao do Cliente**: Selecao obrigatoria do cliente (cliente_id)
2. **Selecao de Segmento**: Escolha do segmento de negocio
3. **Selecao de Template**: Escolha do template (PDF ou Markdown)
4. **Selecao de Formulario**: Escolha do formulario associado
5. **Captura de Assinatura**: Imagem da assinatura manuscrita
6. **Aceite dos Termos**: Aceite obrigatorio com versao registrada

### Etapas Opcionais

- **Foto do Signatario**: Configuravel por formulario
- **Geolocalizacao**: Configuravel por formulario
- **Contrato ID**: Vínculo opcional com contrato

## Validacoes Obrigatorias

### Cliente
- Deve existir no sistema
- CPF/CNPJ deve ser valido

### Template
- Deve estar ativo
- Tipo deve ser PDF ou Markdown
- Conteudo deve estar preenchido (pdf_url ou conteudo_markdown)

### Formulario
- Deve estar ativo
- Deve pertencer ao segmento selecionado

### Assinatura
- Imagem obrigatoria em formato base64
- Deve ser uma imagem valida (PNG, JPG, etc.)

### Termos
- `termos_aceite` deve ser `true`
- `termos_aceite_versao` deve ser informada

## Integracao com Outros Modulos

### Partes
- Utiliza `actionListarClientesSugestoes` para busca de clientes
- Busca por CPF via `findClienteByCPF`
- Busca partes contrarias via `findParteContrariaByCPF`/`findParteContrariaByCNPJ`

### Contratos
- Campo `contrato_id` referencia o contrato associado
- Vínculo opcional com contratos do sistema

### AI/Indexacao
- Templates sao indexados automaticamente apos criacao
- Suporte a indexacao de PDFs e Markdown

## Seguranca

### Metadados de Seguranca
- IP do dispositivo
- User-Agent do navegador
- Device fingerprint com multiplos atributos:
  - Resolucao de tela
  - Timezone
  - Idioma
  - Plataforma
  - Canvas hash
  - WebGL hash

### Armazenamento
- PDFs assinados sao armazenados em storage seguro
- Hashes sao calculados e armazenados para auditoria
- Imagens de assinatura e foto sao armazenadas separadamente

## Componentes de UI

### Selects Especializados
- `SegmentoSelect`: Carrega segmentos ativos
- `TemplateSelect`: Carrega templates, filtra por segmento
- `FormularioSelect`: Carrega formularios, filtra por segmento
- `ClienteSelect`: Autocomplete de clientes com busca

### Navegacao
- `AssinaturaDigitalTabsContent`: Tabs unificadas (Fluxo, Templates, Formularios)
- URL params para persistencia da tab ativa

## Regras de Negócio

### Criação de Documento
1. Cliente deve existir no sistema (validação de `cliente_id`)
2. Template selecionado deve estar ativo
3. Formulário selecionado deve estar ativo e pertencer ao segmento
4. Hash SHA-256 é calculado para o documento original
5. Status inicial: pendente de assinatura

### Criação de Segmento
1. Nome deve ser único (verificação via slug)
2. Slug é gerado automaticamente a partir do nome (normalizado, kebab-case)
3. Segmento duplicado (mesmo slug) é rejeitado

### Criação de Template
1. Se tipo é `pdf`, campo `pdf_url` é obrigatório
2. Se tipo é `markdown`, campo `conteudo_markdown` é obrigatório
3. Templates são indexados automaticamente para busca semântica após criação

### Atualização de Segmento
1. Se nome for alterado, novo slug é gerado
2. Verificação de unicidade do novo slug (excluindo o próprio registro)

### Processamento de Templates Markdown
1. Variáveis são interpoladas via Mustache.js
2. Template deve ser do tipo `markdown` com conteúdo preenchido
3. PDF é gerado a partir do Markdown renderizado via pdf-lib

### Assinatura de Documento
1. Imagem da assinatura é obrigatória (base64)
2. Aceite dos termos é obrigatório (`termos_aceite = true`)
3. Versão dos termos deve ser registrada
4. Metadados de segurança são capturados (IP, User-Agent, fingerprint, geolocalização)
5. Hash SHA-256 do documento final com manifesto é calculado

## Filtros Disponíveis

### Templates
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `segmento_id` | number | Filtrar por segmento |
| `tipo_template` | enum | Tipo: `pdf` ou `markdown` |
| `ativo` | boolean | Filtrar por status ativo/inativo |
| `status` | string | Status do template |

### Segmentos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ativo` | boolean | Filtrar por status ativo/inativo |

### Documentos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cliente_id` | number | Filtrar por cliente |
| `template_id` | number | Filtrar por template |
| `status` | string | Status do documento |

## Revalidação de Cache
Após mutações, revalidar:
- `/app/assinatura-digital/templates` — Lista de templates
- `/app/assinatura-digital/templates/[id]` — Detalhe do template
- `/app/assinatura-digital/segmentos` — Lista de segmentos
- `/app/assinatura-digital/documentos` — Lista de documentos
- `/app/assinatura-digital/documentos/[uuid]` — Detalhe do documento

## Boas Práticas

1. **Sempre validar dados no backend**: Não confiar apenas em validação de frontend
2. **Registrar auditoria**: Toda assinatura deve ter trail de auditoria completo
3. **Usar componentes especializados**: Preferir selects específicos aos inputs de ID
4. **Vínculo com contrato**: Campo `contrato_id` para referenciar o contrato associado
5. **Tratar erros graciosamente**: Mostrar mensagens claras ao usuário
