#!/usr/bin/env npx tsx
/**
 * Script de Validacao de Exports para Synthropic
 *
 * Detecta simbolos duplicados em barrels (index.ts) que podem causar
 * conflitos de export ao usar star exports (`export * from`).
 *
 * Funcionalidades:
 * - Escaneia barrels em src/features (recursivo) e src/lib (recursivo)
 * - Usa TypeScript compiler API para parsing robusto
 * - Coleta todos os symbols exportados por barrel
 * - Detecta duplicatas entre multiplas fontes
 * - Reporta conflitos com file paths, line numbers e symbols
 * - Sugere correcoes baseadas em boas praticas (namespacing)
 *
 * @usage npx tsx scripts/validate-exports.ts [--verbose] [--json]
 *
 * @example Bom namespacing (src/features/financeiro/domain/index.ts):
 *   export * as orcamentosTypes from './orcamentos';
 *   export * as dreTypes from './dre';
 */

import * as ts from "typescript";
import fs from "fs";
import path from "path";
import { glob } from "glob";

// =============================================================================
// CONFIGURACAO
// =============================================================================

const ROOT_DIR = process.cwd();
const VERBOSE = process.argv.includes("--verbose");
const JSON_OUTPUT = process.argv.includes("--json");

// Diretorios a escanear conforme especificacao
const BARREL_PATTERNS = [
  "src/features/*/index.ts",
  "src/features/*/*/index.ts",
  "src/lib/*/index.ts",
  "src/lib/*/*/index.ts",
];

// =============================================================================
// TIPOS
// =============================================================================

interface ExportedSymbol {
  name: string;
  kind: "named" | "default" | "namespace" | "type" | "star-reexport";
  sourceFile: string;
  line: number;
  column: number;
  originalSource?: string; // Para re-exports, o modulo original
}

interface BarrelAnalysis {
  filePath: string;
  relativePath: string;
  exports: ExportedSymbol[];
  starReexports: string[];
  resolvedExports: Map<string, ExportedSymbol[]>; // Nome -> todas as fontes
  duplicates: Map<string, ExportedSymbol[]>; // Simbolos com mais de uma fonte
}

interface ValidationIssue {
  rule: "duplicate-export" | "too-many-star-exports" | "potential-conflict";
  severity: "error" | "warning";
  barrel: string;
  symbol?: string;
  message: string;
  locations: string[];
  suggestion?: string;
}

interface ValidationReport {
  timestamp: string;
  barrelsAnalyzed: number;
  totalExports: number;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
  };
}

// =============================================================================
// TYPESCRIPT COMPILER API - PARSING
// =============================================================================

/**
 * Cria um programa TypeScript para analise
 */
function createProgram(filePaths: string[]): ts.Program {
  const configPath = ts.findConfigFile(
    ROOT_DIR,
    ts.sys.fileExists,
    "tsconfig.json"
  );

  if (configPath) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );

    return ts.createProgram({
      rootNames: filePaths,
      options: parsedConfig.options,
    });
  }

  return ts.createProgram({
    rootNames: filePaths,
    options: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowJs: true,
      skipLibCheck: true,
    },
  });
}

/**
 * Extrai exports de um arquivo usando TypeScript AST
 */
