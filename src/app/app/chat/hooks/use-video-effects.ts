import { useState, useCallback, useRef, useEffect } from 'react';
import type DyteClient from '@dytesdk/web-core';
import { handleCallError } from '../utils/call-error-handler';

export type VideoEffectType = 'none' | 'blur' | 'image';

interface UseVideoEffectsOptions {
  onErrorHandler?: (error: Error) => void;
}

interface VideoEffectState {
  originalTrack: MediaStreamTrack | null;
  processedStream: MediaStream | null;
  canvas: HTMLCanvasElement | null;
  videoElement: HTMLVideoElement | null;
  animationFrame: number | null;
}

// Check for WebGL support (required for advanced effects)
function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

// Check for GPU acceleration (for future use)
// function hasGPUAcceleration(): boolean {
//   if (typeof navigator === 'undefined') return false;
//   const gpu = (navigator as { gpu?: unknown }).gpu;
//   return !!gpu;
// }

export function useVideoEffects(meeting: DyteClient | undefined, options?: UseVideoEffectsOptions) {
  const [activeEffect, setActiveEffect] = useState<VideoEffectType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('video-effect') as VideoEffectType | null;
      if (saved && ['none', 'blur', 'image'].includes(saved)) {
        return saved;
      }
    }
    return 'none';
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const effectStateRef = useRef<VideoEffectState>({
    originalTrack: null,
    processedStream: null,
    canvas: null,
    videoElement: null,
    animationFrame: null,
  });

  const removeEffectRef = useRef<(() => Promise<void>) | null>(null);

  // Check support on mount
  useEffect(() => {
    setIsSupported(hasWebGLSupport() || true); // Canvas fallback always works
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupEffect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupEffect = useCallback(() => {
    const state = effectStateRef.current;
    
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }
    
    if (state.processedStream) {
      state.processedStream.getTracks().forEach(track => track.stop());
      state.processedStream = null;
    }
    
    if (state.videoElement) {
      state.videoElement.srcObject = null;
      state.videoElement = null;
    }
    
    if (state.canvas) {
      // Canvas cleanup handled by GC
      state.canvas = null;
    }
    
    state.originalTrack = null;
  }, []);

  // Canvas-based blur effect - reserved for future fallback implementation
  // Currently using Dyte middleware which is more performant
  // const applyBlurEffect = useCallback(async (track: MediaStreamTrack): Promise<MediaStream> => {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const video = document.createElement('video');
  //       video.autoplay = true;
  //       video.playsInline = true;
  //       video.srcObject = new MediaStream([track]);
  //       
  //       const canvas = document.createElement('canvas');
  //       const ctx = canvas.getContext('2d', { willReadFrequently: false });
  //       
  //       if (!ctx) {
  //         reject(new Error('Canvas context not available'));
  //         return;
  //       }
  //
  //       video.addEventListener('loadedmetadata', () => {
  //         canvas.width = video.videoWidth || 640;
  //         canvas.height = video.videoHeight || 480;
  //         
  //         const drawFrame = () => {
  //           if (video.readyState >= 2) {
  //             ctx.filter = 'blur(10px)';
  //             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  //             ctx.filter = 'none';
  //           }
  //         };
  //
  //         const animate = () => {
  //           drawFrame();
  //           const frameId = requestAnimationFrame(animate);
  //           effectStateRef.current.animationFrame = frameId;
  //         };
  //
  //         video.addEventListener('play', () => {
  //           animate();
  //         });
  //
  //         video.play().catch(reject);
  //       });
  //
  //       video.addEventListener('error', () => {
  //         reject(new Error('Video element error'));
  //       });
  //
  //       const stream = canvas.captureStream(30); // 30 FPS
  //       
  //       effectStateRef.current.videoElement = video;
  //       effectStateRef.current.canvas = canvas;
  //       effectStateRef.current.processedStream = stream;
  //       
  //       resolve(stream);
  //     } catch (err) {
  //       reject(err);
  //     }
  //   });
  // }, []);

  // Image background effect - reserved for future implementation
  // const applyImageBackground = useCallback(async (track: MediaStreamTrack, _imageUrl?: string): Promise<MediaStream> => {
  //   // For now, use blur as fallback until we implement proper segmentation
  //   // In production, you'd use @dytesdk/video-background-transformer or body-pix
  //   console.warn('Image background not fully implemented, using blur fallback');
  //   return applyBlurEffect(track);
  // }, [applyBlurEffect]);

  const applyEffect = useCallback(async (effect: VideoEffectType, config?: { imageUrl?: string }) => {
    if (!meeting?.self) return;
    if (!isSupported) {
      const error = new Error('Video effects not supported on this device');
      options?.onErrorHandler?.(error);
      handleCallError(error);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Remove existing effect first
      if (activeEffect !== 'none' && removeEffectRef.current) {
        await removeEffectRef.current();
      }

      if (effect === 'none') {
        setActiveEffect('none');
        localStorage.setItem('video-effect', 'none');
        setIsProcessing(false);
        return;
      }

      // Get current video track
      const videoTrack = meeting.self.videoTrack;
      if (!videoTrack) {
        throw new Error('No video track available');
      }

      // Store original track
      effectStateRef.current.originalTrack = videoTrack;

      // Try to use Dyte's video background transformer if available
      try {
        const transformerModule = await import('@dytesdk/video-background-transformer');
        // Try different export patterns
        const DyteVideoBackgroundTransformer = 
          (transformerModule as { DyteVideoBackgroundTransformer?: { init: (config: unknown) => Promise<unknown> } }).DyteVideoBackgroundTransformer ||
          (transformerModule as { default?: { init: (config: unknown) => Promise<unknown> } }).default;
        
        if (DyteVideoBackgroundTransformer && typeof DyteVideoBackgroundTransformer.init === 'function') {
          if (effect === 'blur') {
            const transformer = await DyteVideoBackgroundTransformer.init({
              mode: 'blur',
              blurIntensity: 10,
            });
            if (meeting.self.addVideoMiddleware && transformer) {
              await meeting.self.addVideoMiddleware(transformer as Parameters<typeof meeting.self.addVideoMiddleware>[0]);
            }
            setActiveEffect('blur');
            localStorage.setItem('video-effect', 'blur');
            setIsProcessing(false);
            return;
          } else if (effect === 'image' && config?.imageUrl) {
            const transformer = await DyteVideoBackgroundTransformer.init({
              mode: 'image',
              imageUrl: config.imageUrl,
            });
            if (meeting.self.addVideoMiddleware && transformer) {
              await meeting.self.addVideoMiddleware(transformer as Parameters<typeof meeting.self.addVideoMiddleware>[0]);
            }
            setActiveEffect('image');
            localStorage.setItem('video-effect', 'image');
            setIsProcessing(false);
            return;
          }
        }
      } catch (err) {
        // Fallback: For Canvas-based effects, we'll apply CSS filter in the UI component
        // This is simpler and more performant than replacing the video track
        console.log('Dyte transformer not available, using CSS fallback for video effects', err);
      }

      // For Canvas fallback, we store the effect state and apply CSS filter in the UI
      // This is handled in custom-video-grid.tsx via activeEffect prop
      setActiveEffect(effect);
      localStorage.setItem('video-effect', effect);

    } catch (err) {
      console.error("Failed to apply video effect:", err);
      const error = err instanceof Error ? err : new Error('Unknown error applying effect');
      options?.onErrorHandler?.(error);
      handleCallError(error);
      setActiveEffect('none');
    } finally {
      setIsProcessing(false);
    }
  }, [meeting, options, activeEffect, isSupported]);

  const removeEffect = useCallback(async () => {
    if (!meeting?.self) return;
    
    setIsProcessing(true);
    try {
      // Try to remove Dyte middleware first
      try {
        // Dyte middleware removal: remove all middlewares and re-add if needed
        const self = meeting.self as { removeAllVideoMiddlewares?: () => Promise<{ success: boolean; message: string }> };
        if (typeof self.removeAllVideoMiddlewares === 'function') {
          await self.removeAllVideoMiddlewares();
        }
      } catch {
        // Ignore if API not available
      }

      // Cleanup Canvas-based processing
      cleanupEffect();

      setActiveEffect('none');
      localStorage.setItem('video-effect', 'none');
    } catch (err) {
      console.error("Failed to remove video effect:", err);
      handleCallError(err);
    } finally {
      setIsProcessing(false);
    }
  }, [meeting, cleanupEffect]);

  // Store removeEffect in ref for use in applyEffect
  removeEffectRef.current = removeEffect;

  return {
    activeEffect,
    isProcessing,
    isSupported,
    applyEffect,
    removeEffect
  };
}
