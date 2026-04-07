'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { XCircle, AlertTriangle, Clock, Wifi } from 'lucide-react';

interface ErroCaptura {
  trt: string;
  grau: string;
  credencialId: string;
  filtro: string;
  mensagem: string;
  tipo: 'timeout' | 'auth' | 'network' | 'outro';
}

interface ErroAgrupado {
  tribunal: string;
  erros: ErroCaptura[];
}

function classificarErro(mensagem: string): ErroCaptura['tipo'] {
  const msg = mensagem.toLowerCase();
  if (msg.includes('timeout') || msg.includes('exceeded') || msg.includes('waitforselector')) {
    return 'timeout';
  }
  if (msg.includes('otp') || msg.includes('login') || msg.includes('jwt') || msg.includes('advogado')) {
    return 'auth';
  }
  if (msg.includes('network') || msg.includes('connection') || msg.includes('econnrefused')) {
    return 'network';
  }
  return 'outro';
}

function parsearErros(erro: string): ErroCaptura[] {
  // Padrão: "TRT4 primeiro_grau (ID 7) - sem_prazo: Campo OTP não apareceu..."
  const regex = /(\w+)\s+([\w_]+)\s+\(ID\s+(\d+)\)\s*-\s*([\w_]+):\s*([^;]+)/g;
  const erros: ErroCaptura[] = [];
  let match;

  while ((match = regex.exec(erro)) !== null) {
    erros.push({
      trt: match[1],
      grau: match[2],
      credencialId: match[3],
      filtro: match[4],
      mensagem: match[5].trim(),
      tipo: classificarErro(match[5]),
    });
  }

  // Se não conseguiu parsear, retorna o erro como item único
  if (erros.length === 0 && erro.trim()) {
    erros.push({
      trt: 'Desconhecido',
      grau: '',
      credencialId: '',
      filtro: '',
      mensagem: erro.trim(),
      tipo: 'outro',
    });
  }

  return erros;
}

function agruparPorTribunal(erros: ErroCaptura[]): ErroAgrupado[] {
  const mapa = new Map<string, ErroCaptura[]>();

  for (const erro of erros) {
    const chave = erro.trt;
    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }
    mapa.get(chave)!.push(erro);
  }

  return Array.from(mapa.entries())
    .map(([tribunal, erros]) => ({ tribunal, erros }))
    .sort((a, b) => a.tribunal.localeCompare(b.tribunal));
}

function formatarGrau(grau: string): string {
  switch (grau) {
    case 'primeiro_grau': return '1\u00ba Grau';
    case 'segundo_grau': return '2\u00ba Grau';
    case 'tribunal_superior': return 'Tribunal Superior';
    default: return grau;
  }
}

function formatarFiltro(filtro: string): string {
  switch (filtro) {
    case 'sem_prazo': return 'Sem Prazo';
    case 'no_prazo': return 'No Prazo';
    default: return filtro;
  }
}

function IconeErro({ tipo }: { tipo: ErroCaptura['tipo'] }) {
  switch (tipo) {
    case 'timeout': return <Clock className="h-3.5 w-3.5 text-warning shrink-0" />;
    case 'auth': return <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />;
    case 'network': return <Wifi className="h-3.5 w-3.5 text-warning shrink-0" />;
    default: return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
  }
}

interface CapturaErrosFormatadosProps {
  erro: string;
}

export function CapturaErrosFormatados({ erro }: CapturaErrosFormatadosProps) {
  const errosParsed = parsearErros(erro);
  const grupos = agruparPorTribunal(errosParsed);

  // Resumo por tipo de erro
  const contagemPorTipo = errosParsed.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Erros na Captura</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-4">
          {/* Resumo */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive">{errosParsed.length} erro{errosParsed.length !== 1 ? 's' : ''}</Badge>
            {contagemPorTipo.timeout && (
              <Badge variant={getSemanticBadgeVariant('error_type', 'timeout')}>
                <Clock className="mr-1 h-3 w-3" /> {contagemPorTipo.timeout} timeout{contagemPorTipo.timeout !== 1 ? 's' : ''}
              </Badge>
            )}
            {contagemPorTipo.auth && (
              <Badge variant={getSemanticBadgeVariant('error_type', 'auth')}>
                <AlertTriangle className="mr-1 h-3 w-3" /> {contagemPorTipo.auth} autenticacao
              </Badge>
            )}
            {contagemPorTipo.network && (
              <Badge variant={getSemanticBadgeVariant('error_type', 'network')}>
                <Wifi className="mr-1 h-3 w-3" /> {contagemPorTipo.network} rede
              </Badge>
            )}
          </div>

          {/* Erros agrupados por tribunal */}
          <div className="space-y-3">
            {grupos.map((grupo) => (
              <div key={grupo.tribunal} className="rounded-md border border-destructive dark:border-destructive bg-background/50 p-3">
                <div className="mb-2 font-medium text-sm text-foreground">
                  {grupo.tribunal}
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({grupo.erros.length} erro{grupo.erros.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {grupo.erros.map((erro, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <IconeErro tipo={erro.tipo} />
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center gap-1.5">
                          {erro.grau && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                              {formatarGrau(erro.grau)}
                            </Badge>
                          )}
                          {erro.filtro && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                              {formatarFiltro(erro.filtro)}
                            </Badge>
                          )}
                          {erro.credencialId && (
                            <span className="text-muted-foreground">ID {erro.credencialId}</span>
                          )}
                        </span>
                        <p className="mt-0.5 text-muted-foreground leading-relaxed">{erro.mensagem}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
