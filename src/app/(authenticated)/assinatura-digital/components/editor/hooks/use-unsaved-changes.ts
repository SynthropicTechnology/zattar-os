'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel?: () => void;
  router: AppRouterInstance;
}

/**
 * Hook for managing unsaved changes detection and navigation blocking
 * Handles beforeunload, popstate, and internal link clicks
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  setHasUnsavedChanges,
  onCancel,
  router,
}: UseUnsavedChangesProps) {
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Mark as dirty (set hasUnsavedChanges to true)
  const markDirty = useCallback(() => {
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  }, [setHasUnsavedChanges]);

  // Mark as clean (set hasUnsavedChanges to false)
  const markClean = useCallback(() => {
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
  }, [setHasUnsavedChanges]);

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      window.history.pushState(null, '', window.location.href);

      setPendingNavigation(() => () => router.back());
      setShowExitConfirmation(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges, router]);

  // Handle internal link clicks
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleLinkClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;

      const target = event.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;

      try {
        const linkUrl = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        if (linkUrl.origin === currentUrl.origin && linkUrl.pathname !== currentUrl.pathname) {
          event.preventDefault();
          event.stopPropagation();
          setPendingNavigation(() => () =>
            router.push(linkUrl.pathname + linkUrl.search + linkUrl.hash)
          );
          setShowExitConfirmation(true);
        }
      } catch (error) {
        console.warn('Invalid URL in link:', anchor.href, error);
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasUnsavedChanges, router]);

  // Handle cancel button
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() =>
        onCancel
          ? () => onCancel()
          : () => router.push('/app/assinatura-digital/templates')
      );
      setShowExitConfirmation(true);
    } else if (onCancel) {
      onCancel();
    } else {
      router.push('/app/assinatura-digital/templates');
    }
  }, [hasUnsavedChanges, onCancel, router]);

  // Confirm exit (discard changes)
  const confirmExit = useCallback(() => {
    setShowExitConfirmation(false);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
    const navigation =
      pendingNavigation ??
      (onCancel ? () => onCancel() : () => router.push('/app/assinatura-digital/templates'));
    setPendingNavigation(null);
    navigation();
  }, [pendingNavigation, onCancel, router, setHasUnsavedChanges]);

  // Cancel exit (keep editing)
  const cancelExit = useCallback(() => {
    setShowExitConfirmation(false);
    setPendingNavigation(null);
  }, []);

  return {
    markDirty,
    markClean,
    showExitConfirmation,
    setShowExitConfirmation,
    pendingNavigation,
    setPendingNavigation,
    handleCancel,
    confirmExit,
    cancelExit,
  };
}
