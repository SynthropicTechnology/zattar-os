'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { type Signatario, SIGNER_COLORS } from '../types';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseSignersProps {
  initialSigners?: Signatario[];
  currentUserEmail?: string;
  currentUserName?: string;
}

interface UseSignersReturn {
  signers: Signatario[];
  activeSigner: Signatario | null;
  setActiveSigner: (signer: Signatario | null) => void;
  addSigner: (nome: string, email: string) => Signatario | null;
  updateSigner: (id: string, updates: Partial<Pick<Signatario, 'nome' | 'email'>>) => boolean;
  deleteSigner: (id: string) => boolean;
  getSignerById: (id: string) => Signatario | undefined;
  getSignerColor: (signerId: string | undefined) => string;
  setSigners: React.Dispatch<React.SetStateAction<Signatario[]>>;
}

/**
 * Hook for managing signatories in the signature editor
 * Handles CRUD operations for signers with automatic color assignment
 */
export function useSigners({
  initialSigners,
  currentUserEmail: _currentUserEmail = '',
  currentUserName: _currentUserName = 'Você',
}: UseSignersProps = {}): UseSignersReturn {
  // Initialize with provided signers or empty list
  // Note: We no longer auto-create a default signer for the current user
  // because the logged-in user is typically NOT a signatory
  const [signers, setSigners] = useState<Signatario[]>(() => {
    if (initialSigners && initialSigners.length > 0) {
      return initialSigners;
    }
    return [];
  });

  // Track active (selected) signer for field assignment
  const [activeSigner, setActiveSigner] = useState<Signatario | null>(() => {
    if (initialSigners && initialSigners.length > 0) {
      return initialSigners[0];
    }
    return null;
  });

  // Track if we've already synced from initial signers (to avoid re-syncing on every render)
  const hasSyncedRef = useRef(false);

  // Sync signers when initialSigners changes (e.g., after template loads)
  // Using requestAnimationFrame to avoid synchronous setState in effect (ESLint react-hooks/set-state-in-effect)
  useEffect(() => {
    if (initialSigners && initialSigners.length > 0 && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      // Defer state update to next frame to avoid cascading renders
      const frameId = requestAnimationFrame(() => {
        setSigners(initialSigners);
        setActiveSigner(initialSigners[0]);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [initialSigners]);

  /**
   * Get the next available color for a new signer
   */
  const getNextColor = useCallback((): string => {
    const usedColors = new Set(signers.map((s) => s.cor));
    const availableColor = SIGNER_COLORS.find((color) => !usedColors.has(color));
    // If all colors are used, cycle back to the first one
    return availableColor || SIGNER_COLORS[signers.length % SIGNER_COLORS.length];
  }, [signers]);

  /**
   * Add a new signer
   * @returns The created signer or null if validation fails
   */
  const addSigner = useCallback(
    (nome: string, email: string): Signatario | null => {
      // Validate name
      const trimmedName = nome.trim();
      if (trimmedName.length < 3) {
        toast.error('O nome deve ter pelo menos 3 caracteres');
        return null;
      }

      // Validate email
      const trimmedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        toast.error('Email inválido');
        return null;
      }

      // Check for duplicate email
      if (signers.some((s) => s.email.toLowerCase() === trimmedEmail)) {
        toast.error('Já existe um signatário com este email');
        return null;
      }

      const newSigner: Signatario = {
        id: `signer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        nome: trimmedName,
        email: trimmedEmail,
        cor: getNextColor(),
        ordem: signers.length,
      };

      setSigners((prev) => [...prev, newSigner]);
      toast.success(`Signatário "${trimmedName}" adicionado`);

      return newSigner;
    },
    [signers, getNextColor]
  );

  /**
   * Update an existing signer
   * @returns true if update was successful
   */
  const updateSigner = useCallback(
    (id: string, updates: Partial<Pick<Signatario, 'nome' | 'email'>>): boolean => {
      const signer = signers.find((s) => s.id === id);
      if (!signer) {
        toast.error('Signatário não encontrado');
        return false;
      }

      // Validate name if provided
      if (updates.nome !== undefined) {
        const trimmedName = updates.nome.trim();
        if (trimmedName.length < 3) {
          toast.error('O nome deve ter pelo menos 3 caracteres');
          return false;
        }
        updates.nome = trimmedName;
      }

      // Validate email if provided
      if (updates.email !== undefined) {
        const trimmedEmail = updates.email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(trimmedEmail)) {
          toast.error('Email inválido');
          return false;
        }

        // Check for duplicate email (excluding current signer)
        if (signers.some((s) => s.id !== id && s.email.toLowerCase() === trimmedEmail)) {
          toast.error('Já existe um signatário com este email');
          return false;
        }
        updates.email = trimmedEmail;
      }

      setSigners((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                ...updates,
              }
            : s
        )
      );

      // Update active signer if it was the one updated
      if (activeSigner?.id === id) {
        setActiveSigner((prev) => (prev ? { ...prev, ...updates } : prev));
      }

      toast.success('Signatário atualizado');
      return true;
    },
    [signers, activeSigner]
  );

  /**
   * Delete a signer
   * @returns true if deletion was successful
   */
  const deleteSigner = useCallback(
    (id: string): boolean => {
      const signerToDelete = signers.find((s) => s.id === id);
      if (!signerToDelete) {
        toast.error('Signatário não encontrado');
        return false;
      }

      setSigners((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        // Re-order remaining signers
        return filtered.map((s, index) => ({ ...s, ordem: index }));
      });

      // If deleted signer was active, set first remaining signer as active
      if (activeSigner?.id === id) {
        const remainingSigners = signers.filter((s) => s.id !== id);
        setActiveSigner(remainingSigners[0] || null);
      }

      toast.success(`Signatário "${signerToDelete.nome}" removido`);
      return true;
    },
    [signers, activeSigner]
  );

  /**
   * Get a signer by ID
   */
  const getSignerById = useCallback(
    (id: string): Signatario | undefined => {
      return signers.find((s) => s.id === id);
    },
    [signers]
  );

  /**
   * Get the color for a signer by ID
   * Returns a default gray if signer not found
   */
  const getSignerColor = useCallback(
    (signerId: string | undefined): string => {
      if (!signerId) return '#6B7280'; // Default gray
      const signer = signers.find((s) => s.id === signerId);
      return signer?.cor || '#6B7280';
    },
    [signers]
  );

  return useMemo(
    () => ({
      signers,
      activeSigner,
      setActiveSigner,
      addSigner,
      updateSigner,
      deleteSigner,
      getSignerById,
      getSignerColor,
      setSigners,
    }),
    [signers, activeSigner, addSigner, updateSigner, deleteSigner, getSignerById, getSignerColor]
  );
}
