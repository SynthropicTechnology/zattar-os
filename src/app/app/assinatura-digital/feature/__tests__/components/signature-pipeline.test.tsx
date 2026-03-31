/**
 * Testes: SignaturePipeline e SignatureStatsStrip
 *
 * Verifica renderização dos KPIs e pipeline com dados reais e vazios.
 */

import { render, screen } from '@testing-library/react';
import { SignaturePipeline } from '../../components/signature-pipeline';
import { SignatureStatsStrip } from '../../components/signature-stats-strip';
import { criarStatsMock } from '../fixtures';

// ─── SignaturePipeline ────────────────────────────────────────────────

describe('SignaturePipeline', () => {
  it('deve renderizar título "Pipeline de Assinaturas"', () => {
    render(<SignaturePipeline stats={criarStatsMock()} />);
    expect(screen.getByText('Pipeline de Assinaturas')).toBeInTheDocument();
  });

  it('deve renderizar contagem dos 3 estágios', () => {
    const stats = criarStatsMock({ rascunhos: 4, aguardando: 8, concluidos: 9 });
    render(<SignaturePipeline stats={stats} />);

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('deve renderizar labels dos estágios', () => {
    render(<SignaturePipeline stats={criarStatsMock()} />);

    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('deve mostrar contagem de cancelados', () => {
    const stats = criarStatsMock({ cancelados: 3 });
    render(<SignaturePipeline stats={stats} />);

    expect(screen.getByText('3 cancelados')).toBeInTheDocument();
  });

  it('deve usar singular para 1 cancelado', () => {
    const stats = criarStatsMock({ cancelados: 1 });
    render(<SignaturePipeline stats={stats} />);

    expect(screen.getByText('1 cancelado')).toBeInTheDocument();
  });

  it('deve renderizar taxas de conversão', () => {
    const stats = criarStatsMock({ rascunhos: 10, aguardando: 8, concluidos: 6 });
    render(<SignaturePipeline stats={stats} />);

    // 8/10 = 80% conversão (stage 2)
    expect(screen.getByText('80% conversão')).toBeInTheDocument();
    // 6/8 = 75% conversão (stage 3)
    expect(screen.getByText('75% conversão')).toBeInTheDocument();
  });

  it('deve funcionar com stats zerados', () => {
    const stats = criarStatsMock({
      total: 0, rascunhos: 0, aguardando: 0, concluidos: 0, cancelados: 0,
    });
    const { container } = render(<SignaturePipeline stats={stats} />);
    expect(container).toBeTruthy();
  });
});

// ─── SignatureStatsStrip ──────────────────────────────────────────────

describe('SignatureStatsStrip', () => {
  it('deve renderizar label "Total"', () => {
    render(<SignatureStatsStrip stats={criarStatsMock()} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('deve renderizar label "Taxa Conclusão"', () => {
    render(<SignatureStatsStrip stats={criarStatsMock()} />);
    expect(screen.getByText('Taxa Conclusão')).toBeInTheDocument();
  });

  it('deve renderizar percentual de conclusão', () => {
    const stats = criarStatsMock({ taxaConclusao: 82 });
    render(<SignatureStatsStrip stats={stats} />);

    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('deve renderizar tempo médio', () => {
    const stats = criarStatsMock({ tempoMedio: 3.4 });
    render(<SignatureStatsStrip stats={stats} />);

    expect(screen.getByText('3.4d')).toBeInTheDocument();
    expect(screen.getByText('para conclusão')).toBeInTheDocument();
  });

  it('deve renderizar tendência com delta positivo', () => {
    const stats = criarStatsMock({ trendMensal: [12, 15, 18, 14, 20, 23] });
    render(<SignatureStatsStrip stats={stats} />);

    // 23 - 20 = +3
    expect(screen.getByText('+3 este mês')).toBeInTheDocument();
  });

  it('deve renderizar tendência com delta negativo', () => {
    const stats = criarStatsMock({ trendMensal: [12, 15, 18, 14, 20, 17] });
    render(<SignatureStatsStrip stats={stats} />);

    // 17 - 20 = -3
    expect(screen.getByText('-3 este mês')).toBeInTheDocument();
  });

  it('não deve usar cores hardcoded', () => {
    const { container } = render(<SignatureStatsStrip stats={criarStatsMock()} />);
    const html = container.innerHTML;

    // Verificar que não há cores Tailwind hardcoded no output
    expect(html).not.toMatch(/text-(red|blue|green|gray|amber|orange)-\d{3}/);
  });
});
