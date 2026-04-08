/**
 * Scripts de Armazenamento (Storage)
 * 
 * Scripts para configuração e gestão do Backblaze B2 (armazenamento de arquivos).
 * 
 * IMPORTANTE: Scripts de CONFIGURAÇÃO e MANUTENÇÃO.
 * Não são executados automaticamente.
 * 
 * @module scripts/storage
 */

/**
 * Scripts Disponíveis
 * ===================
 * 
 * 1. **configure-backblaze-bucket.ts**
 *    Configura bucket B2 com CORS e permissões
 * 
 * 2. **make-bucket-public.ts**
 *    Torna bucket público usando API B2 Native
 * 
 * 3. **test-backblaze-connection.ts**
 *    Testa conexão com Backblaze B2
 * 
 * 4. **test-n8n-upload.ts**
 *    Testa upload para Google Drive via webhook N8N
 * 
 * 5. **backblaze-public-access-instructions.js**
 *    Instruções para configurar acesso público
 * 
 * 
 * Pré-requisitos
 * ==============
 * 
 * Variáveis de ambiente (.env.local):
 * ```bash
 * # Backblaze B2 (S3-compatible)
 * B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
 * B2_REGION=us-west-000
 * B2_KEY_ID=sua-key-id
 * B2_APPLICATION_KEY=sua-application-key
 * B2_BUCKET=nome-do-bucket
 * ```
 * 
 * Opcional (N8N):
 * ```bash
 * N8N_WEBHOOK_URL=https://webhook.synthropic.app/webhook/drive
 * ```
 * 
 * 
 * Uso Detalhado
 * =============
 * 
 * 1. Configurar Bucket B2
 * -----------------------
 * 
 * ```bash
 * npx tsx scripts/storage/configure-backblaze-bucket.ts
 * ```
 * 
 * O que faz:
 * - Cria cliente S3 para B2
 * - Aplica regras CORS:
 *   - AllowedOrigins: * (qualquer origem)
 *   - AllowedMethods: GET, HEAD
 *   - AllowedHeaders: *
 *   - MaxAgeSeconds: 3600
 * - Expõe headers necessários (ETag, Content-Length, etc.)
 * 
 * Importante:
 * - API S3 não suporta alterar bucketType para "allPublic"
 * - Você precisa fazer isso manualmente no painel B2 ou usar API B2 Native
 * 
 * 
 * 2. Tornar Bucket Público
 * -------------------------
 * 
 * ```bash
 * npx tsx scripts/storage/make-bucket-public.ts
 * ```
 * 
 * O que faz:
 * - Usa API B2 Native (não S3)
 * - Autentica com B2_KEY_ID e B2_APPLICATION_KEY
 * - Altera bucketType para "allPublic"
 * - Permite downloads sem autenticação
 * 
 * Alternativa manual:
 * 1. Acessar https://secure.backblaze.com/b2_buckets.htm
 * 2. Selecionar bucket
 * 3. Clicar em "Bucket Settings"
 * 4. Alterar "Files in Bucket" para "Public"
 * 
 * 
 * 3. Testar Conexão
 * -----------------
 * 
 * ```bash
 * npx tsx scripts/storage/test-backblaze-connection.ts
 * ```
 * 
 * O que faz:
 * - Cria cliente S3
 * - Lista buckets disponíveis
 * - Testa upload de arquivo pequeno
 * - Testa download do arquivo
 * - Remove arquivo de teste
 * 
 * Útil para:
 * - Validar credenciais
 * - Verificar conectividade
 * - Testar permissões
 * 
 * 
 * 4. Testar Upload N8N
 * --------------------
 * 
 * ```bash
 * npx tsx scripts/storage/test-n8n-upload.ts
 * ```
 * 
 * O que faz:
 * - Pega PDF de scripts/results/
 * - Converte para base64
 * - Faz POST para webhook N8N
 * - N8N faz upload para Google Drive
 * 
 * Útil para:
 * - Testar integração com N8N
 * - Validar webhook
 * - Testar fluxo de upload para Drive
 * 
 * 
 * Fluxo Completo de Configuração
 * ===============================
 * 
 * 1. Criar bucket no Backblaze B2:
 *    - Acesse https://secure.backblaze.com/b2_buckets.htm
 *    - Clique em "Create a Bucket"
 *    - Configure nome e região
 *    - Copie credenciais (Key ID e Application Key)
 * 
 * 2. Configurar variáveis de ambiente:
 *    ```bash
 *    # .env.local
 *    B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
 *    B2_REGION=us-west-000
 *    B2_KEY_ID=...
 *    B2_APPLICATION_KEY=...
 *    B2_BUCKET=synthropic-documentos
 *    ```
 * 
 * 3. Testar conexão:
 *    ```bash
 *    npx tsx scripts/storage/test-backblaze-connection.ts
 *    ```
 * 
 * 4. Configurar CORS:
 *    ```bash
 *    npx tsx scripts/storage/configure-backblaze-bucket.ts
 *    ```
 * 
 * 5. Tornar público (se necessário):
 *    ```bash
 *    npx tsx scripts/storage/make-bucket-public.ts
 *    ```
 * 
 * 6. Configurar aplicação:
 *    - Atualizar serviço de storage em backend/storage/
 *    - Usar createClient() do backblaze-b2.service.ts
 * 
 * 
 * Casos de Uso
 * ============
 * 
 * Upload de Documentos
 * --------------------
 * 
 * App usa Backblaze B2 para:
 * - PDFs de processos capturados
 * - Documentos assinados digitalmente
 * - Anexos de expedientes
 * - Arquivos de audiências
 * 
 * Fluxo típico:
 * 1. App faz upload via backend/storage/backblaze-b2.service.ts
 * 2. Backblaze retorna URL pública
 * 3. App salva URL no banco (PostgreSQL)
 * 4. Frontend acessa URL diretamente (se público)
 * 5. Ou usa presigned URL (se privado)
 * 
 * 
 * Integração com N8N
 * ------------------
 * 
 * Para documentos que precisam ir para Google Drive:
 * 1. App faz upload para B2
 * 2. Webhook N8N é acionado
 * 3. N8N baixa de B2
 * 4. N8N faz upload para Google Drive
 * 5. N8N retorna link do Drive
 * 
 * 
 * Notas Importantes
 * =================
 * 
 * ⚠️ **Credenciais**
 * - NUNCA commite B2_KEY_ID ou B2_APPLICATION_KEY
 * - Use .env.local (gitignored)
 * - Rotacione credenciais periodicamente
 * 
 * ⚠️ **Custos**
 * - Backblaze cobra por armazenamento
 * - Cobra por largura de banda (egress)
 * - Downloads são gratuitos até 1GB/dia
 * - Monitore uso no painel B2
 * 
 * ⚠️ **Bucket Público vs Privado**
 * - Bucket público: qualquer um pode baixar
 * - Bucket privado: precisa autenticação
 * - Use bucket privado para dados sensíveis
 * - Use presigned URLs para acesso temporário
 * 
 * ⚠️ **CORS**
 * - CORS é necessário para acesso do navegador
 * - Sem CORS, downloads falham com erro de origem
 * - Configure CORS mesmo para buckets privados
 * 
 * 
 * Troubleshooting
 * ===============
 * 
 * Erro: "Access Denied"
 * → Verifique B2_KEY_ID e B2_APPLICATION_KEY
 * → Verifique permissões da Application Key
 * 
 * Erro: "CORS policy"
 * → Execute configure-backblaze-bucket.ts
 * → Verifique AllowedOrigins no CORS
 * 
 * Erro: "Bucket not found"
 * → Verifique B2_BUCKET no .env.local
 * → Verifique se bucket existe no painel B2
 * 
 * Erro: "Connection timeout"
 * → Verifique B2_ENDPOINT
 * → Verifique conectividade de rede
 * → Backblaze pode estar com problemas
 * 
 * 
 * Migração de Storage
 * ===================
 * 
 * Se migrar de outro provider (S3, GCS, etc.):
 * 
 * 1. Criar bucket no Backblaze B2
 * 2. Configurar credenciais
 * 3. Executar scripts de configuração
 * 4. Migrar arquivos existentes (script customizado)
 * 5. Atualizar URLs no banco de dados
 * 6. Testar acesso aos arquivos
 * 7. Desativar storage antigo
 * 
 * Ver: backend/storage/MIGRACAO_BACKBLAZE_B2.md
 * 
 * 
 * Referências
 * ===========
 * 
 * - Backblaze B2 Docs: https://www.backblaze.com/b2/docs/
 * - S3 Compatibility: https://www.backblaze.com/b2/docs/s3_compatible_api.html
 * - API B2 Native: https://www.backblaze.com/b2/docs/b2_update_bucket.html
 * - Serviço do projeto: backend/storage/backblaze-b2.service.ts
 * 
 * @see {@link ../../backend/storage} Serviços de storage
 * @see {@link ../../backend/storage/MIGRACAO_BACKBLAZE_B2.md} Guia de migração
 */

export { };
