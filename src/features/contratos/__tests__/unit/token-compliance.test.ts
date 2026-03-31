/**
 * Testes: Token Compliance — Contratos
 *
 * Verifica tokens semânticos e acentuação nos componentes de Contratos.
 */

import * as fs from 'fs';
import * as path from 'path';

const CONTRATOS_COMPONENTS_DIR = path.resolve(__dirname, '../../components');
const CONTRATOS_CLIENT = path.resolve(__dirname, '../../../../app/app/contratos/contratos-client.tsx');

const FORBIDDEN_COLOR_PATTERNS = [
  /\btext-(red|green|blue|orange|amber|emerald|sky|pink|gray)-\d{2,3}\b/,
  /\bbg-(red|green|blue|orange|amber|emerald|sky|pink|gray)-\d{2,3}\b/,
  /\bfill-(red|green|blue|orange|amber|emerald|sky|pink|gray)-\d{2,3}\b/,
  /\bshadow-xl\b/,
];

// Labels de UI que devem ter acentuação correta
const REQUIRED_ACCENTS: Array<{ wrong: RegExp; right: string }> = [
  { wrong: /\bContratacao\b/, right: 'Contratação' },
  { wrong: /\bDistribuido\b/, right: 'Distribuído' },
  { wrong: /\bDesistencia\b/, right: 'Desistência' },
  { wrong: /\bnegociacao\b/, right: 'negociação' },
  { wrong: /\bConversao\b/, right: 'Conversão' },
  { wrong: /\bTendencia\b/, right: 'Tendência' },
  { wrong: /\bResponsavel\b/, right: 'Responsável' },
];

function readFileIfExists(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function findTsxFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
          files.push(...findTsxFiles(fullPath));
        }
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch { /* */ }
  return files;
}

describe('Contratos Token Compliance', () => {
  const componentFiles = findTsxFiles(CONTRATOS_COMPONENTS_DIR);
  const allFiles = [...componentFiles];

  const clientContent = readFileIfExists(CONTRATOS_CLIENT);
  if (clientContent) {
    allFiles.push(CONTRATOS_CLIENT);
  }

  it('deve encontrar arquivos para verificar', () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  describe('Cores hardcoded', () => {
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const pattern of FORBIDDEN_COLOR_PATTERNS) {
        it(`${fileName}: não deve conter ${pattern.source}`, () => {
          const lines = content.split('\n');
          const violations: string[] = [];

          lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import')) return;

            if (pattern.test(line)) {
              violations.push(`  Linha ${index + 1}: ${trimmed.substring(0, 120)}`);
            }
          });

          if (violations.length > 0) {
            fail(`Violações em ${fileName}:\n${violations.join('\n')}`);
          }
        });
      }
    }
  });

  describe('Acentuação de labels de UI', () => {
    const contratosClient = readFileIfExists(CONTRATOS_CLIENT);

    if (contratosClient) {
      for (const rule of REQUIRED_ACCENTS) {
        it(`contratos-client.tsx: não deve conter "${rule.wrong.source}" (usar "${rule.right}")`, () => {
          const lines = contratosClient.split('\n');
          const violations: string[] = [];

          lines.forEach((line, index) => {
            const trimmed = line.trim();
            // Ignorar comentários
            if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
            // Ignorar nomes de variáveis e campos (camelCase ou snake_case)
            if (trimmed.match(/^\w+\s*[=:]/)) return;

            // Checar apenas strings literais (entre aspas)
            const strings = line.match(/['"`][^'"`]*['"`]/g) || [];
            for (const str of strings) {
              if (rule.wrong.test(str)) {
                violations.push(`  Linha ${index + 1}: ${trimmed.substring(0, 120)}`);
              }
            }
          });

          if (violations.length > 0) {
            fail(`Labels sem acento em contratos-client.tsx:\n${violations.join('\n')}`);
          }
        });
      }
    }

    // financial-strip.tsx
    const financialStripPath = path.join(CONTRATOS_COMPONENTS_DIR, 'financial-strip.tsx');
    const financialStrip = readFileIfExists(financialStripPath);

    if (financialStrip) {
      for (const rule of REQUIRED_ACCENTS) {
        it(`financial-strip.tsx: não deve conter "${rule.wrong.source}"`, () => {
          const strings = financialStrip.match(/['"`][^'"`]*['"`]/g) || [];
          const violations = strings.filter(s => rule.wrong.test(s));

          if (violations.length > 0) {
            fail(`Labels sem acento: ${violations.join(', ')}`);
          }
        });
      }
    }

    // pipeline-funnel.tsx
    const pipelineFunnelPath = path.join(CONTRATOS_COMPONENTS_DIR, 'pipeline-funnel.tsx');
    const pipelineFunnel = readFileIfExists(pipelineFunnelPath);

    if (pipelineFunnel) {
      for (const rule of REQUIRED_ACCENTS) {
        it(`pipeline-funnel.tsx: não deve conter "${rule.wrong.source}"`, () => {
          const strings = pipelineFunnel.match(/['"`][^'"`]*['"`]/g) || [];
          const violations = strings.filter(s => rule.wrong.test(s));

          if (violations.length > 0) {
            fail(`Labels sem acento: ${violations.join(', ')}`);
          }
        });
      }
    }
  });
});
