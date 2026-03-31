// using globals

import { renderHook, act } from '@testing-library/react';

import { useWidgetLayout } from '../hooks/use-widget-layout';

// =============================================================================
// Setup localStorage mock
// =============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// =============================================================================
// Helpers
// =============================================================================

const STORAGE_PREFIX = 'zattar-widget-layout';

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}-${userId}`;
}

function salvarNoStorage(userId: number, dados: object) {
  localStorageMock.getItem.mockImplementation((key: string) => {
    if (key === storageKey(userId)) return JSON.stringify(dados);
    return null;
  });
}

// =============================================================================
// Testes
// =============================================================================

describe('useWidgetLayout', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // Reset getItem to return null by default
    localStorageMock.getItem.mockImplementation(() => null);
  });

  describe('estado inicial', () => {
    it('sem dados salvos → enabledWidgets vazio e hasCustomized = false', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      expect(result.current.enabledWidgets).toEqual([]);
      expect(result.current.hasCustomized).toBe(false);
    });

    it('com dados salvos no localStorage → carrega estado persistido', () => {
      const savedState = {
        enabledWidgets: ['widget-clientes', 'widget-processos'],
        lastUpdated: '2024-01-15T10:00:00Z',
      };
      salvarNoStorage(1, savedState);

      const { result } = renderHook(() => useWidgetLayout(1));

      expect(result.current.enabledWidgets).toEqual(['widget-clientes', 'widget-processos']);
      expect(result.current.hasCustomized).toBe(true);
    });

    it('com lastUpdated vazio no storage → hasCustomized = false', () => {
      const savedState = {
        enabledWidgets: ['widget-clientes'],
        lastUpdated: '',
      };
      salvarNoStorage(1, savedState);

      const { result } = renderHook(() => useWidgetLayout(1));

      expect(result.current.hasCustomized).toBe(false);
    });

    it('JSON inválido no localStorage → ignora e inicia com estado vazio', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === storageKey(1)) return 'json-invalido{{{';
        return null;
      });

      const { result } = renderHook(() => useWidgetLayout(1));

      expect(result.current.enabledWidgets).toEqual([]);
      expect(result.current.hasCustomized).toBe(false);
    });
  });

  describe('toggleWidget', () => {
    it('adiciona widget quando não estava habilitado', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.toggleWidget('widget-clientes');
      });

      expect(result.current.enabledWidgets).toContain('widget-clientes');
    });

    it('remove widget quando já estava habilitado', () => {
      const savedState = {
        enabledWidgets: ['widget-clientes', 'widget-processos'],
        lastUpdated: '2024-01-01T00:00:00Z',
      };
      salvarNoStorage(1, savedState);

      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.toggleWidget('widget-clientes');
      });

      expect(result.current.enabledWidgets).not.toContain('widget-clientes');
      expect(result.current.enabledWidgets).toContain('widget-processos');
    });

    it('após toggle → hasCustomized = true', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.toggleWidget('widget-qualquer');
      });

      expect(result.current.hasCustomized).toBe(true);
    });

    it('toggle duas vezes no mesmo widget → estado retorna ao original', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.toggleWidget('widget-a');
      });
      act(() => {
        result.current.toggleWidget('widget-a');
      });

      expect(result.current.enabledWidgets).not.toContain('widget-a');
    });
  });

  describe('setWidgets', () => {
    it('substitui toda a lista de widgets habilitados', () => {
      const savedState = {
        enabledWidgets: ['widget-antigo-1', 'widget-antigo-2'],
        lastUpdated: '2024-01-01T00:00:00Z',
      };
      salvarNoStorage(1, savedState);

      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.setWidgets(['widget-novo-1', 'widget-novo-2', 'widget-novo-3']);
      });

      expect(result.current.enabledWidgets).toEqual([
        'widget-novo-1',
        'widget-novo-2',
        'widget-novo-3',
      ]);
      expect(result.current.enabledWidgets).not.toContain('widget-antigo-1');
    });

    it('setWidgets com lista vazia → enabledWidgets = []', () => {
      const savedState = {
        enabledWidgets: ['widget-a'],
        lastUpdated: '2024-01-01T00:00:00Z',
      };
      salvarNoStorage(1, savedState);

      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.setWidgets([]);
      });

      expect(result.current.enabledWidgets).toEqual([]);
      expect(result.current.hasCustomized).toBe(true);
    });

    it('após setWidgets → hasCustomized = true', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.setWidgets(['widget-x']);
      });

      expect(result.current.hasCustomized).toBe(true);
    });
  });

  describe('resetToDefaults', () => {
    it('limpa o localStorage e reseta o estado', () => {
      const savedState = {
        enabledWidgets: ['widget-clientes', 'widget-processos'],
        lastUpdated: '2024-01-15T10:00:00Z',
      };
      salvarNoStorage(1, savedState);

      const { result } = renderHook(() => useWidgetLayout(1));

      expect(result.current.enabledWidgets).toHaveLength(2);

      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.enabledWidgets).toEqual([]);
      expect(result.current.hasCustomized).toBe(false);
    });

    it('chama localStorage.removeItem com a chave correta', () => {
      const { result } = renderHook(() => useWidgetLayout(42));

      act(() => {
        result.current.resetToDefaults();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(storageKey(42));
    });
  });

  describe('persistência no localStorage', () => {
    it('chama localStorage.setItem quando o estado muda via toggleWidget', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.toggleWidget('widget-financeiro');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey(1),
        expect.stringContaining('widget-financeiro')
      );
    });

    it('chama localStorage.setItem quando o estado muda via setWidgets', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      act(() => {
        result.current.setWidgets(['widget-a', 'widget-b']);
      });

      const chamada = localStorageMock.setItem.mock.calls.find(
        (c: string[]) => c[0] === storageKey(1)
      );
      expect(chamada).toBeDefined();
      const dado = JSON.parse(chamada![1]);
      expect(dado.enabledWidgets).toEqual(['widget-a', 'widget-b']);
    });

    it('NÃO persiste quando lastUpdated está vazio (estado inicial sem customização)', () => {
      renderHook(() => useWidgetLayout(1));

      // Não deve salvar o estado vazio inicial
      const setItemComChave = localStorageMock.setItem.mock.calls.filter(
        (c: string[]) => c[0] === storageKey(1)
      );
      expect(setItemComChave).toHaveLength(0);
    });
  });

  describe('isWidgetEnabled', () => {
    it('retorna true quando widget está habilitado', () => {
      const savedState = {
        enabledWidgets: ['widget-clientes'],
        lastUpdated: '2024-01-01T00:00:00Z',
      };
      salvarNoStorage(1, savedState);

      const { result } = renderHook(() => useWidgetLayout(1));

      expect(result.current.isWidgetEnabled('widget-clientes')).toBe(true);
    });

    it('retorna false quando widget não está habilitado', () => {
      const { result } = renderHook(() => useWidgetLayout(1));

      expect(result.current.isWidgetEnabled('widget-inexistente')).toBe(false);
    });
  });

  describe('diferentes userIds usam chaves de storage separadas', () => {
    it('userId 1 e userId 2 têm chaves independentes', () => {
      const { result: resultUser1 } = renderHook(() => useWidgetLayout(1));
      const { result: resultUser2 } = renderHook(() => useWidgetLayout(2));

      act(() => {
        resultUser1.current.setWidgets(['widget-user1']);
      });

      act(() => {
        resultUser2.current.setWidgets(['widget-user2']);
      });

      const chamadas = localStorageMock.setItem.mock.calls;
      const chavesUsadas = chamadas.map((c: string[]) => c[0]);

      expect(chavesUsadas).toContain(storageKey(1));
      expect(chavesUsadas).toContain(storageKey(2));

      // Chaves diferentes
      expect(storageKey(1)).not.toBe(storageKey(2));
    });

    it('localStorage.getItem é chamado com a chave correta para cada userId', () => {
      renderHook(() => useWidgetLayout(99));

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey(99));
    });
  });
});
