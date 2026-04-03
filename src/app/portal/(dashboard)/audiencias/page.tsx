import { actionListarAudienciasPortal } from "./actions";
import { AudienciasContent } from "./audiencias-content";

export default async function AudienciasPage() {
  const result = await actionListarAudienciasPortal();
  return <AudienciasContent audiencias={result.data} error={result.error} />;
}
