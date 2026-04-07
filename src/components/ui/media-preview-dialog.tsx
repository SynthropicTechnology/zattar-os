'use client';

import * as React from 'react';
import {
  PreviewImage,
  useImagePreview,
  useImagePreviewValue,
  useScaleInput,
} from '@platejs/media/react';
import { cva } from 'class-variance-authority';
import { ArrowLeft, ArrowRight, Download, Minus, Plus, X } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { cn } from '@/lib/utils';
import { useOrientation } from '@/hooks/use-orientation';

const buttonVariants = cva('rounded bg-[rgba(0,0,0,0.5)] px-1', {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'text-white',
      disabled: 'cursor-not-allowed text-muted-foreground',
    },
  },
});

const SCROLL_SPEED = 4;

export function MediaPreviewDialog() {
  const editor = useEditorRef();
  const isOpen = useImagePreviewValue('isOpen', editor.id);
  const scale = useImagePreviewValue('scale');
  const isEditingScale = useImagePreviewValue('isEditingScale');
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const {
    closeProps,
    currentUrlIndex,
    maskLayerProps,
    nextDisabled,
    nextProps,
    prevDisabled,
    prevProps,
    scaleTextProps,
    zommOutProps,
    zoomInDisabled,
    zoomInProps,
    zoomOutDisabled,
  } = useImagePreview({ scrollSpeed: SCROLL_SPEED });

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-50 h-screen w-screen select-none',
        !isOpen && 'hidden'
      )}
      onContextMenu={(e) => e.stopPropagation()}
      {...maskLayerProps}
    >
      <div className="absolute inset-0 size-full bg-black opacity-30" />
      <div className="absolute inset-0 size-full bg-black opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex max-h-screen w-full items-center">
          <PreviewImage
            className={cn(
              'mx-auto block w-auto object-contain transition-transform',
              isLandscape
                ? 'max-h-[calc(100vh-3rem)] max-w-[calc(100vw-2rem)]'
                : 'max-h-[calc(100vh-4rem)] max-w-[calc(100vw-2rem)]'
            )}
          />
          <div
            className={cn(
              "-translate-x-1/2 absolute left-1/2 z-40 flex w-fit justify-center text-center text-white",
              isLandscape ? "bottom-2 gap-2 p-1" : "bottom-0 gap-4 p-2"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1">
              <button
                {...prevProps}
                className={cn(
                  buttonVariants({
                    variant: prevDisabled ? 'disabled' : 'default',
                  })
                )}
                type="button"
                aria-label="Imagem anterior"
              >
                <ArrowLeft />
              </button>
              {(currentUrlIndex ?? 0) + 1}
              <button
                {...nextProps}
                className={cn(
                  buttonVariants({
                    variant: nextDisabled ? 'disabled' : 'default',
                  })
                )}
                type="button"
                aria-label="Próxima imagem"
              >
                <ArrowRight />
              </button>
            </div>
            <div className="flex">
              <button
                className={cn(
                  buttonVariants({
                    variant: zoomOutDisabled ? 'disabled' : 'default',
                  })
                )}
                {...zommOutProps}
                type="button"
                aria-label="Diminuir zoom"
              >
                <Minus className="size-4" />
              </button>
              <div className="mx-px">
                {isEditingScale ? (
                  <>
                    <ScaleInput className="w-10 rounded px-1 text-muted-foreground outline" />{' '}
                    <span>%</span>
                  </>
                ) : (
                  <span {...scaleTextProps}>{`${scale * 100}%`}</span>
                )}
              </div>
              <button
                className={cn(
                  buttonVariants({
                    variant: zoomInDisabled ? 'disabled' : 'default',
                  })
                )}
                {...zoomInProps}
                type="button"
                aria-label="Aumentar zoom"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {/* TODO: downLoad the image */}
            <button
              className={cn(buttonVariants())}
              type="button"
              aria-label="Baixar imagem"
            >
              <Download className="size-4" />
            </button>
            <button
              {...closeProps}
              className={cn(buttonVariants())}
              type="button"
              aria-label="Fechar visualização"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaleInput(props: React.ComponentProps<'input'>) {
  const { props: scaleInputProps, ref: scaleInputRef } = useScaleInput();

  const setRef = React.useCallback((element: HTMLInputElement | null) => {
    // Set the ref from useScaleInput if it's a mutable ref object
    if (scaleInputRef && typeof scaleInputRef === 'object' && 'current' in scaleInputRef) {
      (scaleInputRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
    }
  }, [scaleInputRef]);

  return (
    <input
      {...scaleInputProps}
      {...props}
      ref={setRef}
    />
  );
}
