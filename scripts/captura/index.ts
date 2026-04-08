/**
 * Scripts de Captura de Dados PJE/TRT
 * 
 * Este módulo contém scripts standalone para testar e executar capturas de dados
 * dos sistemas PJE (Processo Judicial Eletrônico) e TRT (Tribunal Regional do Trabalho).
 * 
 * IMPORTANTE: Estes são scripts de DESENVOLVIMENTO/TESTE apenas.
 * Não são usados pelo app em produção.
 * 
 * @module scripts/captura
 */

/**
 * Estrutura de Diretórios
 * =======================
 * 
 * captura/
 * ├── acervo-geral/       # Captura de processos do acervo geral
 * ├── arquivados/         # Captura de processos arquivados
 * ├── audiencias/         # Captura de audiências agendadas
 * ├── partes/             # Captura de partes dos processos
 * ├── pendentes/          # Captura de pendentes de manifestação
 * └── timeline/           # Captura de timeline e documentos
 * 
 * 
 * Características Comuns
 * ======================
 * 
 * Todos os scripts de captura:
 * ✅ Testam endpoints da API REST (/api/captura/trt/*)
 * ✅ Salvam resultados em scripts/results/{tipo}/
 * ✅ Suportam filtros (TRT, grau, limite)
 * ✅ Requerem autenticação via SERVICE_API_KEY
 * ✅ Geram relatórios detalhados em JSON
 * 
 * 
 * Pré-requisitos
 * ==============
 * 
 * Variáveis de ambiente necessárias (.env.local):
 * 
 * ```bash
 * # API
 * SERVICE_API_KEY=sua-chave-aqui
 * NEXT_PUBLIC_API_URL=http://localhost:3000
 * 
 * # Supabase (para persistência)
 * NEXT_PUBLIC_SUPABASE_URL=
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=
 * SUPABASE_SERVICE_ROLE_KEY=
 * ```
 * 
 * 
 * Uso Geral
 * =========
 * 
 * Formato padrão de execução:
 * ```bash
 * npx tsx scripts/captura/{tipo}/test-api-{tipo}.ts [opções]
 * ```
 * 
 * Opções comuns:
 * - `--trt TRTX`        - Filtra por TRT específico (ex: TRT3, TRT15)
 * - `--grau G`          - Filtra por grau (primeiro_grau, segundo_grau)
 * - `--limit N`         - Limita quantidade de processos
 * - `--verbose`         - Logs detalhados
 * 
 * 
 * Exemplos Práticos
 * =================
 * 
 * # 1. Capturar acervo geral de todos os TRTs
 * npx tsx scripts/captura/acervo-geral/test-api-acervo-geral.ts
 * 
 * # 2. Capturar audiências do TRT3
 * npx tsx scripts/captura/audiencias/test-api-audiencias.ts --trt TRT3
 * 
 * # 3. Capturar partes de um processo específico
 * npx tsx scripts/captura/partes/test-captura-partes.ts
 * 
 * # 4. Capturar timeline com documentos
 * npx tsx scripts/captura/timeline/test-api-timeline.ts
 * 
 * # 5. Capturar pendentes com limite
 * npx tsx scripts/captura/pendentes/test-api-pendentes-manifestacao.ts --limit 50
 * 
 * 
 * Resultados
 * ==========
 * 
 * Os scripts salvam resultados em:
 * ```
 * scripts/results/
 * ├── api-acervo-geral/
 * │   ├── trt1/
 * │   │   └── resultado-{timestamp}.json
 * │   ├── trt2/
 * │   └── resumo-geral.json
 * ├── api-audiencias/
 * ├── api-partes/
 * └── api-timeline/
 * ```
 * 
 * Formato típico de resultado:
 * ```json
 * {
 *   "timestamp": "2025-12-10T12:00:00.000Z",
 *   "trtCodigo": "TRT3",
 *   "grau": "primeiro_grau",
 *   "duracaoSegundos": 45.23,
 *   "resultado": {
 *     "success": true,
 *     "data": {
 *       "total": 1250,
 *       "processos": [...],
 *       "persistencia": {
 *         "total": 1250,
 *         "atualizados": 1200,
 *         "erros": 0
 *       }
 *     }
 *   }
 * }
 * ```
 * 
 * 
 * Fluxo de Captura
 * ================
 * 
 * 1. Script faz requisição HTTP POST para API
 * 2. API autentica no PJE usando credenciais armazenadas
 * 3. API busca dados do PJE via Puppeteer
 * 4. API persiste dados no PostgreSQL (Supabase)
 * 5. API salva payload bruto no Supabase (JSONB / captura_logs_brutos)
 * 6. Script recebe resposta com estatísticas
 * 7. Script salva resultado em arquivo JSON
 * 
 * 
 * Troubleshooting
 * ===============
 * 
 * Erro: "SERVICE_API_KEY não configurada"
 * → Configure SERVICE_API_KEY no .env.local
 * 
 * Erro: "Autenticação falhou"
 * → Verifique credenciais do PJE na tabela credenciais_pje
 * 
 * Erro: "Timeout"
 * → PJE pode estar lento, tente novamente ou aumente timeout
 * 
 * Erro: "connection failed"
 * → Verifique variáveis do Supabase/Redis e conectividade de rede
 * 
 * 
 * Notas de Desenvolvimento
 * ========================
 * 
 * - Scripts são independentes do app - não importam código de src/
 * - Usam serviços de backend/ para lógica de negócio
 * - Resultados são gitignored (scripts/results/ no .gitignore)
 * - Úteis para debug, validação e desenvolvimento de features
 * - Podem ser executados em CI/CD para testes de integração
 * 
 * 
 * Referências
 * ===========
 * 
 * - Documentação da API: /api/docs
 * - Arquitetura: docs/arquitetura-sistema.md
 * - Módulos de captura: backend/captura/
 * 
 * @see {@link https://synthropic.app/api/docs} Documentação da API
 * @see {@link ../README.md} README principal de scripts
 */

export { };
