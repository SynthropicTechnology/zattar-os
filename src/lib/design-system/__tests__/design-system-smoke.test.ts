/**
 * Smoke Tests — Análise Estática do Design System
 *
 * Verifica regras estruturais e de consistência visual em todos os módulos.
 * Usa Node.js fs/path para ler arquivos e validar padrões via regex.
 *
 * **Valida: Requisitos 8.1, 8.2, 8.3, 8.4, 7.1**
 */
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const AUTH_DIR = path.join(ROOT, 'src', 'app', '(authenticated)');

/** The 6 modules under test */
const MODULES = [
  'partes',
  'processos',
  'contratos',
  'assinatura-digital',
  'audiencias',
  'expedientes',
] as const;

type ModuleName = (typeof MODULES)[number];

/**
 * For assinatura-digital, FSD files live under feature/ subfolder.
 * For all others, they live at the module root.
 */
function fsdRoot(mod: ModuleName): string {
  if (mod === 'assinatura-digital') {
    return path.join(AUTH_DIR, mod, 'feature');
  }
  return path.join(AUTH_DIR, mod);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect files matching a predicate */
function collectFiles(dir: string, predicate: (filePath: string) => boolean): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .next, __tests__, mock dirs
      if (['node_modules', '.next', '__tests__', 'mock', '__mocks__'].includes(entry.name)) continue;
      results.push(...collectFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Collect .tsx files inside components/ folders of a module (for hardcoded color checks) */
function collectComponentTsxFiles(mod: ModuleName): string[] {
  const root = path.join(AUTH_DIR, mod);
  const results: string[] = [];

  function walk(dir: string, insideComponents: boolean) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.next', '__tests__', 'mock', '__mocks__'].includes(entry.name)) continue;
        const isComponentsDir = entry.name === 'components';
        walk(fullPath, insideComponents || isComponentsDir);
      } else if (insideComponents && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
        results.push(fullPath);
      }
    }
  }

  walk(root, false);
  return results;
}

