import { redirect } from 'next/navigation';

/**
 * Página de Captura - Redireciona para Histórico (seção padrão)
 *
 * As seções administrativas (Agendamentos, Advogados e Credenciais)
 * ficam disponíveis via botão de configurações na tela de histórico.
 */
export default function CapturaPage() {
  redirect('/app/captura/historico');
}