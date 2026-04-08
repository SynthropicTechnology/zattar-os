#!/usr/bin/env npx tsx
/**
 * Script de Validacao Arquitetural para Synthropic
 *
 * Valida conformidade com Feature-Sliced Design (FSD):
 * - Nenhum arquivo em src/app/actions/ (exceto API routes)
 * - Limite de 800 linhas por arquivo
 * - Nenhum import de Supabase em componentes
 * - Actions devem usar safe-action wrapper
 * - Features devem ter estrutura minima
 *
 * @usage npx tsx scripts/validate-architecture.ts [--strict] [--fix]
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// =============================================================================
// CONFIGURACAO
// =============================================================================

const ROOT_DIR = process.cwd();
const MAX_FILE_LINES = 800;
const STRICT_MODE = process.argv.includes('--strict');

interface ValidationError {
  rule: string;
  file: string;
  message: string;
  severity: 'error' | 'warning';
}

const errors: ValidationError[] = [];
const warnings: ValidationError[] = [];

function addIssue(issue: ValidationError) {
  if (issue.severity === 'error') {
    errors.push(issue);
  } else {
    warnings.push(issue);
  }
}

// =============================================================================
// VALIDACOES
// =============================================================================

// Regra 1: Nenhum arquivo em src/app/actions/
// Server Actions devem estar em src/features/*/actions/
async function validateNoLegacyActions() {
  const legacyActions = await glob('src/app/actions/**/*.ts', { cwd: ROOT_DIR });

  for (const file of legacyActions) {
    addIssue({
      rule: 'no-legacy-actions',
      file,
      message: 'Server Action em local legado. Mover para src/features/{feature}/actions/',
      severity: 'error',
    });
  }
}

// Regra 2: Limite de linhas por arquivo
// Arquivos nao devem exceder MAX_FILE_LINES linhas
async function validateMaxFileLines() {
  const excludePatterns = [
    '**/*.generated.ts',
    '**/database.types.ts',
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
  ];

  const tsFiles = await glob('src/**/*.ts', {
    cwd: ROOT_DIR,
    ignore: excludePatterns,
  });

  const tsxFiles = await glob('src/**/*.tsx', {
    cwd: ROOT_DIR,
    ignore: excludePatterns,
  });

  const allFiles = [...tsFiles, ...tsxFiles];

  for (const file of allFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lineCount = content.split('\n').length;

    if (lineCount > MAX_FILE_LINES) {
      addIssue({
        rule: 'max-file-lines',
        file,
        message: `Arquivo com ${lineCount} linhas (limite: ${MAX_FILE_LINES}). Considerar decomposicao.`,
        severity: STRICT_MODE ? 'error' : 'warning',
      });
    }
  }
}

// Regra 3: Nenhum import de Supabase em componentes
// Componentes React nao devem importar createClient diretamente
async function validateNoSupabaseInComponents() {
  const componentFiles = await glob('src/features/*/components/**/*.tsx', { cwd: ROOT_DIR });

  const forbiddenImports = [
    '@/lib/supabase/client',
    '@/lib/supabase/server-client',
    'createClient',
    'createServerClient',
  ];

  for (const file of componentFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    for (const forbidden of forbiddenImports) {
      if (content.includes(forbidden)) {
        // Ignora se e um comentario
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes(forbidden) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            addIssue({
              rule: 'no-supabase-in-components',
              file,
              message: `Componente importa Supabase diretamente (${forbidden}). Use Server Action ou hook.`,
              severity: 'error',
            });
            break;
          }
        }
      }
    }
  }
}

// Regra 4: Actions devem usar safe-action
// Server Actions em features devem importar de @/lib/safe-action
async function validateSafeActionUsage() {
  const actionFiles = await glob('src/features/*/actions/**/*.ts', { cwd: ROOT_DIR });

  for (const file of actionFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Verifica se o arquivo tem 'use server' (e uma action)
    if (!content.includes("'use server'") && !content.includes('"use server"')) {
      continue; // Nao e uma action, pular
    }

    // Verifica se usa safe-action (warning, nao error, para transicao gradual)
    const usesSafeAction = content.includes('@/lib/safe-action') ||
                           content.includes('authenticatedAction') ||
                           content.includes('authenticatedFormAction') ||
                           content.includes('publicAction') ||
                           content.includes('publicFormAction');

    if (!usesSafeAction) {
      addIssue({
        rule: 'actions-use-safe-action',
        file,
        message: 'Action nao usa wrapper safe-action. Considerar migrar para authenticatedAction/publicAction.',
        severity: STRICT_MODE ? 'error' : 'warning',
      });
    }
  }
}

