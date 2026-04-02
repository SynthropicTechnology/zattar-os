import { useState, useEffect, useRef, useCallback } from 'react';

export interface DeviceTestState {
  videoStream: MediaStream | null;
  audioLevel: number;
  isTestingVideo: boolean;
  isTestingAudio: boolean;
  error: string | null;
}

export const useDeviceTest = () => {
  const [state, setState] = useState<DeviceTestState>({
    videoStream: null,
    audioLevel: 0,
    isTestingVideo: false,
    isTestingAudio: false,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioAnimationRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const stopVideoTest = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    setState(prev => ({ ...prev, videoStream: null, isTestingVideo: false }));
  }, []);

  const startVideoTest = useCallback(async (deviceId: string) => {
    stopVideoTest();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      videoStreamRef.current = stream;
      setState(prev => ({ ...prev, videoStream: stream, isTestingVideo: true, error: null }));
    } catch (err) {
      console.error('Error starting video test:', err);
      setState(prev => ({ ...prev, error: 'Erro ao iniciar teste de vídeo.' }));
    }
  }, [stopVideoTest]);

  const stopAudioTest = useCallback(() => {
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
      audioAnimationRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    setState(prev => ({ ...prev, audioLevel: 0, isTestingAudio: false }));
  }, []);

  const startAudioTest = useCallback(async (deviceId: string) => {
    stopAudioTest();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      audioStreamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext não suportado neste navegador');
      }
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate RMS (Root Mean Square) for volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        
        // Normalize to 0-100 (approximate)
        const normalized = Math.min(100, (rms / 255) * 400); // Amplified slightly for visibility
        
        setState(prev => ({ ...prev, audioLevel: normalized }));
        audioAnimationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      setState(prev => ({ ...prev, isTestingAudio: true, error: null }));
      updateAudioLevel();
      
    } catch (err) {
      console.error('Error starting audio test:', err);
      setState(prev => ({ ...prev, error: 'Erro ao iniciar teste de áudio.' }));
    }
  }, [stopAudioTest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideoTest();
      stopAudioTest();
    };
  }, [stopVideoTest, stopAudioTest]);

  return {
    ...state,
    startVideoTest,
    stopVideoTest,
    startAudioTest,
    stopAudioTest
  };
};
