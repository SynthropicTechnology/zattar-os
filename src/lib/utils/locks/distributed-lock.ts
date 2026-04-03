import { createServiceClient } from '@/lib/supabase/service-client';
import getLogger from '@/lib/logger';

const logger = getLogger({ service: 'distributed-lock' });

export interface LockOptions {
  /** Tempo de vida do lock em segundos */
  ttl: number;
  /** Timeout para adquirir lock em ms (0 = não espera) */
  acquireTimeout?: number;
  /** Intervalo de polling em ms quando aguardando lock */
  pollInterval?: number;
}

const DEFAULT_OPTIONS: LockOptions = {
  ttl: 300, // 5 minutos
  acquireTimeout: 0, // Não espera por padrão
  pollInterval: 100,
};

/**
 * Classe para gerenciar distributed locks usando Supabase
 * Usa tabela 'locks' com advisory locks do Postgres como fallback
 */
export class DistributedLock {
  private lockId: string | null = null;
  private key: string;
  private options: LockOptions;
  
  constructor(key: string, options: Partial<LockOptions> = {}) {
    this.key = key;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Tenta adquirir o lock
   * Retorna true se adquirido, false se já está locked
   */
  async acquire(): Promise<boolean> {
    const startTime = Date.now();
    const deadline = startTime + (this.options.acquireTimeout || 0);
    
    while (true) {
      const acquired = await this.tryAcquire();
      
      if (acquired) {
        logger.info({ key: this.key, lockId: this.lockId, ttl: this.options.ttl }, 'Lock acquired');
        return true;
      }
      
      // Se não deve esperar ou timeout expirou, retorna false
      if (this.options.acquireTimeout === 0 || Date.now() >= deadline) {
        logger.warn({ key: this.key, waitedMs: Date.now() - startTime }, 'Failed to acquire lock');
        return false;
      }
      
      // Aguarda antes de tentar novamente
      await sleep(this.options.pollInterval!);
    }
  }
  
  /**
   * Tenta adquirir o lock uma única vez
   */
  private async tryAcquire(): Promise<boolean> {
    const supabase = createServiceClient();
    this.lockId = crypto.randomUUID();
    
    try {
      // Tenta inserir lock na tabela
      const { error } = await supabase
        .from('locks')
        .insert({
          key: this.key,
          lock_id: this.lockId,
          expires_at: new Date(Date.now() + this.options.ttl * 1000).toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        // Se erro é duplicate key, lock já existe
        if (error.code === '23505') {
          this.lockId = null;
          return false;
        }
        throw error;
      }
      
      return true;
    } catch (error) {
      logger.error({ error, key: this.key }, 'Error acquiring lock');
      this.lockId = null;
      return false;
    }
  }
  
  /**
   * Libera o lock
   */
  async release(): Promise<void> {
    if (!this.lockId) {
      logger.warn({ key: this.key }, 'Attempted to release lock that was not acquired');
      return;
    }
    
    const supabase = createServiceClient();
    
    try {
      const { error } = await supabase
        .from('locks')
        .delete()
        .eq('key', this.key)
        .eq('lock_id', this.lockId);
      
      if (error) {
        logger.error({ error, key: this.key, lockId: this.lockId }, 'Error releasing lock');
      } else {
        logger.info({ key: this.key, lockId: this.lockId }, 'Lock released');
      }
    } catch (error) {
      logger.error({ error, key: this.key }, 'Exception releasing lock');
    } finally {
      this.lockId = null;
    }
  }
  
  /**
   * Executa função com lock adquirido
   * Garante que lock é liberado mesmo em caso de erro
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquire();

    if (!acquired) {
      // Importa LockError dinamicamente para evitar dependência circular
      const { LockError } = await import('@/app/(authenticated)/captura/services/partes/errors');
      throw new LockError(`Captura já em andamento`, this.key);
    }

    try {
      return await fn();
    } finally {
      await this.release();
    }
  }
}

/**
 * Helper para criar e usar lock em uma única operação
 */
export async function withDistributedLock<T>(
  key: string,
  fn: () => Promise<T>,
  options?: Partial<LockOptions>
): Promise<T> {
  const lock = new DistributedLock(key, options);
  return lock.withLock(fn);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}