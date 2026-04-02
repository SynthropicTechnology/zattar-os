# Regras de Negócio - Documentos e Arquivos

## Contexto

Módulo para gestão de documentos digitais e arquivos genéricos. Documentos são criados no editor Plate.js (texto rico), enquanto arquivos são uploads genéricos (PDFs, imagens, etc.). Gerencia upload, versionamento, compartilhamento, categorização e organização em pastas. Integra-se com Backblaze B2 para storage.

## Entidades Principais

- **Documento**: Documento de texto criado no editor Plate.js
- **Arquivo**: Upload genérico (PDF, imagens, Office, etc.) armazenado no Backblaze B2
- **Pasta**: Organização hierárquica de documentos e arquivos
- **VersaoDocumento**: Histórico de versões de um documento
- **Compartilhamento**: Registro de compartilhamento de documentos
- **Template**: Modelos de documentos reutilizáveis

## Tipos de Itens

### Documentos de Texto (Plate.js)

- Criados através do editor Plate.js
- Conteúdo armazenado como JSON (estrutura Plate)
- Suportam colaboração em tempo real
- Versionamento automático

### Arquivos Genéricos

- Qualquer tipo de arquivo (PDF, DOC, XLS, imagens, etc.)
- Upload direto para Backblaze B2
- Tamanho máximo: 50MB
- Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF, MP4, MP3, ZIP

## Regras de Validação

### Upload de Arquivo

- Tamanho máximo: 50MB por arquivo
- Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT
- Nome do arquivo: máximo 255 caracteres
- Caracteres especiais removidos automaticamente

### Campos Obrigatórios

- `nome`: Nome do documento
- `tipo_arquivo`: Extensão/MIME type
- `tamanho`: Tamanho em bytes
- `storage_path`: Caminho no Supabase Storage

### Pasta

- `nome`: Nome da pasta (único dentro do pai)
- `pasta_pai_id`: ID da pasta pai (null = raiz)
- Profundidade máxima: 10 níveis

## Regras de Negócio

### Organização por Processo

1. Cada processo tem uma pasta raiz automática
2. Estrutura padrão:
   - `/Petições`
   - `/Documentos do Cliente`
   - `/Decisões`
   - `/Comunicações`
3. Pastas adicionais criadas sob demanda

### Versionamento

1. Cada edição cria nova versão
2. Versões anteriores são mantidas
3. Restauração de versão anterior permitida
4. Comparação entre versões disponível

### Upload de Documento

1. Validar tipo e tamanho do arquivo
2. Gerar nome único no storage (UUID + extensão)
3. Upload para Supabase Storage
4. Criar registro com metadados
5. Extrair texto para indexação (PDFs)
6. Indexar para busca semântica

### Lixeira

1. Exclusão move para lixeira (soft delete)
2. Documentos ficam 30 dias na lixeira
3. Restauração disponível durante esse período
4. Exclusão permanente após 30 dias (job automático)

### Compartilhamento

1. Gerar link único com token
2. Definir prazo de expiração (opcional)
3. Definir senha de acesso (opcional)
4. Registrar acessos ao link
5. Notificar proprietário sobre acessos

## Categorias de Documento

- `peticao`: Petições judiciais
- `decisao`: Decisões e despachos
- `contrato`: Contratos
- `procuracao`: Procurações
- `comprovante`: Comprovantes diversos
- `comunicacao`: Comunicações
- `outro`: Outros tipos

## Fluxos Especiais

### Extração de Texto (OCR)

1. Para PDFs: extrair texto com pdfjs-dist
2. Para imagens: OCR quando disponível
3. Texto extraído usado para:
   - Busca textual
   - Indexação semântica
   - Preview de conteúdo

### Templates de Documento

1. Criar modelo com variáveis (Mustache)
2. Variáveis: `{{cliente_nome}}`, `{{processo_numero}}`, etc.
3. Gerar documento preenchido automaticamente
4. Formatos suportados: DOCX, PDF

### Assinatura Digital

1. Integração com módulo de assinatura
2. Tipos: assinatura eletrônica simples, ICP-Brasil
3. Múltiplos assinantes em sequência
4. Verificação de integridade após assinatura

### Download em Lote

1. Selecionar múltiplos documentos
2. Gerar arquivo ZIP
3. Manter estrutura de pastas
4. Link temporário para download

## Permissões de Acesso

### Níveis de Acesso

- `owner`: Proprietário (tudo)
- `editor`: Editar e excluir
- `viewer`: Apenas visualizar
- `commenter`: Visualizar e comentar

### Herança de Permissões

1. Documento herda permissões do processo
2. Pasta herda permissões da pasta pai
3. Permissões específicas sobrescrevem herança
4. Documentos sigilosos requerem permissão explícita

## Filtros Disponíveis

- **Tipo**: tipo_arquivo, categoria
- **Local**: pasta_id, processo_id
- **Período**: created_at (início/fim)
- **Status**: na_lixeira, compartilhado
- **Busca**: busca (nome, conteúdo extraído)

## Integração com Storage

### Supabase Storage

- Bucket: `documentos`
- Estrutura: `/{processo_id}/{pasta}/{uuid}.{ext}`
- URLs assinadas para acesso temporário
- Cache de 1 hora para downloads

### Políticas de Storage

1. Autenticação obrigatória para upload
2. Download via URLs assinadas
3. Exclusão apenas por proprietário/admin
4. Quota por escritório (configurável)

## Restrições de Acesso

- Documentos de processos em segredo de justiça herdam restrição
- Compartilhamento externo requer aprovação
- Download em lote limitado a 100 arquivos

## Integrações

- **Supabase Storage**: Armazenamento de arquivos
- **pdfjs-dist**: Extração de texto de PDFs
- **Sistema de IA**: Indexação para busca semântica
- **Assinatura Digital**: Assinatura de documentos
- **Templates**: Geração de documentos

## Revalidação de Cache

Após mutações, revalidar:

- `/documentos` - Lista de documentos
- `/documentos/[id]` - Detalhe do documento
- `/processos/[processoId]/documentos` - Documentos do processo
- `/pastas/[pastaId]` - Conteúdo da pasta
