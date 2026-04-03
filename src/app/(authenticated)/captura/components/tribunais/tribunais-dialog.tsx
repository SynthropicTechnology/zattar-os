import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { TribunalConfigDb } from '@/app/(authenticated)/captura';

type Props = {
  tribunal: TribunalConfigDb | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/**
 * Dialog para editar configurações do tribunal.
 * A persistência real é feita via rota `/api/captura/tribunais` (PUT/POST).
 */
export function TribunaisDialog({ tribunal, open, onOpenChange, onSuccess }: Props) {
  const [urlBase, setUrlBase] = React.useState('');
  const [urlApi, setUrlApi] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUrlBase(tribunal?.url_base ?? '');
      setUrlApi(tribunal?.url_api ?? '');
    }
  }, [open, tribunal]);

  const handleSave = async () => {
    if (!tribunal) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/captura/tribunais/${tribunal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_base: urlBase,
          url_api: urlApi,
        }),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string'
            ? (json as { error: string }).error
            : 'Erro ao salvar tribunal';
        throw new Error(msg);
      }

      toast.success('Tribunal atualizado');
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            {tribunal ? `Editar ${tribunal.tribunal_codigo}` : 'Editar Tribunal'}
          </DialogTitle>
        </DialogHeader>

        {!tribunal ? (
          <div className="text-sm text-muted-foreground">Nenhum tribunal selecionado.</div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url-base">URL Base</Label>
              <Input
                id="url-base"
                value={urlBase}
                onChange={(e) => setUrlBase(e.target.value)}
                placeholder="https://pje.trt15.jus.br"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url-api">URL API</Label>
              <Input
                id="url-api"
                value={urlApi}
                onChange={(e) => setUrlApi(e.target.value)}
                placeholder="https://pje.trt15.jus.br/api"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !tribunal}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
