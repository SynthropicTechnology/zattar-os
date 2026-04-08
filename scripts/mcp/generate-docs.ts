#!/usr/bin/env tsx

/**
 * Gerador de Documentação MCP
 *
 * Lê todas as tools registradas e gera documentação completa em Markdown
 */

import * as fs from 'fs';
import * as path from 'path';
import { listMcpTools } from '@/lib/mcp';
// import type { z } from 'zod';

interface ToolInfo {
  name: string;
  description: string;
  feature: string;
  requiresAuth: boolean;
  schema: any;
}

// Agrupa tools por módulo
function groupToolsByModule(tools: ToolInfo[]): Map<string, ToolInfo[]> {
  const grouped = new Map<string, ToolInfo[]>();

  for (const tool of tools) {
    const module = tool.feature || 'outros';
    if (!grouped.has(module)) {
      grouped.set(module, []);
    }
    grouped.get(module)!.push(tool);
  }

  return grouped;
}

// Converte schema Zod para tabela de parâmetros
function schemaToParamsTable(schema: any): string {
  if (!schema || !schema._def) {
    return '*Sem parâmetros*';
  }

  try {
    const shape = schema._def.shape?.() || schema._def.innerType?._def?.shape?.() || {};
    const params = Object.entries(shape);

    if (params.length === 0) {
      return '*Sem parâmetros*';
    }

    let table = '| Nome | Tipo | Obrigatório | Descrição |\n';
    table += '|------|------|-------------|-----------|\\n';

    for (const [key, value] of params) {
      const zodType: any = value;
      const typeName = getZodTypeName(zodType);
      const isOptional = zodType._def?.typeName === 'ZodOptional' || zodType.isOptional?.();
      const required = isOptional ? 'Não' : 'Sim';
      const description = zodType._def?.description || '-';

      table += `| \`${key}\` | ${typeName} | ${required} | ${description} |\\n`;
    }

    return table;
  } catch (_error) {
    return '*Erro ao processar schema*';
  }
}

// Extrai nome do tipo Zod
function getZodTypeName(zodType: any): string {
  if (!zodType || !zodType._def) return 'unknown';

  const typeName = zodType._def.typeName;

  switch (typeName) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodArray':
      return 'array';
    case 'ZodObject':
      return 'object';
    case 'ZodEnum':
      return 'enum';
    case 'ZodOptional':
      return getZodTypeName(zodType._def.innerType);
    case 'ZodNullable':
      return getZodTypeName(zodType._def.innerType) + ' | null';
    case 'ZodUnion':
      return 'union';
    default:
      return typeName.replace('Zod', '').toLowerCase();
  }
}

// Gera exemplo de uso JSON
function generateExample(toolName: string, schema: any): string {
  if (!schema || !schema._def) {
    return '```json\n{\n  "name": "' + toolName + '"\n}\n```';
  }

  try {
    const shape = schema._def.shape?.() || schema._def.innerType?._def?.shape?.() || {};
    const params = Object.entries(shape);

    if (params.length === 0) {
      return '```json\n{\n  "name": "' + toolName + '"\n}\n```';
    }

    let example = '```json\n{\n  "name": "' + toolName + '",\n  "arguments": {\n';

    const exampleValues: string[] = [];
    for (const [key, value] of params.slice(0, 3)) { // Primeiros 3 parâmetros
      const zodType: any = value;
      const typeName = getZodTypeName(zodType);
      const exampleValue = getExampleValue(key, typeName);
      exampleValues.push(`    "${key}": ${exampleValue}`);
    }

    example += exampleValues.join(',\n');
    example += '\n  }\n}\n```';

    return example;
  } catch (_error) {
    return '```json\n{\n  "name": "' + toolName + '"\n}\n```';
  }
}

// Gera valor de exemplo baseado no tipo
function getExampleValue(paramName: string, typeName: string): string {
  if (paramName.includes('cpf')) return '"12345678901"';
  if (paramName.includes('cnpj')) return '"12345678000190"';
  if (paramName.includes('email')) return '"usuario@exemplo.com"';
  if (paramName.includes('data') || paramName.includes('inicio') || paramName.includes('fim')) {
    return '"2025-01-01"';
  }
  if (paramName === 'limite') return '10';
  if (paramName === 'offset') return '0';

  switch (typeName) {
    case 'string':
      return '"exemplo"';
    case 'number':
      return '100';
    case 'boolean':
      return 'true';
    case 'array':
      return '[]';
    case 'object':
      return '{}';
    default:
      return '"valor"';
  }
}

