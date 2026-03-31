/**
 * Testes: Token Compliance — Dashboard
 *
 * Verifica que os componentes do Dashboard usam tokens semânticos
 * em vez de cores hardcoded do Tailwind.
 *
 * Regras do Design System:
 * - text-green-600 → text-success
 * - text-red-600 → text-destructive
 * - text-orange-600 → text-warning
 * - text-blue-600 → text-info
 * - bg-{color}-{shade} → bg-{semantic}/opacity
 * - shadow-xl é PROIBIDO
 */

import * as fs from 'fs';
import * as path from 'path';

const DASHBOARD_DIR = path.resolve(__dirname, '../../');

// Padrões proibidos: cores hardcoded do Tailwind em texto de UI
const FORBIDDEN_PATTERNS = [
  /\btext-(red|green|blue|orange|amber|emerald|sky|pink|purple|gray)-\d{2,3}\b/,
  /\bbg-(red|green|blue|orange|amber|emerald|sky|pink|purple|gray)-\d{2,3}\b/,
  /\bborder-(red|green|blue|orange|amber|emerald|sky|pink|purple)-\d{2,3}\b/,
  /\bshadow-xl\b/,
];

// Exceções: arquivos de mock/demo podem usar cores hardcoded
const EXCLUDED_PATHS = [
  'mock/', // Páginas de mock/protótipo
  '__tests__/', // Testes
  'node_modules/',
];

function findTsxFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(DASHBOARD_DIR, fullPath);

      if (EXCLUDED_PATHS.some(exc => relativePath.includes(exc))) continue;

      if (entry.isDirectory()) {
        files.push(...findTsxFiles(fullPath));
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}

describe('Dashboard Token Compliance', () => {
  const files = findTsxFiles(DASHBOARD_DIR);

  it('deve encontrar arquivos para verificar', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const filePath of files) {
    const relativePath = path.relative(DASHBOARD_DIR, filePath);

    describe(relativePath, () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const pattern of FORBIDDEN_PATTERNS) {
        it(`não deve conter padrão proibido: ${pattern.source}`, () => {
          const violations: string[] = [];

          lines.forEach((line, index) => {
            // Ignorar comentários e imports
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import')) return;

            if (pattern.test(line)) {
              violations.push(`  Linha ${index + 1}: ${trimmed.substring(0, 120)}`);
            }
          });

          if (violations.length > 0) {
            fail(`${violations.length} violação(ões) em ${relativePath}:\n${violations.join('\n')}`);
          }
        });
      }
    });
  }
});
