/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useUsuarioPermissoes } from '../use-usuario-permissoes';
import { actionListarPermissoes, actionSalvarPermissoes } from '../../actions/permissoes-actions';

jest.mock('../../actions/permissoes-actions', () => ({
  actionListarPermissoes: jest.fn(),
  actionSalvarPermissoes: jest.fn(),
}));

// Mock permissions-utils to return simple matrix format
jest.mock('../../permissions-utils', () => ({
  formatarPermissoesParaMatriz: jest.fn((permissoes: Array<{ recurso: string; operacao: string; permitido: boolean }>) => {
    // Group by recurso
    const map = new Map<string, { recurso: string; operacoes: Record<string, boolean> }>();
    for (const p of permissoes) {
      if (!map.has(p.recurso)) {
        map.set(p.recurso, { recurso: p.recurso, operacoes: {} });
      }
      map.get(p.recurso)!.operacoes[p.operacao] = p.permitido;
    }
    return Array.from(map.values());
  }),
  formatarMatrizParaPermissoes: jest.fn((matriz: Array<{ recurso: string; operacoes: Record<string, boolean> }>) => {
    const result: Array<{ recurso: string; operacao: string; permitido: boolean }> = [];
    for (const item of matriz) {
      for (const [op, val] of Object.entries(item.operacoes)) {
        result.push({ recurso: item.recurso, operacao: op, permitido: val });
      }
    }
    return result;
  }),
  detectarMudancas: jest.fn((original: unknown[], current: unknown[]) => {
    return JSON.stringify(original) !== JSON.stringify(current);
  }),
}));

const mockActionListarPermissoes = actionListarPermissoes as jest.Mock;
const mockActionSalvarPermissoes = actionSalvarPermissoes as jest.Mock;

describe('useUsuarioPermissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch permissions on mount', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockActionListarPermissoes).toHaveBeenCalledWith(1);
  });

  it('should format permissions into matriz correctly', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
      { recurso: 'financeiro', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Matriz should be grouped by recurso with operacoes map
    expect(result.current.matriz).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recurso: 'processos',
          operacoes: { criar: true, editar: false },
        }),
        expect.objectContaining({
          recurso: 'financeiro',
          operacoes: { criar: true },
        }),
      ])
    );
  });

  it('should toggle permission correctly', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    const updatedMatriz = result.current.matriz.find(
      (p) => p.recurso === 'processos'
    );
    expect(updatedMatriz?.operacoes.criar).toBe(false);
  });

  it('should save permissions correctly', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValue({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    mockActionSalvarPermissoes.mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(mockActionSalvarPermissoes).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({ recurso: 'processos', operacao: 'criar', permitido: false }),
        ])
      );
    });
  });

  it('should set isSaving during save operation', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValue({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    mockActionSalvarPermissoes.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.save();
    });

    expect(result.current.isSaving).toBe(true);

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
  });

  it('should reset matriz to original state', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const originalMatriz = JSON.parse(JSON.stringify(result.current.matriz));

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    expect(result.current.matriz).not.toEqual(originalMatriz);

    act(() => {
      result.current.resetar();
    });

    expect(result.current.matriz).toEqual(originalMatriz);
  });

  it('should detect changes correctly with hasChanges', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.resetar();
    });

    expect(result.current.hasChanges).toBe(false);
  });

  it('should handle fetch error', async () => {
    mockActionListarPermissoes.mockResolvedValueOnce({
      success: false,
      error: 'Erro ao buscar permissões',
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.error).toBe('Erro ao buscar permissões');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle save error', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValue({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    mockActionSalvarPermissoes.mockResolvedValueOnce({
      success: false,
      error: 'Erro ao salvar permissões',
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Erro ao salvar');
      expect(result.current.isSaving).toBe(false);
    });
  });

  it('should handle multiple toggles', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
      { recurso: 'financeiro', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
      result.current.togglePermissao('processos', 'editar');
      result.current.togglePermissao('financeiro', 'criar');
    });

    const processosItem = result.current.matriz.find(m => m.recurso === 'processos');
    const financeiroItem = result.current.matriz.find(m => m.recurso === 'financeiro');
    expect(processosItem?.operacoes.criar).toBe(false);
    expect(processosItem?.operacoes.editar).toBe(true);
    expect(financeiroItem?.operacoes.criar).toBe(false);
  });

  it('should reset hasChanges after successful save', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValue({
      success: true,
      data: {
        usuario_id: 1,
        is_super_admin: false,
        permissoes: mockPermissoes,
      },
    });

    mockActionSalvarPermissoes.mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    expect(result.current.hasChanges).toBe(true);

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(result.current.hasChanges).toBe(false);
    });
  });
});
