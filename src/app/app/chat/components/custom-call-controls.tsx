import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  Circle, PhoneOff, FileText, Users, Wand2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NetworkQualityIndicator } from "./network-quality-indicator";
import type DyteClient from "@dytesdk/web-core";

interface CustomCallControlsProps {
  meeting: DyteClient | null;
  onLeave: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isScreensharing: boolean;
  onStartScreenshare: () => void;
  onStopScreenshare: () => void;
  showTranscript: boolean;
  onToggleTranscript: () => void;
  onToggleParticipants?: () => void;
  showParticipants?: boolean;
  canRecord?: boolean;
  networkQuality?: 'excellent' | 'good' | 'poor' | 'unknown';
  networkScore?: number;
  activeEffect?: 'none' | 'blur' | 'image';
  onApplyEffect?: (effect: 'none' | 'blur' | 'image') => void;
}

export function CustomCallControls({
  meeting,
  onLeave,
  isRecording,
  onStartRecording,
  onStopRecording,
  isScreensharing,
  onStartScreenshare,
  onStopScreenshare,
  showTranscript,
  onToggleTranscript,
  onToggleParticipants,
  showParticipants,
  canRecord = false,
  networkQuality = 'unknown',
  networkScore = -1,
  activeEffect = 'none',
  onApplyEffect,
}: CustomCallControlsProps) {
  // Use lazy initialization to get initial values from meeting
  const [audioEnabled, setAudioEnabled] = useState(
    () => meeting?.self?.audioEnabled ?? false
  );
  const [videoEnabled, setVideoEnabled] = useState(
    () => meeting?.self?.videoEnabled ?? false
  );

  // Track if we've synced initial state to avoid duplicate setState
  const hasSyncedRef = useRef(false);

  // Sync state with Dyte via event listeners only
  useEffect(() => {
    if (!meeting?.self) return;

    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true;
      queueMicrotask(() => {
        setAudioEnabled(meeting.self.audioEnabled);
        setVideoEnabled(meeting.self.videoEnabled);
      });
    }

    const onAudioUpdate = () => setAudioEnabled(meeting.self.audioEnabled);
    const onVideoUpdate = () => setVideoEnabled(meeting.self.videoEnabled);

    meeting.self.addListener('audioUpdate', onAudioUpdate);
    meeting.self.addListener('videoUpdate', onVideoUpdate);

    return () => {
      meeting.self.removeListener('audioUpdate', onAudioUpdate);
      meeting.self.removeListener('videoUpdate', onVideoUpdate);
    };
  }, [meeting]);

  const toggleAudio = async () => {
    if (!meeting) return;
    if (audioEnabled) await meeting.self.disableAudio();
    else await meeting.self.enableAudio();
  };

  const toggleVideo = async () => {
    if (!meeting) return;
    if (videoEnabled) await meeting.self.disableVideo();
    else await meeting.self.enableVideo();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4 md:p-6">
      <div className="relative flex items-center justify-center gap-2 md:gap-4 max-w-7xl mx-auto">
        
        {/* Network Indicator (Absolute Left) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
          <NetworkQualityIndicator quality={networkQuality} score={networkScore} showLabel />
        </div>
        
        <TooltipProvider>
          {/* Audio */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={audioEnabled ? "default" : "destructive"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  audioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                )}
                onClick={toggleAudio}
              >
                {audioEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6" /> : <MicOff className="h-5 w-5 md:h-6 md:w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{audioEnabled ? "Desativar microfone" : "Ativar microfone"}</p></TooltipContent>
          </Tooltip>

          {/* Video */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={videoEnabled ? "default" : "destructive"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  videoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                )}
                onClick={toggleVideo}
              >
                {videoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6" /> : <VideoOff className="h-5 w-5 md:h-6 md:w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{videoEnabled ? "Desativar câmera" : "Ativar câmera"}</p></TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* Screenshare */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreensharing ? "destructive" : "secondary"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  isScreensharing ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                )}
                onClick={isScreensharing ? onStopScreenshare : onStartScreenshare}
              >
                {isScreensharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isScreensharing ? "Parar compartilhamento" : "Compartilhar tela"}</p></TooltipContent>
          </Tooltip>

          {/* Effects / Settings */}
          <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className={cn(
                                "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                                activeEffect !== 'none' ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            )}
                        >
                            <Wand2 className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Efeitos de Vídeo</p></TooltipContent>
            </Tooltip>
            <PopoverContent className="w-72 bg-gray-900 border-gray-800 text-white" side="top">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Efeitos de Vídeo</h4>
                        <p className="text-xs text-muted-foreground">
                            Escolha um efeito para sua câmera
                        </p>
                    </div>
                    <RadioGroup 
                        value={activeEffect} 
                        onValueChange={(val) => onApplyEffect?.(val as 'none' | 'blur' | 'image')}
                        className="grid grid-cols-1 gap-3"
                    >
                        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => onApplyEffect?.('none')}>
                            <RadioGroupItem value="none" id="effect-none" className="border-gray-600 text-blue-500" />
                            <Label htmlFor="effect-none" className="cursor-pointer flex-1">Normal</Label>
                            <div className="w-12 h-8 rounded bg-gray-700 border border-gray-600 flex items-center justify-center text-xs">
                                <span className="text-gray-400">OFF</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => onApplyEffect?.('blur')}>
                            <RadioGroupItem value="blur" id="effect-blur" className="border-gray-600 text-blue-500" />
                            <Label htmlFor="effect-blur" className="cursor-pointer flex-1">Desfoque (Blur)</Label>
                            <div className="w-12 h-8 rounded bg-linear-to-br from-gray-400 to-gray-600 border border-gray-500 flex items-center justify-center text-xs blur-sm">
                                <span className="text-white text-[10px]">BLUR</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors" onClick={() => onApplyEffect?.('image')}>
                            <RadioGroupItem value="image" id="effect-image" className="border-gray-600 text-blue-500" />
                            <Label htmlFor="effect-image" className="flex-1 cursor-pointer">Imagem Virtual</Label>
                            <div className="w-12 h-8 rounded bg-linear-to-br from-blue-500 to-purple-600 border border-gray-500 flex items-center justify-center text-xs">
                                <span className="text-white text-[10px]">IMG</span>
                            </div>
                        </div>
                    </RadioGroup>
                    {activeEffect !== 'none' && (
                        <div className="pt-2 border-t border-gray-800">
                            <p className="text-xs text-muted-foreground">
                                Efeito ativo: <span className="text-white font-medium capitalize">{activeEffect === 'blur' ? 'Desfoque' : 'Imagem Virtual'}</span>
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
          </Popover>

          {/* Recording */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-gray-700 hover:bg-gray-600 text-gray-300",
                  !canRecord && !isRecording && "opacity-50 cursor-not-allowed"
                )}
                onClick={isRecording ? onStopRecording : onStartRecording}
                disabled={!canRecord && !isRecording}
              >
                <Circle className={cn("h-5 w-5", isRecording && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!canRecord && !isRecording 
                  ? "Apenas o iniciador pode gravar" 
                  : isRecording 
                    ? "Parar gravação" 
                    : "Gravar reunião"}
              </p>
            </TooltipContent>
          </Tooltip>

           {/* Transcript */}
           <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showTranscript ? "default" : "secondary"}
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all",
                  showTranscript ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                )}
                onClick={onToggleTranscript}
              >
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{showTranscript ? "Ocultar transcrição" : "Ver transcrição"}</p></TooltipContent>
          </Tooltip>
          
          {/* Participants Toggle (Mobile/Tablet) */}
          {onToggleParticipants && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant={showParticipants ? "default" : "secondary"}
                    size="icon"
                    className={cn(
                    "rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg transition-all lg:hidden",
                    showParticipants ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    )}
                    onClick={onToggleParticipants}
                >
                    <Users className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Participantes</p></TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* Leave */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg bg-red-600 hover:bg-red-700 ml-2"
                onClick={onLeave}
              >
                <PhoneOff className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Sair da chamada</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}