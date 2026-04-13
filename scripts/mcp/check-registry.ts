#!/usr/bin/env tsx
/**
 * Script de Verificação do Registry MCP - ZattarOS
 *
 * Verifica o estado das ferramentas MCP registradas,
 * compara com módulos existentes, e identifica gaps.
 *
 * Suporta ambos os padrões de registro:
 * - Padrão service: tools chamam services diretamente
 * - Padrão action: tools chamam Server Actions via actionResultToMcp
 *
 * Uso:
 *   npm run mcp:check
 *   npm run mcp:check -- --verbose  # Mostrar detalhes por módulo
 *   npx tsx scripts/mcp/check-registry.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const MODULES_DIR = path.join(process.cwd(), 'src/app/(authenticated)');
const REGISTRIES_DIR = path.join(process.cwd(), 'src/lib/mcp/registries');
const REGISTRY_FILE = path.join(process.cwd(), 'src/lib/mcp/registry.ts');

const verbose = process.argv.includes('--verbose');

// Módulos intencionalmente minimais (sem MCP)
// Ref: docs/architecture/MINIMAL_MODULES.md
const MINIMAL_MODULES = new Set([
  'ajuda',          // Sistema de docs auto-descritivo
  'calculadoras',   // Cálculos puros client-side
  'comunica-cnj',   // Proxy de captura
  'configuracoes',  // Configurações internas do sistema
  'editor',         // Wrapper PlateEditor
  'pangea',         // FSD aninhado em feature/
  'perfil',         // Perfil do usuário (UI-only)
  'repasses',       // Proxy de obrigações
]);

interface ToolInfo {
  name: string;
  feature: string;
}

interface RegistryInfo {
  file: string;
  tools: ToolInfo[];
  pattern: 'service' | 'action' | 'mixed';
  importSources: string[];
}

interface ModuleInfo {
  name: string;
  hasActions: boolean;
  hasService: boolean;
  hasRepository: boolean;
  actionCount: number;
  hasRegistry: boolean;
  isMinimal: boolean;
}

/**
 * Escaneia registries e extrai informações de tools
 */
