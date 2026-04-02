import { useState, useEffect, useCallback } from 'react';

export interface MediaDevicesState {
  videoDevices: MediaDeviceInfo[];
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedVideoDevice: string | null;
  selectedAudioInput: string | null;
  selectedAudioOutput: string | null;
  isLoading: boolean;
  error: string | null;
  hasPermissions: boolean;
}

export const useMediaDevices = ({ enabled = false }: { enabled?: boolean } = {}) => {
  const [state, setState] = useState<MediaDevicesState>({
    videoDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],
    selectedVideoDevice: null,
    selectedAudioInput: null,
    selectedAudioOutput: null,
    isLoading: true,
    error: null,
    hasPermissions: false,
  });

  const getMediaStream = useCallback(async (constraints: MediaStreamConstraints) => {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw err;
    }
  }, []);

  const enumerateDevices = useCallback(async () => {
    try {
      // Primeiro pedimos permissão para ter acesso aos labels dos dispositivos
      // Se não tiver permissão, os labels virão vazios
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(track => track.stop());
        setState(prev => ({ ...prev, hasPermissions: true, error: null }));
      } catch (err) {
        console.warn('Permissions denied or error requesting initial stream:', err);
        // Não lançamos erro aqui, pois podemos querer apenas listar o que for possível
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasPermissions: false,
          error: 'Permissão de acesso à câmera/microfone negada.'
        }));
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');

      setState(prev => {
        // Tenta recuperar do localStorage ou usa o primeiro disponível
        const savedVideo = localStorage.getItem('selectedVideoDevice');
        const savedAudioInput = localStorage.getItem('selectedAudioInput');
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');

        const validVideo = videoDevices.find(d => d.deviceId === savedVideo)
          ? savedVideo
          : videoDevices[0]?.deviceId || null;

        const validAudioInput = audioInputDevices.find(d => d.deviceId === savedAudioInput)
          ? savedAudioInput
          : audioInputDevices[0]?.deviceId || null;

        const validAudioOutput = audioOutputDevices.find(d => d.deviceId === savedAudioOutput)
          ? savedAudioOutput
          : audioOutputDevices[0]?.deviceId || null;

        return {
          ...prev,
          videoDevices,
          audioInputDevices,
          audioOutputDevices,
          selectedVideoDevice: validVideo,
          selectedAudioInput: validAudioInput,
          selectedAudioOutput: validAudioOutput,
          isLoading: false
        };
      });
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao listar dispositivos de mídia.'
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Seu navegador não suporta acesso a dispositivos de mídia.'
        }));
      }, 0);
      return;
    }

    // Use setTimeout to avoid calling setState synchronously in effect
    setTimeout(() => {
      enumerateDevices();
    }, 0);

    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateDevices, enabled]);

  const setSelectedVideoDevice = useCallback((deviceId: string) => {
    setState(prev => ({ ...prev, selectedVideoDevice: deviceId }));
    localStorage.setItem('selectedVideoDevice', deviceId);
  }, []);

  const setSelectedAudioInput = useCallback((deviceId: string) => {
    setState(prev => ({ ...prev, selectedAudioInput: deviceId }));
    localStorage.setItem('selectedAudioInput', deviceId);
  }, []);

  const setSelectedAudioOutput = useCallback((deviceId: string) => {
    setState(prev => ({ ...prev, selectedAudioOutput: deviceId }));
    localStorage.setItem('selectedAudioOutput', deviceId);
  }, []);

  return {
    ...state,
    setSelectedVideoDevice,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    getMediaStream,
    refreshDevices: enumerateDevices
  };
};
