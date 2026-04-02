"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MeetingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in MeetingUI:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-950 text-white p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Algo deu errado na chamada</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Ocorreu um erro inesperado ao renderizar a interface da chamada. Tente recarregar.
          </p>
          <div className="flex gap-4">
            <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="bg-transparent border-white text-white hover:bg-white hover:text-black"
            >
                Recarregar Página
            </Button>
            <Button 
                variant="destructive"
                onClick={() => this.setState({ hasError: false, error: null })} // Try to recover? Or just close?
            >
                Tentar Novamente
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
