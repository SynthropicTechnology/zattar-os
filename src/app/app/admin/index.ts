/**
 * Admin Feature - Barrel Exports
 */

// Export actions
export * from './actions/metricas-actions';
export * from './actions/upgrade-actions';

// Export types from repositories
export type {
  CacheHitRate,
  QueryLenta,
  TabelaSequentialScan,
  BloatTabela,
  IndiceNaoUtilizado,
  MetricasDiskIO,
  DiskIOStatus,
} from './repositories/metricas-db-repository';

// Re-export MetricasDB from actions
export type { MetricasDB } from './actions/metricas-actions';
