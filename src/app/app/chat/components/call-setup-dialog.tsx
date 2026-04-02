import { useEffect, useRef } from 'react';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Video, Mic, Volume2, VideoOff } from 'lucide-react';
import { useMediaDevices } from '../hooks/use-media-devices';
import { useDeviceTest } from '../hooks/use-device-test';
import { TipoChamada, SelectedDevices } from '../domain';
import { Skeleton } from '@/components/ui/skeleton';

interface CallSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoChamada;
  onJoinCall: (selectedDevices: SelectedDevices) => void;
  salaNome: string;
}

export function CallSetupDialog({
  open,
  onOpenChange,
  tipo,
  onJoinCall,
  salaNome: _salaNome,
}: CallSetupDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    videoDevices,
    audioInputDevices,
    audioOutputDevices,
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    setSelectedVideoDevice,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    isLoading: devicesLoading,
    error: devicesError,
    refreshDevices
  } = useMediaDevices({ enabled: open });

  const {
    videoStream,
    audioLevel,
    isTestingVideo,
    isTestingAudio,
    startVideoTest,
    stopVideoTest,
    startAudioTest,
    stopAudioTest,
    error: testError
  } = useDeviceTest();

  // Iniciar preview de vídeo e áudio quando o dialog abrir
  useEffect(() => {
    if (open) {
      refreshDevices();
    } else {
      stopVideoTest();
      stopAudioTest();
    }
  }, [open, refreshDevices, stopVideoTest, stopAudioTest]);

  // Gerenciar teste de vídeo quando dispositivo selecionado muda
  useEffect(() => {
    if (open && selectedVideoDevice && tipo === TipoChamada.Video) {
      startVideoTest(selectedVideoDevice);
    }
  }, [open, selectedVideoDevice, tipo, startVideoTest]);

  // Gerenciar teste de áudio quando dispositivo selecionado muda
  useEffect(() => {
    if (open && selectedAudioInput) {
      startAudioTest(selectedAudioInput);
    }
  }, [open, selectedAudioInput, startAudioTest]);

  // Anexar stream de vídeo ao elemento video
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const handleJoin = () => {
    onJoinCall({
      videoDevice: selectedVideoDevice || undefined,
      audioInput: selectedAudioInput || undefined,
      audioOutput: selectedAudioOutput || undefined,
    });
    onOpenChange(false);
  };

  const getDeviceLabel = (device: MediaDeviceInfo, index: number) => {
    return device.label || `${device.kind} ${index + 1}`;
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Configurar Chamada"
      maxWidth="2xl"
      footer={
        <Button onClick={handleJoin}>
          Entrar
        </Button>
      }
    >
      <div className="flex flex-col gap-6 p-6">
        {/* Video Preview Area */}
        {tipo === TipoChamada.Video && (
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
            {isTestingVideo && videoStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                <VideoOff className="w-12 h-12 mb-2 opacity-50" />
                <p>Câmera desligada ou indisponível</p>
              </div>
            )}
          </div>
        )}

        {/* Device Selection Controls */}
        <div className="space-y-4">
          {/* Camera Selection */}
          {tipo === TipoChamada.Video && (
            <div className="grid gap-2">
              <Label htmlFor="camera-select" className="flex items-center gap-2">
                <Video className="w-4 h-4" /> Câmera
              </Label>
              {devicesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedVideoDevice || ''}
                  onValueChange={setSelectedVideoDevice}
                  disabled={videoDevices.length === 0}
                >
                  <SelectTrigger id="camera-select">
                    <SelectValue placeholder="Selecione uma câmera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map((device, idx) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {getDeviceLabel(device, idx)}
                      </SelectItem>
                    ))}
                    {videoDevices.length === 0 && (
                      <SelectItem value="none" disabled>Nenhuma câmera encontrada</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Microphone Selection */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mic-select" className="flex items-center gap-2">
                <Mic className="w-4 h-4" /> Microfone
              </Label>
              {isTestingAudio && (
                <div className="flex items-center gap-2 w-32">
                  <Mic className={`w-3 h-3 ${audioLevel > 5 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <Progress value={audioLevel} className="h-1.5" />
                </div>
              )}
            </div>

            {devicesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedAudioInput || ''}
                onValueChange={setSelectedAudioInput}
                disabled={audioInputDevices.length === 0}
              >
                <SelectTrigger id="mic-select">
                  <SelectValue placeholder="Selecione um microfone" />
                </SelectTrigger>
                <SelectContent>
                  {audioInputDevices.map((device, idx) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {getDeviceLabel(device, idx)}
                    </SelectItem>
                  ))}
                  {audioInputDevices.length === 0 && (
                    <SelectItem value="none" disabled>Nenhum microfone encontrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Speaker Selection */}
          {audioOutputDevices.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="speaker-select" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Alto-falante
              </Label>
              <Select
                value={selectedAudioOutput || ''}
                onValueChange={setSelectedAudioOutput}
                disabled={audioOutputDevices.length === 0}
              >
                <SelectTrigger id="speaker-select">
                  <SelectValue placeholder="Selecione um alto-falante" />
                </SelectTrigger>
                <SelectContent>
                  {audioOutputDevices.map((device, idx) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {getDeviceLabel(device, idx)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.8rem] text-muted-foreground">
                Nota: A saída de áudio pode ser controlada pelo sistema operacional em alguns navegadores.
              </p>
            </div>
          )}
        </div>

        {(devicesError || testError) && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {devicesError || testError}
          </div>
        )}
      </div>
    </DialogFormShell>
  );
}
