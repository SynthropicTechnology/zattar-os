/**
 * Script manual para raspar o acervo geral do TST
 *
 * Fluxo:
 * 1. Busca credenciais do banco (Supabase)
 * 2. Busca config do tribunal TST
 * 3. Autentica no PJE do TST (SSO PDPJ + OTP)
 * 4. Raspa todos os processos do acervo geral (paginação automática)
 * 5. Busca timeline de cada processo
 * 6. Salva tudo em JSON local (NÃO persiste no banco)
 *
 * Uso:
 *   npx tsx scripts/captura/acervo-geral/raspar-tst-manual.ts
 */

// Carregar variáveis de ambiente ANTES de qualquer import
import { config } from 'dotenv';
import { resolve, join, dirname } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

// Mock server-only para permitir execução fora do Next.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require.cache[require.resolve('server-only')] = {
  id: 'server-only',
  filename: 'server-only',
  loaded: true,
  exports: {},
} as NodeModule;

import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { autenticarPJE, type AuthResult } from '@/features/captura/services/trt/trt-auth.service';
import { obterTodosProcessosAcervoGeral } from '@/features/captura/pje-trt/acervo-geral/obter-todos-processos';
import { obterTotalizadoresAcervoGeral } from '@/features/captura/pje-trt/acervo-geral/obter-totalizadores';
import { obterTimeline } from '@/features/captura/pje-trt/timeline/obter-timeline';
import { getTribunalConfig } from '@/features/captura/services/trt/config';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { CredenciaisTRT } from '@/features/captura/types/trt-types';
import type { Processo } from '@/features/captura/types/types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESULTS_DIR = join(__dirname, '..', '..', 'results', 'tst-acervo-geral');
const CREDENCIAL_ID = 49; // ID da credencial TST ativa
const DELAY_ENTRE_TIMELINES = 400; // ms entre cada busca de timeline

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function buscarCredenciais(): Promise<{ cpf: string; senha: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('credenciais')
    .select('usuario, senha, advogados(cpf)')
    .eq('id', CREDENCIAL_ID)
    .eq('active', true)
    .single();

  if (error || !data) {
    throw new Error(`Credencial ${CREDENCIAL_ID} não encontrada: ${error?.message}`);
  }

  // O CPF vem do advogado vinculado (usuario pode ser null)
  const advogado = data.advogados as unknown as { cpf: string } | null;
  const cpf = data.usuario || advogado?.cpf;

  if (!cpf || !data.senha) {
    throw new Error('CPF ou senha não encontrados na credencial');
  }

  return { cpf, senha: data.senha };
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

async function main() {
  const inicio = Date.now();
  let authResult: AuthResult | null = null;

  console.log('\n' + '='.repeat(80));
  console.log('🏛️  RASPAGEM MANUAL — ACERVO GERAL DO TST');
  console.log('='.repeat(80) + '\n');

  try {
    // ─────────────────────────────────────────────────────────
    // FASE 1: BUSCAR CREDENCIAIS E CONFIG DO TRIBUNAL
    // ─────────────────────────────────────────────────────────
    console.log('📋 Fase 1: Buscando credenciais e config do TST...');

    const credenciais = await buscarCredenciais();
    console.log(`   ✅ Credencial encontrada (CPF: ${credenciais.cpf.substring(0, 3)}...)`);

    const tribunalConfig = await getTribunalConfig('TST', 'tribunal_superior');
    console.log(`   ✅ Config TST: ${tribunalConfig.baseUrl}`);

    // ─────────────────────────────────────────────────────────
    // FASE 2: AUTENTICAÇÃO NO PJE
    // ─────────────────────────────────────────────────────────
    console.log('\n🔐 Fase 2: Autenticando no PJE do TST...');

    const credential: CredenciaisTRT = {
      cpf: credenciais.cpf,
      senha: credenciais.senha,
    };

    authResult = await autenticarPJE({
      credential,
      config: tribunalConfig,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`   ✅ Autenticado como: ${advogadoInfo.nome} (ID: ${advogadoInfo.idAdvogado})`);

    const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);

    // ─────────────────────────────────────────────────────────
    // FASE 3: RASPAR ACERVO GERAL
    // ─────────────────────────────────────────────────────────
    console.log('\n📡 Fase 3: Raspando acervo geral do TST...');

    // Totalizador para validação
    const totalizador = await obterTotalizadoresAcervoGeral(page, idAdvogado);
    if (totalizador) {
      console.log(`   📊 Totalizador: ${totalizador.quantidadeProcessos} processos esperados`);
    }

    // Buscar todos os processos (paginação automática)
    const processos = await obterTodosProcessosAcervoGeral(page, idAdvogado);
    console.log(`   ✅ ${processos.length} processos encontrados`);

    // Validar
    if (totalizador && processos.length !== totalizador.quantidadeProcessos) {
      console.warn(`   ⚠️ Divergência: esperados ${totalizador.quantidadeProcessos}, obtidos ${processos.length}`);
    }

    // ─────────────────────────────────────────────────────────
    // FASE 4: BUSCAR TIMELINES
    // ─────────────────────────────────────────────────────────
    console.log(`\n📜 Fase 4: Buscando timelines de ${processos.length} processos...`);

    const processosComTimeline: Array<{
      processo: Processo;
      timeline: unknown;
      timelineErro?: string;
    }> = [];

    // Extrair IDs únicos
    const idsUnicos = [...new Set(processos.map(p => p.id))];
    console.log(`   📋 ${idsUnicos.length} processos únicos`);

    for (let i = 0; i < processos.length; i++) {
      const processo = processos[i];

      // Log de progresso a cada 20 processos
      if (i === 0 || (i + 1) % 20 === 0 || i === processos.length - 1) {
        console.log(`   📊 Progresso: ${i + 1}/${processos.length}`);
      }

      let timeline: unknown = null;
      let timelineErro: string | undefined;

      try {
        timeline = await obterTimeline(page, String(processo.id), {
          somenteDocumentosAssinados: false,
          buscarMovimentos: true,
          buscarDocumentos: true,
        });
      } catch (e) {
        timelineErro = e instanceof Error ? e.message : String(e);
        console.warn(`   ⚠️ Erro na timeline do processo ${processo.id}: ${timelineErro}`);
      }

      processosComTimeline.push({
        processo,
        timeline,
        timelineErro,
      });

      // Rate limiting
      if (i < processos.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_ENTRE_TIMELINES));
      }
    }

    const timelinesOk = processosComTimeline.filter(p => p.timeline && !p.timelineErro).length;
    const timelinesErro = processosComTimeline.filter(p => p.timelineErro).length;
    console.log(`   ✅ Timelines: ${timelinesOk} ok, ${timelinesErro} erros`);

    // ─────────────────────────────────────────────────────────
    // FASE 5: SALVAR JSON LOCAL
    // ─────────────────────────────────────────────────────────
    console.log('\n💾 Fase 5: Salvando resultados em JSON...');

    await mkdir(RESULTS_DIR, { recursive: true });

    const ts = timestamp();
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

    // JSON completo (processos + timelines)
    const resultado = {
      metadata: {
        tribunal: 'TST',
        grau: 'tribunal_superior',
        origem: 'acervo_geral',
        advogado: advogadoInfo.nome,
        dataRaspagem: new Date().toISOString(),
        duracaoSegundos: parseFloat(duracao),
        totalProcessos: processos.length,
        timelinesCapturadas: timelinesOk,
        timelinesComErro: timelinesErro,
      },
      processos: processosComTimeline,
    };

    const jsonPath = join(RESULTS_DIR, `tst-acervo-geral-${ts}.json`);
    await writeFile(jsonPath, JSON.stringify(resultado, null, 2), 'utf-8');
    console.log(`   ✅ Salvo: ${jsonPath}`);

    // JSON somente processos (sem timeline, mais leve)
    const jsonProcessosPath = join(RESULTS_DIR, `tst-processos-${ts}.json`);
    await writeFile(jsonProcessosPath, JSON.stringify(processos, null, 2), 'utf-8');
    console.log(`   ✅ Salvo: ${jsonProcessosPath}`);

    // ─────────────────────────────────────────────────────────
    // RESUMO FINAL
    // ─────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(80));
    console.log('🏁 RESUMO DA RASPAGEM');
    console.log('='.repeat(80));
    console.log(`   Tribunal:          TST (Tribunal Superior do Trabalho)`);
    console.log(`   Processos:         ${processos.length}`);
    console.log(`   Timelines OK:      ${timelinesOk}`);
    console.log(`   Timelines Erro:    ${timelinesErro}`);
    console.log(`   Duração:           ${duracao} segundos`);
    console.log(`   JSON completo:     ${jsonPath}`);
    console.log(`   JSON processos:    ${jsonProcessosPath}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
    throw error;
  } finally {
    if (authResult?.browser) {
      console.log('🚪 Fechando browser...');
      await authResult.browser.close();
    }
  }
}

// Executar
main()
  .then(async () => {
    await new Promise(r => setTimeout(r, 500));
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Script falhou:', error);
    await new Promise(r => setTimeout(r, 500));
    process.exit(1);
  });
