import { renderHook, act } from '@testing-library/react';
import { useSigners } from '@/shared/assinatura-digital/hooks/use-signers';
import { SIGNER_COLORS } from '../types';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Helper: create a default initial signer for tests that need one
const defaultInitialSigners = [
  { id: 'signer-default', nome: 'Teste User', email: 'teste@example.com', cor: SIGNER_COLORS[0], ordem: 0 },
];

describe('useSigners', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty list when no initial signers provided', () => {
      const { result } = renderHook(() =>
        useSigners({
          currentUserName: 'Teste User',
          currentUserEmail: 'teste@example.com',
        })
      );

      // Hook no longer auto-creates a default signer
      expect(result.current.signers).toHaveLength(0);
      expect(result.current.activeSigner).toBeNull();
    });

    it('should initialize with provided initial signers', () => {
      const initialSigners = [
        { id: 'signer-1', nome: 'Signer 1', email: 'signer1@test.com', cor: '#FF0000', ordem: 0 },
        { id: 'signer-2', nome: 'Signer 2', email: 'signer2@test.com', cor: '#00FF00', ordem: 1 },
      ];

      const { result } = renderHook(() => useSigners({ initialSigners }));

      expect(result.current.signers).toHaveLength(2);
      expect(result.current.signers[0].nome).toBe('Signer 1');
      expect(result.current.activeSigner).toEqual(initialSigners[0]);
    });
  });

  describe('addSigner', () => {
    it('should add a new signer with correct color', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      act(() => {
        result.current.addSigner('New Signer', 'new@example.com');
      });

      expect(result.current.signers).toHaveLength(2);
      const newSigner = result.current.signers[1];
      expect(newSigner.nome).toBe('New Signer');
      expect(newSigner.email).toBe('new@example.com');
      expect(newSigner.cor).toBe(SIGNER_COLORS[1]); // Second color
      expect(newSigner.ordem).toBe(1);
    });

    it('should reject signer with name less than 3 characters', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      act(() => {
        const signer = result.current.addSigner('AB', 'ab@example.com');
        expect(signer).toBeNull();
      });

      expect(result.current.signers).toHaveLength(1); // Still only initial signer
    });

    it('should reject signer with invalid email', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      act(() => {
        const signer = result.current.addSigner('Valid Name', 'invalid-email');
        expect(signer).toBeNull();
      });

      expect(result.current.signers).toHaveLength(1);
    });

    it('should reject duplicate email', () => {
      const { result } = renderHook(() =>
        useSigners({
          initialSigners: defaultInitialSigners,
        })
      );

      act(() => {
        const signer = result.current.addSigner('Another User', 'teste@example.com');
        expect(signer).toBeNull();
      });

      expect(result.current.signers).toHaveLength(1);
    });
  });

  describe('updateSigner', () => {
    it('should update signer name', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;

      act(() => {
        const success = result.current.updateSigner(signerId, { nome: 'Updated Name' });
        expect(success).toBe(true);
      });

      expect(result.current.signers[0].nome).toBe('Updated Name');
    });

    it('should update signer email', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;

      act(() => {
        const success = result.current.updateSigner(signerId, { email: 'updated@example.com' });
        expect(success).toBe(true);
      });

      expect(result.current.signers[0].email).toBe('updated@example.com');
    });

    it('should update active signer if it was updated', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;

      act(() => {
        result.current.updateSigner(signerId, { nome: 'Updated Name' });
      });

      expect(result.current.activeSigner?.nome).toBe('Updated Name');
    });

    it('should reject invalid name update', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;
      const originalName = result.current.signers[0].nome;

      act(() => {
        const success = result.current.updateSigner(signerId, { nome: 'AB' });
        expect(success).toBe(false);
      });

      expect(result.current.signers[0].nome).toBe(originalName);
    });

    it('should reject invalid email update', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;
      const originalEmail = result.current.signers[0].email;

      act(() => {
        const success = result.current.updateSigner(signerId, { email: 'invalid' });
        expect(success).toBe(false);
      });

      expect(result.current.signers[0].email).toBe(originalEmail);
    });
  });

  describe('deleteSigner', () => {
    it('should delete a signer', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      // Add a second signer first
      act(() => {
        result.current.addSigner('Second Signer', 'second@example.com');
      });

      expect(result.current.signers).toHaveLength(2);

      const secondSignerId = result.current.signers[1].id;

      act(() => {
        const success = result.current.deleteSigner(secondSignerId);
        expect(success).toBe(true);
      });

      expect(result.current.signers).toHaveLength(1);
    });

    it('should allow deleting the last signer', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;

      act(() => {
        const success = result.current.deleteSigner(signerId);
        expect(success).toBe(true);
      });

      expect(result.current.signers).toHaveLength(0);
    });

    it('should update active signer when deleted signer was active', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      // Add a second signer and make it active
      let secondSigner: { id: string } | null = null;
      act(() => {
        secondSigner = result.current.addSigner('Second Signer', 'second@example.com');
        if (secondSigner) {
          result.current.setActiveSigner(secondSigner as any);
        }
      });

      expect(result.current.activeSigner?.id).toBe(secondSigner?.id);

      // Delete the active signer
      act(() => {
        result.current.deleteSigner(secondSigner!.id);
      });

      // Active signer should switch to first remaining signer
      expect(result.current.activeSigner?.id).toBe(result.current.signers[0].id);
    });

    it('should re-order remaining signers after deletion', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      // Add more signers
      act(() => {
        result.current.addSigner('Second', 'second@example.com');
        result.current.addSigner('Third', 'third@example.com');
      });

      // Delete the second one (index 1)
      const secondId = result.current.signers[1].id;

      act(() => {
        result.current.deleteSigner(secondId);
      });

      expect(result.current.signers).toHaveLength(2);
      expect(result.current.signers[0].ordem).toBe(0);
      expect(result.current.signers[1].ordem).toBe(1);
    });
  });

  describe('getSignerById', () => {
    it('should return signer by id', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;
      const signer = result.current.getSignerById(signerId);

      expect(signer).toBeDefined();
      expect(signer?.id).toBe(signerId);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signer = result.current.getSignerById('non-existent');

      expect(signer).toBeUndefined();
    });
  });

  describe('getSignerColor', () => {
    it('should return signer color by id', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const signerId = result.current.signers[0].id;
      const color = result.current.getSignerColor(signerId);

      expect(color).toBe(SIGNER_COLORS[0]);
    });

    it('should return default gray for undefined id', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const color = result.current.getSignerColor(undefined);

      expect(color).toBe('#6B7280');
    });

    it('should return default gray for non-existent id', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      const color = result.current.getSignerColor('non-existent');

      expect(color).toBe('#6B7280');
    });
  });

  describe('setActiveSigner', () => {
    it('should set active signer', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      // Add a second signer
      let secondSigner: any;
      act(() => {
        secondSigner = result.current.addSigner('Second', 'second@example.com');
      });

      act(() => {
        result.current.setActiveSigner(secondSigner);
      });

      expect(result.current.activeSigner?.id).toBe(secondSigner.id);
    });

    it('should allow setting active signer to null', () => {
      const { result } = renderHook(() => useSigners({ initialSigners: defaultInitialSigners }));

      act(() => {
        result.current.setActiveSigner(null);
      });

      expect(result.current.activeSigner).toBeNull();
    });
  });
});
