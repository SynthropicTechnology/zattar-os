#!/usr/bin/env tsx
/**
 * Servidor MCP de Desenvolvimento - Synthropic
 *
 * Inicia o servidor MCP via stdio para testes locais.
 *
 * Uso:
 *   npm run mcp:dev
 *   npx tsx scripts/mcp/dev-server.ts
 */

import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

// Importar após carregar env
import { startMcpServerStdio, getMcpServerManager } from '../../src/lib/mcp/server';
import { registerAllTools } from '../../src/lib/mcp/registry';

async function main() {
  console.log('🚀 Iniciando servidor MCP de desenvolvimento...\n');

  // Registrar todas as ferramentas
  console.log('📦 Registrando ferramentas...');
  await registerAllTools();

  // Listar ferramentas disponíveis
  const manager = getMcpServerManager();
  const tools = manager.listTools();

  console.log(`\n📋 ${tools.length} ferramentas disponíveis:\n`);

  // Agrupar por feature
  const byFeature = new Map<string, typeof tools>();
  for (const tool of tools) {
    if (!byFeature.has(tool.feature)) {
      byFeature.set(tool.feature, []);
    }
    byFeature.get(tool.feature)!.push(tool);
  }

  for (const [feature, featureTools] of byFeature) {
    console.log(`  ${feature}:`);
    for (const tool of featureTools) {
      console.log(`    - ${tool.name}: ${tool.description.substring(0, 50)}...`);
    }
  }

  console.log('\n🔌 Conectando via stdio...');
  console.log('   Para testar, use um cliente MCP (ex: mcp-client, Claude Desktop)\n');

  // Iniciar servidor
  await startMcpServerStdio();
}

main().catch((error) => {
  console.error('❌ Erro ao iniciar servidor MCP:', error);
  process.exit(1);
});
