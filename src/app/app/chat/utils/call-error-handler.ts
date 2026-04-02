import { toast } from 'sonner';

interface ErrorAction {
  label: string;
  onClick: () => void;
}

interface ErrorConfig {
  message: string;
  description?: string;
  action?: ErrorAction;
}

export function handleCallError(error: unknown): void {
  console.error("Call Error:", error);

  const config = getErrorConfig(error);
  
  toast.error(config.message, {
    description: config.description,
    action: config.action,
    duration: 5000,
  });
}

function getErrorConfig(error: unknown): ErrorConfig {
  const errorObj = error as { message?: string } | null | undefined;
  const message = errorObj?.message || String(error || "Ocorreu um erro desconhecido");
  
  if (message.includes("NotAllowedError") || message.includes("Permission denied")) {
    return {
      message: "Permissão negada",
      description: "Por favor, permita o acesso à câmera e microfone nas configurações do navegador.",
      action: {
        label: "Ajuda",
        onClick: () => window.open("https://support.google.com/chrome/answer/2693767", "_blank")
      }
    };
  }

  if (message.includes("NotFoundError") || message.includes("Device not found")) {
    return {
      message: "Dispositivo não encontrado",
      description: "Verifique se sua câmera e microfone estão conectados corretamente."
    };
  }

  if (message.includes("NetworkError") || message.includes("Failed to fetch")) {
    return {
      message: "Erro de conexão",
      description: "Verifique sua conexão com a internet e tente novamente.",
      action: {
        label: "Recarregar",
        onClick: () => window.location.reload()
      }
    };
  }

  if (message.includes("Timeout")) {
    return {
      message: "Tempo limite excedido",
      description: "A conexão demorou muito para responder."
    };
  }

  return {
    message: "Erro na chamada",
    description: message
  };
}
