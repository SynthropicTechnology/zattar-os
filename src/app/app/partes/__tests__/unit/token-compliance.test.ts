/**
 * Testes: Token Compliance — Partes
 *
 * Verifica que os componentes de Partes usam tokens semânticos
 * conforme o Design System.
 *
 * Cores por tipo de entidade (MASTER.md):
 * - Cliente: text-primary/70, bg-primary/8
 * - Parte Contrária: text-warning/70, bg-warning/8
 * - Terceiro: text-info/70, bg-info/8
 * - Representante: text-success/70, bg-success/8
 */

import * as fs from 'fs';
import * as path from 'path';

const PARTES_DIR = path.resolve(__dirname, '../../');

const FORBIDDEN_PATTERNS = [
  /\btext-(red|green|blue|orange|amber|emerald|sky|pink|rose)-\d{2,3}\b/,
  /\bbg-(red|green|blue|orange|amber|emerald|sky|pink|rose)-\d{2,3}\b/,
  /\bshadow-xl\b/,
];

const EXCLUDED_PATHS = ['__tests__/', 'node_modules/'];

function findTsxFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(PARTES_DIR, fullPath);

      if (EXCLUDED_PATHS.some(exc => relativePath.includes(exc))) continue;

      if (entry.isDirectory()) {
        files.push(...findTsxFiles(fullPath));
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch { /* */ }
  return files;
}

describe('Partes Token Compliance', () => {
  const files = findTsxFiles(PARTES_DIR);

  it('deve encontrar arquivos para verificar', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  describe('Cores hardcoded proibidas', () => {
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const pattern of FORBIDDEN_PATTERNS) {
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
            fail(`Violações de token em ${fileName}:\n${violations.join('\n')}`);
          }
        });
      }
    }
  });

  describe('Entity color mapping', () => {
    const adapterPath = path.resolve(PARTES_DIR, 'adapters/entity-card-adapter.ts');

    it('deve usar text-primary/70 para Cliente', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('text-primary/70');
    });

    it('deve usar text-warning/70 para Parte Contrária', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('text-warning/70');
    });

    it('deve usar text-info/70 para Terceiro', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('text-info/70');
    });

    it('deve usar text-success/70 para Representante', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('text-success/70');
    });

    it('deve usar bg-primary/8 para Cliente', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('bg-primary/8');
    });

    it('deve usar bg-warning/8 para Parte Contrária', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('bg-warning/8');
    });

    it('deve usar bg-info/8 para Terceiro', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('bg-info/8');
    });

    it('deve usar bg-success/8 para Representante', () => {
      const content = fs.readFileSync(adapterPath, 'utf-8');
      expect(content).toContain('bg-success/8');
    });
  });
});
