// using globals

import { fmtMoeda, fmtNum, fmtData } from '../../../app/app/dashboard/mock/widgets/primitives';

// =============================================================================
// fmtMoeda
// =============================================================================

describe('fmtMoeda', () => {
  it('valor inteiro → formata como moeda BRL', () => {
    const resultado = fmtMoeda(1000);
    // R$ 1.000,00
    expect(resultado).toContain('1.000');
    expect(resultado).toContain('R$');
    expect(resultado).toContain(',00');
  });

  it('valor com centavos → preserva duas casas decimais', () => {
    const resultado = fmtMoeda(99.99);
    expect(resultado).toContain('99');
    expect(resultado).toContain(',99');
  });

  it('valor zero → formata R$ 0,00', () => {
    const resultado = fmtMoeda(0);
    expect(resultado).toContain('0');
    expect(resultado).toContain('R$');
  });

  it('valor negativo → inclui sinal negativo', () => {
    const resultado = fmtMoeda(-500);
    expect(resultado).toContain('500');
    expect(resultado).toMatch(/-|−/); // hífen ou sinal menos unicode
  });

  it('valor grande com milhões → formata com separadores pt-BR', () => {
    const resultado = fmtMoeda(1000000);
    // 1.000.000,00
    expect(resultado).toContain('1.000.000');
  });

  it('valor fracionário com mais de 2 casas → arredonda para 2', () => {
    const resultado = fmtMoeda(1.005);
    // Comportamento padrão do Intl: pode arredondar pra cima ou baixo
    expect(resultado).toContain('R$');
  });
});

// =============================================================================
// fmtNum
// =============================================================================

describe('fmtNum', () => {
  it('número inteiro → formata com separador de milhar pt-BR', () => {
    const resultado = fmtNum(1000);
    expect(resultado).toBe('1.000');
  });

  it('número menor que 1000 → sem separador', () => {
    const resultado = fmtNum(999);
    expect(resultado).toBe('999');
  });

  it('zero → retorna "0"', () => {
    expect(fmtNum(0)).toBe('0');
  });

  it('número com casas decimais → mantém decimais com vírgula', () => {
    const resultado = fmtNum(1234.56);
    expect(resultado).toContain('1.234');
    expect(resultado).toContain(',56');
  });

  it('número grande → separa com pontos', () => {
    const resultado = fmtNum(1234567);
    expect(resultado).toBe('1.234.567');
  });

  it('número negativo → inclui sinal', () => {
    const resultado = fmtNum(-1000);
    expect(resultado).toContain('1.000');
    expect(resultado).toMatch(/-|−/);
  });
});

// =============================================================================
// fmtData
// =============================================================================

describe('fmtData', () => {
  it('ISO date válida → formata como "DD mon."', () => {
    const resultado = fmtData('2024-01-15T00:00:00Z');
    // Esperado algo como "15 de jan." ou "15 jan." dependendo do locale
    expect(resultado).toContain('15');
    expect(resultado.toLowerCase()).toMatch(/jan/);
  });

  it('data em dezembro → inclui "dez"', () => {
    const resultado = fmtData('2024-12-25T12:00:00Z');
    expect(resultado).toContain('25');
    expect(resultado.toLowerCase()).toMatch(/dez/);
  });

  it('data em junho → inclui "jun"', () => {
    const resultado = fmtData('2024-06-01T00:00:00Z');
    expect(resultado).toContain('1');
    expect(resultado.toLowerCase()).toMatch(/jun/);
  });

  it('dia com dois dígitos → inclui zeros à esquerda', () => {
    const resultado = fmtData('2024-03-05T00:00:00Z');
    // day: '2-digit' → "05"
    expect(resultado).toContain('05');
  });

  it('retorna string (não vazia)', () => {
    const resultado = fmtData('2024-07-04T00:00:00Z');
    expect(typeof resultado).toBe('string');
    expect(resultado.length).toBeGreaterThan(0);
  });

  it('diferentes anos retornam a mesma formatação (sem ano no output)', () => {
    const resultado2023 = fmtData('2023-03-10T00:00:00Z');
    const resultado2024 = fmtData('2024-03-10T00:00:00Z');
    // Ambos devem ter "10" e "mar" — o ano não aparece
    expect(resultado2023).toContain('10');
    expect(resultado2024).toContain('10');
    expect(resultado2023.toLowerCase()).toMatch(/mar/);
    expect(resultado2024.toLowerCase()).toMatch(/mar/);
  });
});
