/**
 * Página de Edição de Modelo de Peça Jurídica
 * /app/pecas-juridicas/[id]/editar
 */

import { Metadata } from 'next';
import { EditarPecaModeloClient } from './client';

export const metadata: Metadata = {
  title: 'Editar Modelo de Peça | Synthropic',
  description: 'Edite um modelo de peça jurídica',
};

export default function EditarPecaModeloPage() {
  return <EditarPecaModeloClient />;
}
