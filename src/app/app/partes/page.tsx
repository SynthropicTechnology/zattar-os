import type { Metadata } from 'next';
import { PartesClient } from './partes-client';

export const metadata: Metadata = {
  title: 'Partes',
  description: 'Gestão de clientes, partes contrárias, terceiros e representantes.',
};

/**
 * Página de Partes
 *
 * Server Component — delega toda a interatividade ao PartesClient.
 *
 * TODO: Buscar estatísticas no servidor quando actionContarPartesPorTipo
 * estiver disponível, passando initialStats ao PartesClient para evitar
 * o loading state inicial do PulseStrip.
 */
export default async function PartesPage() {
  return <PartesClient />;
}