// Mapeia features para nomes de módulos
function getModuleName(feature: string): string {
  const moduleNames: Record<string, string> = {
    processos: 'Processos',
    partes: 'Partes',
    contratos: 'Contratos',
    financeiro: 'Financeiro',
    chat: 'Chat',
    documentos: 'Documentos',
    expedientes: 'Expedientes',
    audiencias: 'Audiências',
    obrigacoes: 'Obrigações',
    rh: 'RH',
    dashboard: 'Dashboard',
    busca: 'Busca Semântica',
    captura: 'Captura',
    usuarios: 'Usuários',
    acervo: 'Acervo',
    assistentes: 'Assistentes',
    cargos: 'Cargos',
    assinatura: 'Assinatura Digital',
    outros: 'Outros',
  };

  return moduleNames[feature] || feature.charAt(0).toUpperCase() + feature.slice(1);
}

// Gera emoji para módulo
function getModuleEmoji(feature: string): string {
  const emojis: Record<string, string> = {
    processos: '📁',
    partes: '👥',
    contratos: '📄',
    financeiro: '💰',
    chat: '💬',
    documentos: '📑',
    expedientes: '📋',
    audiencias: '⚖️',
    obrigacoes: '📌',
    rh: '👔',
    dashboard: '📈',
    busca: '🔍',
    captura: '📥',
    usuarios: '👤',
    acervo: '📚',
    assistentes: '🤖',
    cargos: '💼',
    assinatura: '✍️',
    outros: '📦',
  };

  return emojis[feature] || '📦';
}

// Gera documentação completa
function generateDocumentation(): string {
  const tools = listMcpTools();
  const grouped = groupToolsByModule(tools);

  let doc = '# Referência Completa - Tools MCP Synthropic\n\n';

  // Visão Geral
  doc += '## Visão Geral\n\n';
  doc += `O Synthropic expõe **${tools.length} ferramentas MCP** organizadas em ${grouped.size} módulos funcionais. `;
  doc += 'Estas ferramentas permitem que agentes de IA interajam com o sistema de forma estruturada e segura.\\n\\n';

  // Índice Rápido
  doc += '## Índice Rápido\n\n';
  doc += '| Módulo | Tools | Descrição |\n';
  doc += '|--------|-------|-----------|\\n';

  const sortedModules = Array.from(grouped.entries()).sort((a, b) => {
    return b[1].length - a[1].length; // Ordena por número de tools (decrescente)
  });

  for (const [feature, moduleTools] of sortedModules) {
    const moduleName = getModuleName(feature);
    const emoji = getModuleEmoji(feature);
    const description = getModuleDescription(feature);
    doc += `| ${emoji} ${moduleName} | ${moduleTools.length} | ${description} |\\n`;
  }

  doc += '\n---\n\n';

  // Módulos Detalhados
  doc += '## Módulos\n\n';

  for (const [feature, moduleTools] of sortedModules) {
    const moduleName = getModuleName(feature);
    const emoji = getModuleEmoji(feature);

    doc += `### ${emoji} ${moduleName} (${moduleTools.length} tools)\n\n`;

    // Listar tools do módulo
    for (const tool of moduleTools) {
      doc += `#### \`${tool.name}\`\n\n`;
      doc += `**Descrição:** ${tool.description}\n\n`;
      doc += `**Autenticação:** ${tool.requiresAuth ? '✅ Obrigatória' : '❌ Não requerida'}\n\n`;
      doc += '**Parâmetros:**\n\n';
      doc += schemaToParamsTable(tool.schema) + '\n\n';
      doc += '**Exemplo:**\n\n';
      doc += generateExample(tool.name, tool.schema) + '\n\n';
      doc += '---\n\n';
    }
  }

  // Padrões de Uso
  doc += '## Padrões de Uso\n\n';

  doc += '### Autenticação\n\n';
  doc += 'Todas as tools com autenticação obrigatória requerem:\\n\\n';
  doc += '- Header `x-service-api-key` com API key válida, OU\\n';
  doc += '- Cookie de sessão autenticada\\n\\n';

  doc += '### Paginação\n\n';
  doc += 'Tools de listagem suportam `limite` e `offset`:\\n\\n';
  doc += '```json\n{\n  "limite": 20,\n  "offset": 40\n}\n```\n\n';

  doc += '### Tratamento de Erros\n\n';
  doc += 'Padrão de resposta:\\n\\n';
  doc += '**Sucesso:**\n```json\n{ "success": true, "data": {...} }\n```\n\n';
  doc += '**Erro:**\n```json\n{ "success": false, "error": "Mensagem descritiva" }\n```\n\n';

  doc += '### Rate Limiting\n\n';
  doc += '- **Anonymous:** 10 req/min\\n';
  doc += '- **Authenticated:** 100 req/min\\n';
  doc += '- **Service:** 1000 req/min\\n\\n';
  doc += 'Headers de resposta:\\n';
  doc += '- `X-RateLimit-Limit`\\n';
  doc += '- `X-RateLimit-Remaining`\\n';
  doc += '- `X-RateLimit-Reset`\\n\\n';

  // Tabela Comparativa
  doc += '## Tabela Comparativa de Tools\n\n';
  doc += '| Tool | Módulo | Auth | Uso Comum |\n';
  doc += '|------|--------|------|-----------|\\n';

  for (const [feature, moduleTools] of sortedModules) {
    const moduleName = getModuleName(feature);
    for (const tool of moduleTools.slice(0, 2)) { // Primeiras 2 de cada módulo
      const auth = tool.requiresAuth ? '✅' : '❌';
      const useCase = getCommonUseCase(tool.name);
      doc += `| \`${tool.name}\` | ${moduleName} | ${auth} | ${useCase} |\\n`;
    }
  }

  doc += '\n';

  // Workflows Comuns
  doc += '## Workflows Comuns\n\n';

  doc += '### 1. Buscar Processos de um Cliente\n\n';
  doc += '```typescript\n';
  doc += '// 1. Buscar cliente por CPF\n';
  doc += 'const cliente = await executeMcpTool(\'buscar_cliente_por_cpf\', {\n';
  doc += '  cpf: \'12345678901\'\n';
  doc += '});\n\n';
  doc += '// 2. Buscar processos do cliente\n';
  doc += 'const processos = await executeMcpTool(\'buscar_processos_por_cpf\', {\n';
  doc += '  cpf: \'12345678901\',\n';
  doc += '  limite: 50\n';
  doc += '});\n';
  doc += '```\n\n';

  doc += '### 2. Criar Lançamento Financeiro\n\n';
  doc += '```typescript\n';
  doc += '// 1. Listar plano de contas\n';
  doc += 'const contas = await executeMcpTool(\'listar_plano_contas\', {});\n\n';
  doc += '// 2. Criar lançamento\n';
  doc += 'const lancamento = await executeMcpTool(\'criar_lancamento\', {\n';
  doc += '  tipo: \'receita\',\n';
  doc += '  valor: 1500.00,\n';
  doc += '  conta_id: 10,\n';
  doc += '  descricao: \'Honorários - Processo 123\'\n';
  doc += '});\n\n';
  doc += '// 3. Confirmar lançamento\n';
  doc += 'await executeMcpTool(\'confirmar_lancamento\', {\n';
  doc += '  lancamento_id: lancamento.data.id\n';
  doc += '});\n';
  doc += '```\n\n';

  // Referências
  doc += '## Referências\n\n';
  doc += '- **Registry:** `src/lib/mcp/registry.ts`\\n';
  doc += '- **Server:** `src/lib/mcp/server.ts`\\n';
  doc += '- **API Endpoint:** `src/app/api/mcp/route.ts`\\n';
  doc += '- **Testes:** `scripts/mcp/test-tools.ts`\\n';
  doc += '- **Auditoria:** `docs/mcp-audit/`\\n';

  return doc;
}