function scanRegistries(): Map<string, RegistryInfo> {
  const registries = new Map<string, RegistryInfo>();

  if (!fs.existsSync(REGISTRIES_DIR)) {
    console.warn('⚠️  Diretório de registries não encontrado');
    return registries;
  }

  const files = fs.readdirSync(REGISTRIES_DIR)
    .filter((f) => f.endsWith('-tools.ts'));

  for (const file of files) {
    const filePath = path.join(REGISTRIES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const registryName = file.replace('-tools.ts', '');

    // Extrair nomes de tools via registerMcpTool({ name: '...' })
    const tools: ToolInfo[] = [];
    const toolNameRegex = /registerMcpTool\(\s*\{[^}]*?name:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = toolNameRegex.exec(content)) !== null) {
      // Extrair feature do mesmo bloco
      const blockStart = content.lastIndexOf('registerMcpTool', match.index);
      const blockEnd = content.indexOf('handler:', match.index);
      const block = content.substring(blockStart, blockEnd > -1 ? blockEnd : match.index + 200);
      const featureMatch = block.match(/feature:\s*['"]([^'"]+)['"]/);

      tools.push({
        name: match[1],
        feature: featureMatch ? featureMatch[1] : registryName,
      });
    }

    // Detectar padrão (service vs action)
    // Suporta imports estáticos (from '...') e dinâmicos (await import('...'))
    const usesActions = /actionResultToMcp|await\s+action\w+/.test(content);
    const usesServices = /['"]@\/app\/\(authenticated\)\/[^'"]*\/service['"]/.test(content)
      || /['"]@\/app\/\(authenticated\)\/[^'"]*\/repository['"]/.test(content)
      || /['"]@\/app\/\(authenticated\)\/[^'"]*\/services\//.test(content)
      || /['"]@\/lib\/(?!safe-action|mcp)/.test(content);

    let pattern: 'service' | 'action' | 'mixed' = 'action';
    if (usesServices && usesActions) pattern = 'mixed';
    else if (usesServices && !usesActions) pattern = 'service';

    // Extrair fontes de import
    const importSources: string[] = [];
    const importRegex = /(?:import|from)\s+['"](@\/[^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      if (!match[1].includes('../') && !match[1].includes('./')) {
        importSources.push(match[1]);
      }
    }

    registries.set(registryName, {
      file,
      tools,
      pattern,
      importSources,
    });
  }

  return registries;
}

/**
 * Escaneia módulos e extrai informações
 */
function scanModules(): Map<string, ModuleInfo> {
  const modules = new Map<string, ModuleInfo>();

  const dirs = fs.readdirSync(MODULES_DIR).filter((f) => {
    try {
      return fs.statSync(path.join(MODULES_DIR, f)).isDirectory();
    } catch {
      return false;
    }
  });

  for (const dir of dirs) {
    const modulePath = path.join(MODULES_DIR, dir);
    const actionsDir = path.join(modulePath, 'actions');
    const hasActions = fs.existsSync(actionsDir);
    const hasService = fs.existsSync(path.join(modulePath, 'service.ts'));
    const hasRepository = fs.existsSync(path.join(modulePath, 'repository.ts'));

    // Contar actions exportadas
    let actionCount = 0;
    if (hasActions) {
      const actionFiles = fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'));
      for (const file of actionFiles) {
        const content = fs.readFileSync(path.join(actionsDir, file), 'utf-8');
        const fnMatches = content.match(/export\s+(?:async\s+)?function\s+action\w+/g) || [];
        const constMatches = content.match(/export\s+const\s+action\w+\s*=/g) || [];
        actionCount += fnMatches.length + constMatches.length;
      }
    }

    modules.set(dir, {
      name: dir,
      hasActions,
      hasService,
      hasRepository,
      actionCount,
      hasRegistry: false, // Será preenchido depois
      isMinimal: MINIMAL_MODULES.has(dir),
    });
  }

  return modules;
}

/**
 * Verifica se o registry.ts orquestra todas as registries
 */
function checkOrchestration(registries: Map<string, RegistryInfo>): string[] {
  const issues: string[] = [];

  if (!fs.existsSync(REGISTRY_FILE)) {
    issues.push('Arquivo registry.ts principal não encontrado');
    return issues;
  }

  const content = fs.readFileSync(REGISTRY_FILE, 'utf-8');

  // Extrair todas as funções de registro chamadas no registry.ts
  const calledFunctions = new Set<string>();
  const callRegex = /await\s+(register\w+Tools)\(\)/g;
  let callMatch;
  while ((callMatch = callRegex.exec(content)) !== null) {
    calledFunctions.add(callMatch[1]);
  }

  // Extrair todas as funções importadas do barrel
  const importedFunctions = new Set<string>();
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]\.\/registries['"]/;
  const importMatch = content.match(importRegex);
  if (importMatch) {
    importMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(fn => {
      importedFunctions.add(fn);
    });
  }

  // Verificar: cada registry file deve ter sua função no barrel index.ts
  const barrelPath = path.join(REGISTRIES_DIR, 'index.ts');
  const barrelContent = fs.existsSync(barrelPath) ? fs.readFileSync(barrelPath, 'utf-8') : '';

  for (const [name, info] of registries) {
    // Verificar se o arquivo aparece no barrel
    const fileRef = `./${name}-tools`;
    if (!barrelContent.includes(fileRef)) {
      issues.push(`Registry '${name}' (${info.file}) não exportado em registries/index.ts`);
      continue;
    }

    // Extrair o nome da função exportada do barrel
    const exportRegex = new RegExp(`export\\s*\\{\\s*(\\w+)\\s*\\}\\s*from\\s*['"]\\.\\/` + name.replace(/-/g, '\\-') + `-tools['"]`);
    const exportMatch = barrelContent.match(exportRegex);
    if (exportMatch) {
      const fnName = exportMatch[1];
      if (!calledFunctions.has(fnName)) {
        issues.push(`Registry '${name}' exporta ${fnName} mas NÃO é chamado em registry.ts`);
      }
    }
  }

  return issues;
}

/**
 * Execução principal
 */
function main(): void {
  console.log('🔍 Verificando Registry MCP do ZattarOS...\n');

  // Escanear registries e módulos
  const registries = scanRegistries();
  const modules = scanModules();

  // Mapear registries → módulos
  const registryFeatures = new Set<string>();
  let totalTools = 0;

  for (const [name, info] of registries) {
    totalTools += info.tools.length;
    registryFeatures.add(name);

    // Marcar módulo correspondente
    if (modules.has(name)) {
      modules.get(name)!.hasRegistry = true;
    }
    // Também marcar se a feature dos tools aponta para o módulo
    for (const tool of info.tools) {
      if (modules.has(tool.feature)) {
        modules.get(tool.feature)!.hasRegistry = true;
      }
    }
  }

  // Identificar módulos sem registry (excluindo minimais e cross-cutting registries)
  const modulesWithoutRegistry: ModuleInfo[] = [];
  for (const [, mod] of modules) {
    if (!mod.hasRegistry && !mod.isMinimal && mod.hasActions) {
      modulesWithoutRegistry.push(mod);
    }
  }

  // Verificar orquestração
  const orchestrationIssues = checkOrchestration(registries);

  // === OUTPUT ===
  console.log('═'.repeat(60));
  console.log('📊 RESULTADO DA VERIFICAÇÃO MCP');
  console.log('═'.repeat(60));
  console.log(`   Registries encontrados:   ${registries.size}`);
  console.log(`   Ferramentas MCP total:    ${totalTools}`);
  console.log(`   Módulos no app:           ${modules.size}`);
  console.log(`   Módulos com actions:      ${[...modules.values()].filter(m => m.hasActions).length}`);
  console.log(`   Módulos minimais:         ${[...modules.values()].filter(m => m.isMinimal).length}`);
  console.log('═'.repeat(60));

  if (verbose) {
    console.log('\n📋 REGISTRIES POR MÓDULO:\n');
    for (const [name, info] of [...registries.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const patternIcon = info.pattern === 'service' ? '🟢' : info.pattern === 'action' ? '🟡' : '🔵';
      console.log(`  ${patternIcon} ${name} (${info.tools.length} tools, padrão: ${info.pattern})`);
      for (const tool of info.tools) {
        console.log(`     - ${tool.name}`);
      }
    }
    console.log('\n  Legenda: 🟢 service (direto) | 🟡 action (wrapper) | 🔵 mixed\n');
  }

  // Reportar módulos sem registry
  if (modulesWithoutRegistry.length > 0) {
    console.log('\n⚠️  Módulos COM actions mas SEM registry MCP:\n');
    for (const mod of modulesWithoutRegistry.sort((a, b) => b.actionCount - a.actionCount)) {
      const layers = [];
      if (mod.hasService) layers.push('service');
      if (mod.hasRepository) layers.push('repository');
      if (mod.hasActions) layers.push(`${mod.actionCount} actions`);
      console.log(`   📦 ${mod.name} (${layers.join(', ')})`);
    }
    console.log('\n💡 Para adicionar: crie src/lib/mcp/registries/<modulo>-tools.ts');
    console.log('   e registre em src/lib/mcp/registries/index.ts + src/lib/mcp/registry.ts\n');
  }

  // Reportar problemas de orquestração
  if (orchestrationIssues.length > 0) {
    console.log('\n❌ Problemas de orquestração:\n');
    for (const issue of orchestrationIssues) {
      console.log(`   - ${issue}`);
    }
    console.log();
  }

  // Resultado final
  const hasIssues = orchestrationIssues.length > 0;
  if (hasIssues) {
    console.log('❌ Verificação falhou — corrija os problemas acima\n');
    process.exit(1);
  } else if (modulesWithoutRegistry.length > 0) {
    console.log(`⚠️  ${modulesWithoutRegistry.length} módulo(s) sem cobertura MCP (não bloqueante)\n`);
    process.exit(0); // Warning, não falha
  } else {
    console.log('✅ Todas as registries estão orquestradas e operacionais!\n');
    process.exit(0);
  }
}

main();