// Regra 5: Features devem ter estrutura minima
// Cada feature deve ter pelo menos index.ts
async function validateFeatureStructure() {
  const featuresDir = path.join(ROOT_DIR, 'src/features');

  if (!fs.existsSync(featuresDir)) {
    return;
  }

  const features = fs.readdirSync(featuresDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const feature of features) {
    const featurePath = path.join(featuresDir, feature);
    const indexPath = path.join(featurePath, 'index.ts');

    if (!fs.existsSync(indexPath)) {
      addIssue({
        rule: 'feature-structure',
        file: `src/features/${feature}`,
        message: 'Feature sem index.ts. Criar barrel export.',
        severity: 'error',
      });
    }
  }
}

// Regra 6: Nenhum reexport entre features (exceto barrel interno)
// Nota: Cross-imports entre features sao permitidos em casos especiais (facades)
async function validateNoFeatureCrossImports() {
  const indexFiles = await glob('src/features/*/index.ts', { cwd: ROOT_DIR });

  // Facades conhecidas que podem ter cross-imports
  const allowedCrossImports: Record<string, string[]> = {
    'repasses': ['obrigacoes'], // repasses e uma facade para obrigacoes
  };

  for (const file of indexFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const featureName = path.dirname(file).split('/').pop() || '';
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignora comentarios
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
        continue;
      }

      // Busca imports reais de @/app/(authenticated)/
      const importMatch = line.match(/(?:import|export).*from ['"]@\/features\/([^'"\/]+)/);
      if (importMatch) {
        const importedFeature = importMatch[1];

        // Ignora self-imports e allowed cross-imports
        if (importedFeature === featureName) continue;
        if (allowedCrossImports[featureName]?.includes(importedFeature)) continue;

        addIssue({
          rule: 'no-feature-cross-imports',
          file,
          message: `Feature ${featureName} importa de ${importedFeature}. Features devem ser independentes.`,
          severity: 'warning',
        });
      }
    }
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('VALIDACAO ARQUITETURAL - SYNTHROPIC');
  console.log(`Modo: ${STRICT_MODE ? 'STRICT' : 'NORMAL'}`);
  console.log('='.repeat(60));
  console.log('');

  // Executa todas as validacoes
  await validateNoLegacyActions();
  await validateMaxFileLines();
  await validateNoSupabaseInComponents();
  await validateSafeActionUsage();
  await validateFeatureStructure();
  await validateNoFeatureCrossImports();

  // Relatorio
  console.log('RESULTADOS:');
  console.log('-'.repeat(40));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('Nenhum problema encontrado!');
    process.exit(0);
  }

  // Agrupa por regra
  const byRule = new Map<string, ValidationError[]>();

  for (const issue of [...errors, ...warnings]) {
    if (!byRule.has(issue.rule)) {
      byRule.set(issue.rule, []);
    }
    byRule.get(issue.rule)!.push(issue);
  }

  for (const [rule, issues] of byRule) {
    console.log('');
    console.log(`[${rule}] (${issues.length} ${issues.length === 1 ? 'problema' : 'problemas'})`);

    for (const issue of issues) {
      const icon = issue.severity === 'error' ? '[ERROR]' : '[WARN]';
      console.log(`  ${icon} ${issue.file}`);
      console.log(`     ${issue.message}`);
    }
  }

  console.log('');
  console.log('-'.repeat(40));
  console.log(`Total: ${errors.length} erro(s), ${warnings.length} aviso(s)`);

  if (errors.length > 0) {
    console.log('');
    console.log('Validacao FALHOU. Corrija os erros acima.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('');
    console.log('Validacao passou com avisos. Considere corrigir.');
    process.exit(0);
  }
}

main().catch(console.error);