/** Collect all .tsx files in a module (for shadow-xl / oklch checks) */
function collectAllTsxFiles(mod: ModuleName): string[] {
  const root = path.join(AUTH_DIR, mod);
  return collectFiles(root, (f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
}

/** Read file content, return empty string if not found */
function safeRead(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

/** Make path relative to project root for readable error messages */
function rel(filePath: string): string {
  return path.relative(ROOT, filePath);
}

// ---------------------------------------------------------------------------
// Forbidden patterns
// ---------------------------------------------------------------------------

/**
 * Hardcoded Tailwind color classes with numeric shades.
 * Matches: bg-blue-500, text-green-700, border-red-200, bg-amber-100/50, etc.
 * Does NOT match semantic tokens: bg-primary, bg-muted, bg-destructive, etc.
 */
const HARDCODED_COLOR_REGEX =
  /\b(?:bg|text|border|ring|outline|divide|from|via|to)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}/g;

/** Local badge/color mapping functions */
const LOCAL_COLOR_FN_REGEX =
  /(?:function|const|let|var)\s+get\w+(?:Color|Badge|Status)(?:Class|Style|Variant)\s*[=(]/g;

/** shadow-xl usage */
const SHADOW_XL_REGEX = /\bshadow-xl\b/g;

/** oklch() direct usage */
const OKLCH_REGEX = /oklch\s*\(/g;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Design System Smoke Tests — Análise Estática', () => {
  // =========================================================================
  // 8.1 — Ausência de cores hardcoded em componentes de feature
  // =========================================================================
  describe('Req 8.1: Ausência de cores hardcoded (bg-{cor}-{shade}) em componentes de feature', () => {
    for (const mod of MODULES) {
      it(`módulo "${mod}" não contém cores hardcoded em components/`, () => {
        const files = collectComponentTsxFiles(mod);
        const violations: string[] = [];

        for (const file of files) {
          const content = safeRead(file);
          const matches = content.match(HARDCODED_COLOR_REGEX);
          if (matches && matches.length > 0) {
            violations.push(`${rel(file)}: ${[...new Set(matches)].join(', ')}`);
          }
        }

        expect(violations).toEqual([]);
      });
    }
  });

  // =========================================================================
  // 8.2 — Ausência de funções locais getXXXColorClass() / getXXXBadgeStyle()
  // =========================================================================
  describe('Req 8.2: Ausência de funções locais getXXXColorClass()', () => {
    for (const mod of MODULES) {
      it(`módulo "${mod}" não contém funções locais de mapeamento de cor/badge`, () => {
        const root = path.join(AUTH_DIR, mod);
        const files = collectFiles(root, (f) =>
          (f.endsWith('.ts') || f.endsWith('.tsx')) &&
          !f.endsWith('.test.ts') &&
          !f.endsWith('.test.tsx'),
        );
        const violations: string[] = [];

        for (const file of files) {
          const content = safeRead(file);
          const matches = content.match(LOCAL_COLOR_FN_REGEX);
          if (matches && matches.length > 0) {
            violations.push(`${rel(file)}: ${[...new Set(matches)].join(', ')}`);
          }
        }

        expect(violations).toEqual([]);
      });
    }
  });

  // =========================================================================
  // 8.3 — Ausência de shadow-xl
  // =========================================================================
  describe('Req 8.3: Ausência de shadow-xl em componentes', () => {
    for (const mod of MODULES) {
      it(`módulo "${mod}" não contém shadow-xl`, () => {
        const files = collectAllTsxFiles(mod);
        const violations: string[] = [];

        for (const file of files) {
          const content = safeRead(file);
          const matches = content.match(SHADOW_XL_REGEX);
          if (matches) {
            violations.push(rel(file));
          }
        }

        expect(violations).toEqual([]);
      });
    }
  });

  // =========================================================================
  // 8.4 — Ausência de oklch() direto
  // =========================================================================
  describe('Req 8.4: Ausência de oklch() direto em componentes', () => {
    for (const mod of MODULES) {
      it(`módulo "${mod}" não contém oklch() direto`, () => {
        const files = collectAllTsxFiles(mod);
        const violations: string[] = [];

        for (const file of files) {
          const content = safeRead(file);
          const matches = content.match(OKLCH_REGEX);
          if (matches) {
            violations.push(rel(file));
          }
        }

        expect(violations).toEqual([]);
      });
    }
  });

  // =========================================================================
  // 7.1 — Existência de layout.tsx com PageShell em cada módulo
  // =========================================================================
  describe('Req 7.1: Existência de layout.tsx com PageShell em cada módulo', () => {
    for (const mod of MODULES) {
      it(`módulo "${mod}" possui layout.tsx com PageShell`, () => {
        // assinatura-digital has sub-routes with PageShell; check root or sub-routes
        const layoutPath = path.join(AUTH_DIR, mod, 'layout.tsx');

        if (mod === 'assinatura-digital') {
          // assinatura-digital uses PageShell directly in page.tsx of sub-routes
          // (not via layout.tsx). Check that key sub-routes have PageShell.
          const subRoutePages = [
            path.join(AUTH_DIR, mod, 'templates', 'page.tsx'),
            path.join(AUTH_DIR, mod, 'formularios', 'page.tsx'),
            path.join(AUTH_DIR, mod, 'documentos', 'lista', 'page.tsx'),
          ];
          const pagesWithPageShell = subRoutePages.filter(
            (p) => fs.existsSync(p) && safeRead(p).includes('PageShell'),
          );

          // At least 2 of the 3 key sub-routes must use PageShell
          expect(pagesWithPageShell.length).toBeGreaterThanOrEqual(2);
        } else {
          expect(fs.existsSync(layoutPath)).toBe(true);
          const content = safeRead(layoutPath);
          expect(content).toContain('PageShell');
        }
      });
    }
  });

  // =========================================================================
  // 7.1 — Existência de arquivos FSD obrigatórios em cada módulo
  // =========================================================================
  describe('Req 7.1: Existência de domain.ts, service.ts, repository.ts, actions/, index.ts, RULES.md', () => {
    const REQUIRED_FILES = ['domain.ts', 'service.ts', 'repository.ts', 'index.ts', 'RULES.md'];
    const REQUIRED_DIRS = ['actions'];

    for (const mod of MODULES) {
      describe(`módulo "${mod}"`, () => {
        const root = fsdRoot(mod);

        for (const file of REQUIRED_FILES) {
          it(`contém ${file}`, () => {
            const filePath = path.join(root, file);
            expect(fs.existsSync(filePath)).toBe(true);
          });
        }

        for (const dir of REQUIRED_DIRS) {
          it(`contém pasta ${dir}/`, () => {
            const dirPath = path.join(root, dir);
            expect(fs.existsSync(dirPath)).toBe(true);
            const stat = fs.statSync(dirPath);
            expect(stat.isDirectory()).toBe(true);
          });
        }
      });
    }
  });

  // =========================================================================
  // 7.1 — Barrel exports organizados por seção
  // =========================================================================
  describe('Req 7.1: Barrel exports organizados por seção (comment headers)', () => {
    for (const mod of MODULES) {
      it(`módulo "${mod}" possui barrel export com seções organizadas`, () => {
        const root = fsdRoot(mod);
        const indexPath = path.join(root, 'index.ts');
        expect(fs.existsSync(indexPath)).toBe(true);

        const content = safeRead(indexPath);

        // Check for section comment headers like "// ====" or "// ----"
        const sectionHeaderRegex = /\/\/\s*[=]{4,}|\/\/\s*[-]{4,}/;
        expect(content).toMatch(sectionHeaderRegex);
      });
    }
  });
});