// Descrições dos módulos
function getModuleDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    processos: 'Gestão de processos trabalhistas',
    partes: 'Clientes, partes contrárias, terceiros',
    contratos: 'Contratos e acordos',
    financeiro: 'Lançamentos, DRE, fluxo de caixa',
    chat: 'Mensagens e comunicação',
    documentos: 'Gestão documental',
    expedientes: 'Expedientes processuais',
    audiencias: 'Audiências e eventos',
    obrigacoes: 'Acordos e repasses',
    rh: 'Recursos humanos',
    dashboard: 'Métricas e indicadores',
    busca: 'Busca semântica',
    captura: 'Captura de dados CNJ',
    usuarios: 'Gestão de usuários',
    acervo: 'Acervo documental',
    assistentes: 'Assistentes de IA',
    cargos: 'Cargos e funções',
    assinatura: 'Assinatura digital',
    outros: 'Outras ferramentas',
  };

  return descriptions[feature] || 'Ferramentas diversas';
}

// Casos de uso comuns
function getCommonUseCase(toolName: string): string {
  const useCases: Record<string, string> = {
    listar_processos: 'Listar processos por TRT',
    buscar_cliente_por_cpf: 'Buscar cliente por CPF',
    listar_lancamentos: 'Listar lançamentos financeiros',
    listar_documentos: 'Listar documentos',
    listar_audiencias: 'Listar audiências futuras',
    gerar_dre: 'Gerar DRE por período',
    listar_usuarios: 'Listar usuários do sistema',
    buscar_semantica: 'Busca inteligente de documentos',
  };

  return useCases[toolName] || 'Uso geral';
}

// Executar
async function main() {
  console.log('📝 Gerando documentação MCP...\n');

  try {
    const documentation = generateDocumentation();
    const outputPath = path.join(process.cwd(), 'docs', 'mcp-tools-reference.md');

    // Criar diretório se não existir
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Salvar arquivo
    fs.writeFileSync(outputPath, documentation, 'utf-8');

    console.log(`✅ Documentação gerada com sucesso!`);
    console.log(`📄 Arquivo: ${outputPath}\n`);
  } catch (error) {
    console.error('❌ Erro ao gerar documentação:', error);
    process.exit(1);
  }
}

main();
