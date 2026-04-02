'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { TimelineItemUnificado } from '../components/timeline/types';
import type { ProcessoWorkspaceAnnotation as PersistedAnnotation } from '../workspace-annotations-domain';
import {
  actionCriarProcessoWorkspaceAnotacao,
  actionDeletarProcessoWorkspaceAnotacao,
  actionListarProcessoWorkspaceAnotacoes,
} from '../actions/workspace-annotations-actions';

export interface ProcessoWorkspaceAnnotation {
  id: string;
  processoId?: number;
  timelineItemId: number;
  content: string;
  createdAt: string;
  itemTitle?: string;
  itemDate?: string;
  persisted?: boolean;
}

type AnnotationMap = Record<string, ProcessoWorkspaceAnnotation[]>;

interface UseProcessoWorkspaceAnnotationsParams {
  processoId: number;
  numeroProcesso?: string;
  selectedItem: TimelineItemUnificado | null;
}

function buildStorageKey(processoId: number) {
  return `processo-workspace-annotations:${processoId}`;
}

function readCachedAnnotations(storageKey: string): AnnotationMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? (JSON.parse(rawValue) as AnnotationMap) : {};
  } catch {
    return {};
  }
}

function toPersistedClientAnnotation(
  annotation: PersistedAnnotation
): ProcessoWorkspaceAnnotation {
  return {
    id: `db-${annotation.id}`,
    processoId: annotation.processoId,
    timelineItemId: annotation.timelineItemId,
    content: annotation.content,
    createdAt: annotation.createdAt,
    itemTitle: annotation.itemTitle ?? undefined,
    itemDate: annotation.itemDate ?? undefined,
    persisted: true,
  };
}

function mergeRemoteAnnotations(
  cached: AnnotationMap,
  remote: AnnotationMap
): AnnotationMap {
  const merged: AnnotationMap = { ...remote };

  for (const [itemKey, cachedAnnotations] of Object.entries(cached)) {
    const remoteIds = new Set((remote[itemKey] ?? []).map((annotation) => annotation.id));
    const localOnlyAnnotations = cachedAnnotations.filter(
      (annotation) => !annotation.id.startsWith('db-') && !remoteIds.has(annotation.id)
    );

    if (localOnlyAnnotations.length > 0) {
      merged[itemKey] = [...(merged[itemKey] ?? []), ...localOnlyAnnotations].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    }
  }

  return merged;
}

function groupRemoteAnnotations(
  annotations: PersistedAnnotation[]
): AnnotationMap {
  return annotations.reduce<AnnotationMap>((grouped, annotation) => {
    const itemKey = String(annotation.timelineItemId);
    grouped[itemKey] = [...(grouped[itemKey] ?? []), toPersistedClientAnnotation(annotation)];
    return grouped;
  }, {});
}

export function useProcessoWorkspaceAnnotations({
  processoId,
  numeroProcesso,
  selectedItem,
}: UseProcessoWorkspaceAnnotationsParams) {
  const storageKey = buildStorageKey(processoId);
  const [annotationsByItemId, setAnnotationsByItemId] = useState<AnnotationMap>({});

  useEffect(() => {
    setAnnotationsByItemId(readCachedAnnotations(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(annotationsByItemId));
  }, [annotationsByItemId, storageKey]);

  useEffect(() => {
    let active = true;

    async function loadRemoteAnnotations() {
      const result = await actionListarProcessoWorkspaceAnotacoes({ processoId });
      if (!active || !result.success) {
        return;
      }

      const groupedRemote = groupRemoteAnnotations(result.data);
      setAnnotationsByItemId((currentAnnotations) =>
        mergeRemoteAnnotations(currentAnnotations, groupedRemote)
      );
    }

    void loadRemoteAnnotations();

    return () => {
      active = false;
    };
  }, [processoId]);

  const selectedItemKey = selectedItem ? String(selectedItem.id) : null;

  const currentAnnotations = useMemo(() => {
    if (!selectedItemKey) return [];
    return annotationsByItemId[selectedItemKey] ?? [];
  }, [annotationsByItemId, selectedItemKey]);

  const totalAnnotations = useMemo(
    () =>
      Object.values(annotationsByItemId).reduce(
        (total, itemAnnotations) => total + itemAnnotations.length,
        0
      ),
    [annotationsByItemId]
  );

  const addAnnotation = useCallback(
    async (content: string) => {
      if (!selectedItem) return;

      const itemKey = String(selectedItem.id);
      const localAnnotation: ProcessoWorkspaceAnnotation = {
        id: `local-${selectedItem.id}-${Date.now()}`,
        processoId,
        timelineItemId: selectedItem.id,
        content,
        createdAt: new Date().toISOString(),
        itemTitle: selectedItem.titulo,
        itemDate: selectedItem.data,
        persisted: false,
      };

      setAnnotationsByItemId((currentAnnotations) => ({
        ...currentAnnotations,
        [itemKey]: [localAnnotation, ...(currentAnnotations[itemKey] ?? [])],
      }));

      if (!numeroProcesso) {
        toast.error('Anotação salva apenas localmente. Número do processo indisponível para persistência.');
        return;
      }

      const result = await actionCriarProcessoWorkspaceAnotacao({
        processoId,
        numeroProcesso,
        timelineItemId: selectedItem.id,
        itemTitle: selectedItem.titulo,
        itemDate: selectedItem.data,
        content,
        anchor: {},
      });

      if (!result.success) {
        toast.error('Anotação salva localmente. A persistência remota ainda não está disponível neste ambiente.');
        return;
      }

      const persistedAnnotation = toPersistedClientAnnotation(result.data);

      setAnnotationsByItemId((currentAnnotations) => ({
        ...currentAnnotations,
        [itemKey]: (currentAnnotations[itemKey] ?? []).map((annotation) =>
          annotation.id === localAnnotation.id ? persistedAnnotation : annotation
        ),
      }));
    },
    [numeroProcesso, processoId, selectedItem]
  );

  const deleteAnnotation = useCallback(
    async (annotationId: string) => {
      if (!selectedItemKey) return;

      const previousAnnotations = annotationsByItemId;
      setAnnotationsByItemId((currentAnnotations) => ({
        ...currentAnnotations,
        [selectedItemKey]: (currentAnnotations[selectedItemKey] ?? []).filter(
          (annotation) => annotation.id !== annotationId
        ),
      }));

      if (!annotationId.startsWith('db-')) {
        return;
      }

      const numericId = Number(annotationId.replace('db-', ''));
      if (Number.isNaN(numericId)) {
        return;
      }

      const result = await actionDeletarProcessoWorkspaceAnotacao({
        annotationId: numericId,
        processoId,
      });

      if (!result.success) {
        setAnnotationsByItemId(previousAnnotations);
        toast.error('Não foi possível remover a anotação remota.');
      }
    },
    [annotationsByItemId, processoId, selectedItemKey]
  );

  return {
    annotationsByItemId,
    currentAnnotations,
    totalAnnotations,
    addAnnotation,
    deleteAnnotation,
  };
}