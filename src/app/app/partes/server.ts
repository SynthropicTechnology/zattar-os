import 'server-only';

/**
 * Partes Feature Module - Server-only entrypoint
 *
 * Use este arquivo APENAS em Server Components / Server Actions.
 * Ele existe para evitar que dependências Node (ex: Redis/ioredis) sejam empacotadas no browser.
 */

export * from './service';
export * from './repository';

/**
 * Partes Feature Module - Server-only entrypoint
 *
 * Use este arquivo para importar Server Actions e outras APIs server-only,
 * evitando que dependências Node (ex: ioredis) sejam empacotadas no browser.
 *
 * Exemplo:
 * import { actionListarClientes } from "@/app/app/partes/server";
 */

export * from './actions/index';
export * from './service';

export {
  actionBuscarCliente,
  actionBuscarClientePorCNPJ,
  actionBuscarClientePorCPF,
  actionListarClientes,
  actionListarPartesContrarias,
  actionListarRepresentantes,
  actionListarTerceiros,
} from './actions/index';
