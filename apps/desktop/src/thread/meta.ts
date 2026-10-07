// The agent's run settings as the TUI's divider says them (bar S40/W3, tui-parity R10): its model's
// short words, its reasoning effort and the project's approvals mode, 'opus · high · auto'.
// Owner: amb-win. Pure: the head draws it.
import type { Model } from '@/proto';
import { modelOf } from '@/agents/actions';

/** 'opus · high · auto': the catalog's short words for its model (else its id's last part), its effort, the approvals mode; '' when none is known. Pure. */
export function metaWords(models: readonly Model[], model: string | null | undefined, effort: string | null | undefined, mode: string | null | undefined): string {
  const m = modelOf(models, model);
  const name = m !== undefined && m.short !== '' ? m.short : model != null && model !== '' ? (model.split('/').at(-1) ?? model) : '';
  return [name, effort ?? '', mode === 'unknown' ? '' : (mode ?? '')].filter((x) => x !== '').join(' · ');
}
