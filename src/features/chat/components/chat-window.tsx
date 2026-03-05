"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import useChatStore from "./useChatStore";
import { ChatHeader } from "./chat-header";
import { ChatContent } from "./chat-content";
import { ChatFooter } from "./chat-footer";
import { IncomingCallDialog } from "./incoming-call-dialog";
import { CallSetupDialog } from "./call-setup-dialog";
import { UserDetailSheet } from "./user-detail-sheet";
import { useChatSubscription } from "../hooks/use-chat-subscription";
import { useTypingIndicator } from "../hooks/use-typing-indicator";
import { useCallNotifications } from "../hooks/use-call-notifications";
import { actionEnviarMensagem, actionBuscarHistorico } from "../actions/chat-actions";
import { actionIniciarChamada } from "../actions/chamadas-actions";
import type { MensagemComUsuario, MensagemChat, ChatMessageData, PaginatedResponse, UsuarioChat, SelectedDevices } from "../domain";
import { TipoChamada } from "../domain";
import { useUsuarios } from "@/features/usuarios/hooks/use-usuarios";
import { toast } from "sonner";

interface ChatWindowProps {
  currentUserId: number;
  currentUserName: string;
}

export function ChatWindow({ currentUserId, currentUserName }: ChatWindowProps) {
  const { selectedChat, mensagens, setMensagens, adicionarMensagem, atualizarMensagem } = useChatStore();

  // Buscar todos os usuários para lookup de nomes em mensagens realtime
  const { usuarios } = useUsuarios({ ativo: true });

  // Criar mapa de usuários para lookup rápido
  const usuariosMap = useMemo(() => {
    const map = new Map<number, UsuarioChat>();
    for (const u of usuarios) {
      map.set(u.id, {
        id: u.id,
        nomeCompleto: u.nomeCompleto,
        nomeExibicao: u.nomeExibicao,
        emailCorporativo: u.emailCorporativo,
        avatar: u.avatarUrl ?? undefined,
      });
    }
    return map;
  }, [usuarios]);

  // Função de lookup para o subscription hook
  const getUserById = useCallback((userId: number): UsuarioChat | undefined => {
    return usuariosMap.get(userId);
  }, [usuariosMap]);

  // States for Setup Dialog
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupCallType, setSetupCallType] = useState<TipoChamada>(TipoChamada.Video);
  const callWindowRef = useRef<Window | null>(null);

  // Notifications Hook
  const {
    incomingCall,
    acceptCall,
    rejectCall,
    notifyCallStart,
    notifyCallEnded,
  } = useCallNotifications({
    salaId: selectedChat?.id || 0,
    currentUserId,
    currentUserName,
    enabled: !!selectedChat
  });

  // Typing Indicator
  const { typingIndicatorText, startTyping, stopTyping } = useTypingIndicator(
    selectedChat?.id || 0,
    currentUserId,
    currentUserName
  );

  // Carregar histórico ao selecionar sala
  useEffect(() => {
    if (!selectedChat) {
      setMensagens([]);
      return;
    }

    let cancelled = false;

    actionBuscarHistorico(selectedChat.id, 50).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        const paginatedData = result.data as PaginatedResponse<MensagemComUsuario>;
        const msgs = paginatedData.data.map(msg => ({
          ...msg,
          ownMessage: msg.usuarioId === currentUserId
        }));
        setMensagens(msgs);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id, setMensagens, currentUserId]);

  // Subscription Realtime
  const { broadcastNewMessage } = useChatSubscription({
    salaId: selectedChat?.id || 0,
    onNewMessage: (msg) => {
       adicionarMensagem(msg);
    },
    enabled: !!selectedChat,
    currentUserId,
    getUserById
  });

  const handleEnviarMensagem = async (conteudo: string, tipo: string = 'texto', data?: ChatMessageData | null) => {
    if (!selectedChat) return;
    stopTyping();

    // 1. Criar mensagem temporária (optimistic update)
    const tempId = -Date.now(); // ID negativo para identificar como temporário
    const now = new Date().toISOString();
    const tempMessage: MensagemComUsuario = {
      id: tempId,
      salaId: selectedChat.id,
      usuarioId: currentUserId,
      conteudo,
      tipo: tipo as MensagemComUsuario['tipo'],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: 'sending',
      ownMessage: true,
      data: data ?? undefined,
      usuario: {
        id: currentUserId,
        nomeCompleto: currentUserName,
        nomeExibicao: currentUserName,
        emailCorporativo: null,
      }
    };

    // 2. Adicionar ao store imediatamente
    adicionarMensagem(tempMessage);

    // 3. Enviar ao servidor
    const result = await actionEnviarMensagem(selectedChat.id, conteudo, tipo, data);

    if (!result.success) {
      // 4a. Erro: marcar como falha
      atualizarMensagem(tempId, { status: 'failed' });
      console.error('Erro ao enviar mensagem:', result.message);
      return;
    }

    // 4b. Sucesso: atualizar com dados reais do servidor
    // O Realtime também vai receber, mas o store vai substituir automaticamente
    if (result.data) {
      const mensagemData = result.data as MensagemChat;
      atualizarMensagem(tempId, {
        id: mensagemData.id,
        status: 'sent',
        createdAt: mensagemData.createdAt
      });

      // Fallback de entrega: broadcast para destinatários (não depende de Postgres Changes)
      // Inclui dados do usuário para que o destinatário possa exibir o nome corretamente
      await broadcastNewMessage({
        id: mensagemData.id,
        salaId: mensagemData.salaId,
        usuarioId: mensagemData.usuarioId,
        conteudo: mensagemData.conteudo,
        tipo: mensagemData.tipo as MensagemComUsuario['tipo'],
        createdAt: mensagemData.createdAt,
        updatedAt: mensagemData.updatedAt,
        deletedAt: mensagemData.deletedAt,
        status: mensagemData.status ?? 'sent',
        data: mensagemData.data ?? undefined,
        // Dados do usuário para exibição no destinatário
        usuarioNome: currentUserName,
        usuarioAvatar: usuariosMap.get(currentUserId)?.avatar,
      });
    }
  };

  const handleStartCall = (tipo: TipoChamada) => {
    setSetupCallType(tipo);
    setSetupDialogOpen(true);
  };

  const openCallWindow = useCallback((params: {
    chamadaId: number;
    authToken: string;
    tipo: TipoChamada;
    salaNome: string;
    isInitiator: boolean;
    devices?: SelectedDevices;
  }) => {
    // Store sensitive data in sessionStorage (not URL)
    sessionStorage.setItem("call_auth_token", params.authToken);
    if (params.devices) {
      sessionStorage.setItem("call_selected_devices", JSON.stringify(params.devices));
    }

    const searchParams = new URLSearchParams({
      chamadaId: String(params.chamadaId),
      tipo: params.tipo,
      salaNome: params.salaNome,
      isInitiator: String(params.isInitiator),
    });

    const width = params.tipo === TipoChamada.Video ? 1024 : 480;
    const height = params.tipo === TipoChamada.Video ? 720 : 640;
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    const callWindow = window.open(
      `/app/chat/call?${searchParams.toString()}`,
      `call_${params.chamadaId}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
    );

    callWindowRef.current = callWindow;
  }, []);

  // Listen for call_ended messages from the call window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "call_ended") {
        const { chamadaId, isInitiator } = event.data;
        if (isInitiator && chamadaId) {
          notifyCallEnded(chamadaId);
        }
        callWindowRef.current = null;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [notifyCallEnded]);

  const handleJoinFromSetup = async (devices: SelectedDevices) => {
    if (!selectedChat) return;
    setSetupDialogOpen(false);

    const tipo = setupCallType;

    try {
      const result = await actionIniciarChamada(selectedChat.id, tipo);

      if (result.success && result.data) {
        const { chamadaId, meetingId, authToken } = result.data;

        await notifyCallStart(chamadaId, tipo, meetingId);

        openCallWindow({
          chamadaId,
          authToken,
          tipo,
          salaNome: selectedChat.name || "Chat",
          isInitiator: true,
          devices,
        });
      } else if (!result.success) {
        console.error("Erro ao iniciar chamada:", result.error || result.message);
        toast.error("Erro ao iniciar chamada", {
          description: result.error || result.message,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall || !selectedChat) return;

    const result = await acceptCall();
    if (result) {
      openCallWindow({
        chamadaId: incomingCall.chamadaId,
        authToken: result.authToken,
        tipo: incomingCall.tipo,
        salaNome: selectedChat.name || "Chat",
        isInitiator: false,
      });
    }
  };

  if (!selectedChat) {
    return (
      <div className="hidden h-full flex-1 items-center justify-center lg:flex bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col flex-1 relative bg-background">
      <ChatHeader
        sala={selectedChat}
        onVideoCall={() => handleStartCall(TipoChamada.Video)}
        onAudioCall={() => handleStartCall(TipoChamada.Audio)}
      />
      
      <ChatContent
        mensagens={mensagens}
        salaAtiva={selectedChat}
      />
      
      <ChatFooter 
        salaId={selectedChat.id} 
        onEnviarMensagem={handleEnviarMensagem}
        onTyping={startTyping}
        typingIndicatorText={typingIndicatorText}
      />

      <UserDetailSheet user={selectedChat.usuario} />

      <CallSetupDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        tipo={setupCallType}
        salaNome={selectedChat.name || "Chat"}
        onJoinCall={handleJoinFromSetup}
      />

      <IncomingCallDialog 
        open={!!incomingCall}
        callData={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onReject={rejectCall}
      />
    </div>
  );
}