/**
 * Página de Criação de Modelo de Peça Jurídica
 * /app/pecas-juridicas/novo
 */

import { Metadata } from 'next';
import { PecaModeloEditor } from '@/app/(authenticated)/pecas-juridicas';

export const metadata: Metadata = {
  title: 'Novo Modelo de Peça | Sinesys',
  description: 'Crie um novo modelo de peça jurídica',
};

export default function NovoPecaModeloPage() {
  return <PecaModeloEditor />;
}
