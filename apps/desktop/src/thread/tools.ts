// The words of the composer box's row (ComposerTools.tsx, designer's composer-strip A). Pure.
import type { Model } from '@/proto';

/** The approvals mode's menu word: 'yolo', or 'approvals' for the hub's 'auto' (the TUI's ⇧⇥ pair). */
export function modeWords(mode: string | null | undefined): string {
  return mode === 'auto' ? 'approvals' : 'yolo';
}

/** The model menu's words: the model as the catalog names it (its label, else its id's last part)
 *  and its effort; '' each when unknown. */
export function modelWords(models: readonly Model[], model: string | null | undefined, effort: string | null | undefined): { model: string; effort: string } {
  const id = (model ?? '').trim();
  const label = models.find((m) => m.id === id)?.label.trim() ?? '';
  return { model: label !== '' ? label : (id.split('/').at(-1) ?? ''), effort: (effort ?? '').trim() };
}