function extractExports(
  sourceFile: ts.SourceFile,
  _program: ts.Program
): ExportedSymbol[] {
  const exports: ExportedSymbol[] = [];
  const filePath = sourceFile.fileName;

  function getLineAndColumn(node: ts.Node): { line: number; column: number } {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart()
    );
    return { line: line + 1, column: character + 1 };
  }

  function visit(node: ts.Node) {
    // export * from './module'
    if (
      ts.isExportDeclaration(node) &&
      !node.exportClause &&
      node.moduleSpecifier
    ) {
      const { line, column } = getLineAndColumn(node);
      const modulePath = (node.moduleSpecifier as ts.StringLiteral).text;

      exports.push({
        name: "*",
        kind: "star-reexport",
        sourceFile: filePath,
        line,
        column,
        originalSource: modulePath,
      });
    }

    // export * as namespace from './module'
    else if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamespaceExport(node.exportClause)
    ) {
      const { line, column } = getLineAndColumn(node);
      const namespaceName = node.exportClause.name.text;
      const modulePath = node.moduleSpecifier
        ? (node.moduleSpecifier as ts.StringLiteral).text
        : undefined;

      exports.push({
        name: namespaceName,
        kind: "namespace",
        sourceFile: filePath,
        line,
        column,
        originalSource: modulePath,
      });
    }

    // export { name1, name2 } from './module'
    else if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      const modulePath = node.moduleSpecifier
        ? (node.moduleSpecifier as ts.StringLiteral).text
        : undefined;
      const isTypeOnly = node.isTypeOnly;

      node.exportClause.elements.forEach((element) => {
        const { line, column } = getLineAndColumn(element);
        const exportedName = element.name.text;

        exports.push({
          name: exportedName,
          kind: isTypeOnly ? "type" : "named",
          sourceFile: filePath,
          line,
          column,
          originalSource: modulePath,
        });
      });
    }

    // export type { ... } from './module'
    else if (
      ts.isExportDeclaration(node) &&
      node.isTypeOnly &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      const modulePath = node.moduleSpecifier
        ? (node.moduleSpecifier as ts.StringLiteral).text
        : undefined;

      node.exportClause.elements.forEach((element) => {
        const { line, column } = getLineAndColumn(element);
        exports.push({
          name: element.name.text,
          kind: "type",
          sourceFile: filePath,
          line,
          column,
          originalSource: modulePath,
        });
      });
    }

    // export default
    else if (ts.isExportAssignment(node) && !node.isExportEquals) {
      const { line, column } = getLineAndColumn(node);
      exports.push({
        name: "default",
        kind: "default",
        sourceFile: filePath,
        line,
        column,
      });
    }

    // export function/class/const/etc
    else if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isVariableStatement(node)
    ) {
      const modifiers = ts.canHaveModifiers(node)
        ? ts.getModifiers(node)
        : undefined;
      const hasExport = modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );
      const hasDefault = modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.DefaultKeyword
      );

      if (hasExport) {
        const { line, column } = getLineAndColumn(node);

        if (hasDefault) {
          exports.push({
            name: "default",
            kind: "default",
            sourceFile: filePath,
            line,
            column,
          });
        } else if (
          ts.isFunctionDeclaration(node) ||
          ts.isClassDeclaration(node)
        ) {
          const name = node.name?.text;
          if (name) {
            exports.push({
              name,
              kind: "named",
              sourceFile: filePath,
              line,
              column,
            });
          }
        } else if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach((decl) => {
            if (ts.isIdentifier(decl.name)) {
              exports.push({
                name: decl.name.text,
                kind: "named",
                sourceFile: filePath,
                line,
                column,
              });
            }
          });
        }
      }
    }

    // export interface/type
    else if (
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node)
    ) {
      const modifiers = ts.canHaveModifiers(node)
        ? ts.getModifiers(node)
        : undefined;
      const hasExport = modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );

      if (hasExport) {
        const { line, column } = getLineAndColumn(node);
        exports.push({
          name: node.name.text,
          kind: "type",
          sourceFile: filePath,
          line,
          column,
        });
      }
    }

    // export enum
    else if (ts.isEnumDeclaration(node)) {
      const modifiers = ts.canHaveModifiers(node)
        ? ts.getModifiers(node)
        : undefined;
      const hasExport = modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );

      if (hasExport) {
        const { line, column } = getLineAndColumn(node);
        exports.push({
          name: node.name.text,
          kind: "named",
          sourceFile: filePath,
          line,
          column,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

// =============================================================================
// RESOLUCAO DE EXPORTS
// =============================================================================

/**
 * Resolve o caminho de um import relativo
 */
function resolveModulePath(
  fromFile: string,
  modulePath: string
): string | null {
  const dir = path.dirname(fromFile);

  // Tenta diferentes extensoes e index files
  const candidates = [
    path.join(dir, `${modulePath}.ts`),
    path.join(dir, `${modulePath}.tsx`),
    path.join(dir, modulePath, "index.ts"),
    path.join(dir, modulePath, "index.tsx"),
    path.join(dir, `${modulePath}.d.ts`),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Coleta recursivamente todos os exports de um modulo (seguindo star re-exports)
 */
function collectAllExports(
  filePath: string,
  program: ts.Program,
  visited: Set<string> = new Set(),
  depth: number = 0
): Map<string, ExportedSymbol[]> {
  const absolutePath = path.resolve(filePath);
  const result = new Map<string, ExportedSymbol[]>();

  // Evita ciclos infinitos
  if (visited.has(absolutePath) || depth > 10) {
    return result;
  }
  visited.add(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return result;
  }

  const sourceFile = program.getSourceFile(absolutePath);
  if (!sourceFile) {
    // Fallback para regex parsing se nao conseguir AST
    return collectExportsWithRegex(absolutePath, visited, depth);
  }

  const exports = extractExports(sourceFile, program);

  for (const exp of exports) {
    if (exp.kind === "star-reexport" && exp.originalSource) {
      // Resolve e segue star exports recursivamente
      const resolvedPath = resolveModulePath(absolutePath, exp.originalSource);
      if (resolvedPath) {
        const subExports = collectAllExports(
          resolvedPath,
          program,
          visited,
          depth + 1
        );
        subExports.forEach((symbols, name) => {
          if (!result.has(name)) {
            result.set(name, []);
          }
          result.get(name)!.push(...symbols);
        });
      }
    } else if (exp.name !== "*") {
      // Export nomeado ou namespace
      if (!result.has(exp.name)) {
        result.set(exp.name, []);
      }
      result.get(exp.name)!.push(exp);
    }
  }

  return result;
}

/**
 * Fallback: coleta exports usando regex (para arquivos fora do program)
 */
function collectExportsWithRegex(
  filePath: string,
  visited: Set<string>,
  depth: number
): Map<string, ExportedSymbol[]> {
  const result = new Map<string, ExportedSymbol[]>();
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // export * from './module' - seguir recursivamente
    const starMatch = line.match(/export\s+\*\s+from\s+['"]([^'"]+)['"]/);
    if (starMatch && !line.includes(" as ")) {
      const modulePath = starMatch[1];
      const resolvedPath = resolveModulePath(filePath, modulePath);
      if (
        resolvedPath &&
        !visited.has(path.resolve(resolvedPath)) &&
        depth < 10
      ) {
        visited.add(path.resolve(resolvedPath));
        const subExports = collectExportsWithRegex(
          resolvedPath,
          visited,
          depth + 1
        );
        subExports.forEach((symbols, name) => {
          if (!result.has(name)) {
            result.set(name, []);
          }
          result.get(name)!.push(...symbols);
        });
      }
      return;
    }

    // export * as namespace from './module'
    const namespaceMatch = line.match(
      /export\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/
    );
    if (namespaceMatch) {
      const name = namespaceMatch[1];
      if (!result.has(name)) {
        result.set(name, []);
      }
      result.get(name)!.push({
        name,
        kind: "namespace",
        sourceFile: filePath,
        line: lineNumber,
        column: 1,
        originalSource: namespaceMatch[2],
      });
      return;
    }

    // export { name1, name2 } from './module'
    const namedMatch = line.match(
      /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/
    );
    if (namedMatch) {
      const isType = line.includes("export type");
      const names = namedMatch[1]
        .split(",")
        .map((n) => {
          const parts = n.trim().split(/\s+as\s+/);
          return parts[parts.length - 1].trim();
        })
        .filter((n) => n);

      names.forEach((name) => {
        if (!result.has(name)) {
          result.set(name, []);
        }
        result.get(name)!.push({
          name,
          kind: isType ? "type" : "named",
          sourceFile: filePath,
          line: lineNumber,
          column: 1,
          originalSource: namedMatch[2],
        });
      });
      return;
    }

    // export function/const/class/interface/type/enum NAME
    const directMatch = line.match(
      /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+(\w+)/
    );
    if (directMatch) {
      const name = line.includes("export default") ? "default" : directMatch[1];
      const baseKind: "type" | "named" =
        line.includes("interface") || line.includes("type ") ? "type" : "named";
      const finalKind: ExportedSymbol["kind"] = line.includes("export default")
        ? "default"
        : baseKind;
      if (!result.has(name)) {
        result.set(name, []);
      }
      result.get(name)!.push({
        name,
        kind: finalKind,
        sourceFile: filePath,
        line: lineNumber,
        column: 1,
      });
    }
  });

  return result;
}

// =============================================================================
// ANALISE DE BARRELS
// =============================================================================

/**
 * Analisa um barrel file completo
 */
function analyzeBarrel(filePath: string, program: ts.Program): BarrelAnalysis {
  const absolutePath = path.resolve(ROOT_DIR, filePath);
  const relativePath = path
    .relative(ROOT_DIR, absolutePath)
    .replace(/\\/g, "/");

  const sourceFile = program.getSourceFile(absolutePath);
  let exports: ExportedSymbol[] = [];

  if (sourceFile) {
    exports = extractExports(sourceFile, program);
  } else {
    // Fallback para regex
    const content = fs.readFileSync(absolutePath, "utf-8");
    const tempSourceFile = ts.createSourceFile(
      absolutePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    exports = extractExports(tempSourceFile, program);
  }

  const starReexports = exports
    .filter((e) => e.kind === "star-reexport")
    .map((e) => e.originalSource!)
    .filter(Boolean);

  // Coleta todos os exports resolvidos (seguindo star re-exports)
  const resolvedExports = collectAllExports(
    absolutePath,
    program,
    new Set(),
    0
  );

  // Identifica duplicatas
  const duplicates = new Map<string, ExportedSymbol[]>();
  resolvedExports.forEach((symbols, name) => {
    if (symbols.length > 1) {
      // Verifica se sao de fontes diferentes (nao apenas re-exports do mesmo simbolo)
      const uniqueSources = new Set(
        symbols.map((s) => s.originalSource || s.sourceFile)
      );
      if (uniqueSources.size > 1) {
        duplicates.set(name, symbols);
      }
    }
  });

  return {
    filePath: absolutePath,
    relativePath,
    exports,
    starReexports,
    resolvedExports,
    duplicates,
  };
}

// =============================================================================
// VALIDACAO
// =============================================================================

function log(message: string) {
  if (VERBOSE && !JSON_OUTPUT) {
    console.log(message);
  }
}

async function validateAllBarrels(): Promise<ValidationReport> {
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    barrelsAnalyzed: 0,
    totalExports: 0,
    issues: [],
    summary: { errors: 0, warnings: 0 },
  };

  // Coleta todos os barrels
  const allBarrels: string[] = [];
  for (const pattern of BARREL_PATTERNS) {
    const matches = await glob(pattern, { cwd: ROOT_DIR });
    allBarrels.push(...matches);
  }

  // Remove duplicatas
  const uniqueBarrels = [...new Set(allBarrels)];
  report.barrelsAnalyzed = uniqueBarrels.length;

  log(`\nEncontrados ${uniqueBarrels.length} barrels para analisar:\n`);
  uniqueBarrels.forEach((b) => log(`  - ${b}`));
  log("");

  // Cria programa TypeScript com todos os barrels
  const absolutePaths = uniqueBarrels.map((b) => path.resolve(ROOT_DIR, b));
  const program = createProgram(absolutePaths);

  // Analisa cada barrel
  for (const barrel of uniqueBarrels) {
    log(`Analisando: ${barrel}`);

    const analysis = analyzeBarrel(barrel, program);
    report.totalExports += analysis.resolvedExports.size;

    // Reporta duplicatas (ERRO)
    if (analysis.duplicates.size > 0) {
      analysis.duplicates.forEach((symbols, symbolName) => {
        const locations = symbols.map((s) => {
          const relPath = path
            .relative(ROOT_DIR, s.sourceFile)
            .replace(/\\/g, "/");
          return `${relPath}:${s.line}:${s.column}`;
        });

        report.issues.push({
          rule: "duplicate-export",
          severity: "error",
          barrel: analysis.relativePath,
          symbol: symbolName,
          message: `Simbolo "${symbolName}" exportado de ${symbols.length} fontes diferentes`,
          locations,
          suggestion: `Use namespace export (export * as X from) ou renomeie o simbolo em uma das fontes. Ver src/features/financeiro/domain/index.ts como exemplo.`,
        });
      });
    }

    // Avisa sobre muitos star exports (WARNING)
    if (analysis.starReexports.length > 5) {
      report.issues.push({
        rule: "too-many-star-exports",
        severity: "warning",
        barrel: analysis.relativePath,
        message: `Barrel tem ${analysis.starReexports.length} star re-exports. Risco de conflitos futuros.`,
        locations: analysis.starReexports.map((s) => `→ ${s}`),
        suggestion: `Considere usar exports nomeados ou namespaces para maior controle.`,
      });
    }

    log(
      `  ${analysis.resolvedExports.size} exports, ${analysis.starReexports.length} star re-exports, ${analysis.duplicates.size} duplicatas`
    );
  }

  // Calcula sumario
  report.summary.errors = report.issues.filter(
    (i) => i.severity === "error"
  ).length;
  report.summary.warnings = report.issues.filter(
    (i) => i.severity === "warning"
  ).length;

  return report;
}

// =============================================================================
// OUTPUT
// =============================================================================

function printReport(report: ValidationReport): void {
  if (JSON_OUTPUT) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("\n" + "=".repeat(70));
  console.log(" VALIDACAO DE EXPORTS - SYNTHROPIC");
  console.log("=".repeat(70));
  console.log(`\nBarrels analisados: ${report.barrelsAnalyzed}`);
  console.log(`Total de exports: ${report.totalExports}`);

  const errors = report.issues.filter((i) => i.severity === "error");
  const warnings = report.issues.filter((i) => i.severity === "warning");

  if (errors.length > 0) {
    console.log("\n" + "-".repeat(70));
    console.log(" ERROS");
    console.log("-".repeat(70));

    errors.forEach((issue, idx) => {
      console.log(`\n[${idx + 1}] ${issue.rule.toUpperCase()}`);
      console.log(`    Barrel: ${issue.barrel}`);
      if (issue.symbol) {
        console.log(`    Simbolo: ${issue.symbol}`);
      }
      console.log(`    ${issue.message}`);
      console.log("    Locais:");
      issue.locations.forEach((loc) => console.log(`      - ${loc}`));
      if (issue.suggestion) {
        console.log(`    Sugestao: ${issue.suggestion}`);
      }
    });
  }

  if (warnings.length > 0) {
    console.log("\n" + "-".repeat(70));
    console.log(" AVISOS");
    console.log("-".repeat(70));

    warnings.forEach((issue, idx) => {
      console.log(`\n[${idx + 1}] ${issue.rule.toUpperCase()}`);
      console.log(`    Barrel: ${issue.barrel}`);
      console.log(`    ${issue.message}`);
      if (issue.locations.length <= 10) {
        issue.locations.forEach((loc) => console.log(`      ${loc}`));
      } else {
        console.log(`      (${issue.locations.length} star re-exports)`);
      }
      if (issue.suggestion) {
        console.log(`    Sugestao: ${issue.suggestion}`);
      }
    });
  }

  console.log("\n" + "=".repeat(70));
  console.log(" SUMARIO");
  console.log("=".repeat(70));
  console.log(`\n  Erros:  ${report.summary.errors}`);
  console.log(`  Avisos: ${report.summary.warnings}`);

  if (report.summary.errors > 0) {
    console.log(
      "\n  STATUS: FALHOU - corrija os erros acima antes de continuar."
    );
    console.log(
      "\n  Exemplo de boa pratica (src/features/financeiro/domain/index.ts):"
    );
    console.log("    export * as orcamentosTypes from './orcamentos';");
    console.log("    export * as dreTypes from './dre';");
  } else if (report.summary.warnings > 0) {
    console.log("\n  STATUS: OK com avisos");
  } else {
    console.log("\n  STATUS: OK - nenhum problema encontrado.");
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  try {
    const report = await validateAllBarrels();
    printReport(report);

    // Exit code baseado nos erros
    if (report.summary.errors > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("Erro durante validacao:", error);
    process.exit(1);
  }
}

main();
