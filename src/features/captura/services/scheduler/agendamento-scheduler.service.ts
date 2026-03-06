// Serviço principal do scheduler para executar agendamentos automaticamente

import { buscarAgendamentosParaExecutar } from '../persistence/agendamento-persistence.service';
import { executarAgendamento } from './executar-agendamento.service';

let schedulerEmExecucao = false;

/**
 * Executa o scheduler: busca agendamentos prontos e os executa
 * Deve ser chamado periodicamente (ex: a cada minuto)
 * Protegido contra execução duplicada via lock in-memory.
 */
export async function executarScheduler(): Promise<void> {
  if (schedulerEmExecucao) {
    console.log('[Scheduler] Execução anterior ainda em andamento, pulando ciclo');
    return;
  }

  schedulerEmExecucao = true;
  console.log('[Scheduler] Iniciando verificação de agendamentos...');

  try {
    // Buscar agendamentos prontos para execução
    const agendamentos = await buscarAgendamentosParaExecutar();

    if (agendamentos.length === 0) {
      console.log('[Scheduler] Nenhum agendamento pronto para execução');
      return;
    }

    console.log(`[Scheduler] Encontrados ${agendamentos.length} agendamento(s) pronto(s) para execução`);

    // Executar cada agendamento sequencialmente
    for (const agendamento of agendamentos) {
      try {
        console.log(`[Scheduler] Executando agendamento ID ${agendamento.id} (${agendamento.tipo_captura})`);
        await executarAgendamento(agendamento, true); // true = atualizar próxima execução
        console.log(`[Scheduler] Agendamento ID ${agendamento.id} executado com sucesso`);
      } catch (error) {
        console.error(`[Scheduler] Erro ao executar agendamento ID ${agendamento.id}:`, error);
        // Continuar com próximo agendamento mesmo se um falhar
      }
    }

    console.log(`[Scheduler] Processamento concluído. ${agendamentos.length} agendamento(s) processado(s)`);
  } catch (error) {
    console.error('[Scheduler] Erro ao executar scheduler:', error);
    throw error;
  } finally {
    schedulerEmExecucao = false;
  }
}

