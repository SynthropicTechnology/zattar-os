/**
 * Testes: DocumentCard, SignerPill, DocumentListRow, DocumentDetail
 *
 * Verifica renderização, tokens de design e interatividade.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentCard, STATUS_CONFIG, getSignerProgress, timeAgo } from '../../components/documento-card';
import { SignerPill } from '../../components/signer-pill';
import { DocumentListRow } from '../../components/documento-list-row';
import { DocumentDetail } from '../../components/documento-detail';
import {
  criarDocumentoCardDataMock,
  criarAssinanteConcluido,
  criarAssinantePendente,
  criarAssinanteAtrasado,
} from '../fixtures';

// ─── STATUS_CONFIG ────────────────────────────────────────────────────

describe('STATUS_CONFIG', () => {
  it('deve ter configuração para todos os status', () => {
    expect(STATUS_CONFIG).toHaveProperty('rascunho');
    expect(STATUS_CONFIG).toHaveProperty('pronto');
    expect(STATUS_CONFIG).toHaveProperty('concluido');
    expect(STATUS_CONFIG).toHaveProperty('cancelado');
  });

  it('deve usar tokens semânticos de cor (sem hardcoded tailwind colors)', () => {
    const allColors = Object.values(STATUS_CONFIG).flatMap(cfg => [cfg.color, cfg.bg]);

    for (const cls of allColors) {
      // Não deve ter cores hardcoded como text-red-500, bg-blue-100
      expect(cls).not.toMatch(/text-(red|blue|green|gray|amber|orange|emerald|sky)-\d/);
      expect(cls).not.toMatch(/bg-(red|blue|green|gray|amber|orange|emerald|sky)-\d/);
    }
  });

  it('deve usar tokens válidos em cssColor (var(--token) apenas)', () => {
    // IMPORTANTE: o padrão hsl(var(--token)) é CSS INVÁLIDO porque globals.css
    // define tokens em OKLCH — hsl(oklch(...)) não renderiza. Esta asserção
    // bloqueia regressão do bug que afetava 36 arquivos antes da migração.
    for (const cfg of Object.values(STATUS_CONFIG)) {
      // Não deve usar o padrão buggy
      expect(cfg.cssColor).not.toMatch(/hsl\(\s*var\(\s*--/);

      // Não deve usar oklch() direto (Design System proíbe oklch direto)
      expect(cfg.cssColor).not.toMatch(/oklch\(/);

      // Deve usar var(--token) direto
      const usesVar = /^var\(--[a-z0-9-]+\)$/.test(cfg.cssColor);
      expect(usesVar).toBe(true);
    }
  });
});

// ─── getSignerProgress ────────────────────────────────────────────────

describe('getSignerProgress', () => {
  it('deve calcular progresso correto com assinantes mistos', () => {
    const doc = criarDocumentoCardDataMock();
    const progress = getSignerProgress(doc);

    expect(progress.signed).toBe(2);
    expect(progress.total).toBe(3);
    expect(progress.percent).toBe(67);
  });

  it('deve retornar 100% quando todos assinaram', () => {
    const doc = criarDocumentoCardDataMock({
      assinantes: [
        criarAssinanteConcluido(),
        criarAssinanteConcluido({ nome: 'Dr. Marcos' }),
      ],
    });
    const progress = getSignerProgress(doc);

    expect(progress.percent).toBe(100);
  });

  it('deve retornar 0% sem assinantes', () => {
    const doc = criarDocumentoCardDataMock({ assinantes: [] });
    const progress = getSignerProgress(doc);

    expect(progress.signed).toBe(0);
    expect(progress.total).toBe(0);
    expect(progress.percent).toBe(0);
  });
});

// ─── timeAgo ──────────────────────────────────────────────────────────

describe('timeAgo', () => {
  it('deve retornar "hoje" para data de hoje', () => {
    const today = new Date().toISOString();
    expect(timeAgo(today)).toBe('hoje');
  });

  it('deve retornar "ontem" para ontem', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(timeAgo(yesterday)).toBe('ontem');
  });

  it('deve retornar "Xd atrás" para dias recentes', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d atrás');
  });

  it('deve retornar "Xsem atrás" para semanas', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(timeAgo(twoWeeksAgo)).toBe('2sem atrás');
  });
});

// ─── SignerPill ───────────────────────────────────────────────────────

describe('SignerPill', () => {
  it('deve renderizar assinante concluído com ícone de check', () => {
    const { container } = render(<SignerPill assinante={criarAssinanteConcluido()} />);

    const pill = container.firstElementChild!;
    expect(pill.className).toContain('bg-success/6');
    expect(pill.className).toContain('text-success/60');
    expect(pill.textContent).toContain('Maria');
  });

  it('deve renderizar assinante pendente com estilo neutro', () => {
    const { container } = render(<SignerPill assinante={criarAssinantePendente()} />);

    const pill = container.firstElementChild!;
    expect(pill.className).toContain('bg-border/6');
    expect(pill.className).toContain('text-muted-foreground/60');
  });

  it('deve renderizar assinante atrasado (>7d) com estilo warning', () => {
    const { container } = render(<SignerPill assinante={criarAssinanteAtrasado()} />);

    const pill = container.firstElementChild!;
    expect(pill.className).toContain('bg-warning/6');
    expect(pill.className).toContain('text-warning/60');
    expect(pill.textContent).toContain('12d');
  });

  it('deve usar apenas tokens semânticos (sem cores hardcoded)', () => {
    const { container } = render(<SignerPill assinante={criarAssinanteConcluido()} />);

    const pill = container.firstElementChild!;
    expect(pill.className).not.toMatch(/(text|bg)-(red|blue|green|gray|amber)-\d/);
  });
});

// ─── DocumentCard ─────────────────────────────────────────────────────

describe('DocumentCard', () => {
  it('deve renderizar título do documento', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    expect(screen.getByText('Contrato de Honorários — Maria Silva')).toBeInTheDocument();
  });

  it('deve renderizar badge de status', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });

  it('deve renderizar signer pills', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    expect(screen.getByText('Maria')).toBeInTheDocument();
  });

  it('deve mostrar ícone de selfie quando habilitada', () => {
    const doc = criarDocumentoCardDataMock({ selfieHabilitada: true });
    const { container } = render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    // Camera icon present (SVG with lucide class)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('deve mostrar badge formulário quando origem é formulario', () => {
    const doc = criarDocumentoCardDataMock({ origem: 'formulario' });
    render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    expect(screen.getByText('formulário')).toBeInTheDocument();
  });

  it('deve mostrar mensagem para rascunho sem assinantes', () => {
    const doc = criarDocumentoCardDataMock({ status: 'rascunho', assinantes: [] });
    render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    expect(screen.getByText('Sem assinantes configurados')).toBeInTheDocument();
  });

  it('deve chamar onSelect ao clicar', () => {
    const onSelect = jest.fn();
    const doc = criarDocumentoCardDataMock();
    render(<DocumentCard doc={doc} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Contrato de Honorários — Maria Silva'));
    expect(onSelect).toHaveBeenCalledWith(doc);
  });

  it('deve ter ring warning quando assinante pendente >7d', () => {
    const doc = criarDocumentoCardDataMock({
      assinantes: [criarAssinanteAtrasado()],
    });
    const { container } = render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    const panel = container.firstElementChild!;
    expect(panel.className).toContain('ring-warning/15');
  });

  it('deve ter cursor-pointer', () => {
    const doc = criarDocumentoCardDataMock();
    const { container } = render(<DocumentCard doc={doc} onSelect={jest.fn()} />);

    const panel = container.firstElementChild!;
    expect(panel.className).toContain('cursor-pointer');
  });
});

// ─── DocumentListRow ──────────────────────────────────────────────────

describe('DocumentListRow', () => {
  it('deve renderizar titulo e autor', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentListRow doc={doc} onSelect={jest.fn()} selected={false} />);

    expect(screen.getByText('Contrato de Honorários — Maria Silva')).toBeInTheDocument();
  });

  it('deve ter estilo selecionado quando selected=true', () => {
    const doc = criarDocumentoCardDataMock();
    const { container } = render(
      <DocumentListRow doc={doc} onSelect={jest.fn()} selected={true} />,
    );

    const row = container.firstElementChild!;
    expect(row.className).toContain('bg-primary/6');
    expect(row.className).toContain('border-primary/15');
  });

  it('deve ter hover state quando não selecionado', () => {
    const doc = criarDocumentoCardDataMock();
    const { container } = render(
      <DocumentListRow doc={doc} onSelect={jest.fn()} selected={false} />,
    );

    const row = container.firstElementChild!;
    expect(row.className).toContain('hover:bg-white/4');
  });

  it('deve chamar onSelect ao clicar', () => {
    const onSelect = jest.fn();
    const doc = criarDocumentoCardDataMock();
    render(<DocumentListRow doc={doc} onSelect={onSelect} selected={false} />);

    fireEvent.click(screen.getByText('Contrato de Honorários — Maria Silva'));
    expect(onSelect).toHaveBeenCalledWith(doc);
  });
});

// ─── DocumentDetail ───────────────────────────────────────────────────

describe('DocumentDetail', () => {
  it('deve renderizar titulo e status', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentDetail doc={doc} onClose={jest.fn()} />);

    expect(screen.getByText('Contrato de Honorários — Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });

  it('deve renderizar lista de assinantes com status', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentDetail doc={doc} onClose={jest.fn()} />);

    expect(screen.getByText('Maria Fernanda Silva')).toBeInTheDocument();
    // Dr. Marcos Vieira may appear in both signers list and metadata
    expect(screen.getAllByText('Dr. Marcos Vieira').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('João Carlos Pereira')).toBeInTheDocument();
  });

  it('deve renderizar contagem de assinantes', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentDetail doc={doc} onClose={jest.fn()} />);

    expect(screen.getByText('2/3 assinantes')).toBeInTheDocument();
    expect(screen.getByText('1 pendente')).toBeInTheDocument();
  });

  it('deve renderizar metadata', () => {
    const doc = criarDocumentoCardDataMock();
    render(<DocumentDetail doc={doc} onClose={jest.fn()} />);

    // Dr. Marcos Vieira appears in both signers and metadata sections
    expect(screen.getAllByText('Dr. Marcos Vieira').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Íntegro')).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão X', () => {
    const onClose = jest.fn();
    const doc = criarDocumentoCardDataMock();
    const { container } = render(<DocumentDetail doc={doc} onClose={onClose} />);

    // Find the close button (first button in the header)
    const closeButton = container.querySelector('button');
    fireEvent.click(closeButton!);
    expect(onClose).toHaveBeenCalled();
  });

  it('deve mostrar botão "Reenviar convites" para docs prontos com pendentes', () => {
    const doc = criarDocumentoCardDataMock({ status: 'pronto' });
    render(<DocumentDetail doc={doc} onClose={jest.fn()} />);

    expect(screen.getByText('Reenviar convites')).toBeInTheDocument();
  });

  it('deve ter todos os botões com cursor-pointer', () => {
    const doc = criarDocumentoCardDataMock({ status: 'pronto' });
    const { container } = render(<DocumentDetail doc={doc} onClose={jest.fn()} />);

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      expect(btn.className).toContain('cursor-pointer');
    });
  });
});
