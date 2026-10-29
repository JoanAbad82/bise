// R07-a (his 10-04 words: 'je sélectionne un agent et je vois sur la droite ses dernières actions'):
// the selected agent row's right column shows its last actions instead of its objective, newest
// last, in the thread's own marks (designer m_13271): '$ cargo test -p core', '± panels.md',
// '› the cache is warm now', '✓ done · <report>' / '▲ failed · <report>', '? <its question>' (in
// accent: it waits on him). Pure: entries in, lines out; the capsule feeds it the agent's thread.
import type { Entry } from '@/proto';
import { reportLine, toolWords } from '@/thread/entry';

/** How many actions the selected row shows. */
export const PREVIEW_LINES = 4;

export interface PreviewLine {
  readonly key: string;
  readonly text: string;
  /** '2 min', '14:02'; '' when the entry has no time */
  readonly time: string;
  /** it waits on him: a question still open */
  readonly ask: boolean;
}

/** '<tool>: {…}' or '<tool>: args', the hub's raw form (not an intent's words) */
const RAW_TOOL = /^[A-Za-z_][\w.-]*:\s/u;

/** The first line with words, without its markdown marks. */
function firstLine(text: string): string {
  const line = text.split('\n').map((l) => l.trim()).find((l) => l !== '') ?? '';
  return line.replace(/^(#{1,6}\s+|[-*]\s+|>\s+)/u, '').replace(/[*_`]+/gu, '').trim();
}

/** '2 min' within the hour, as the app writes ages everywhere (designer m_21313); 'now' under a
 *  minute, else the clock time '14:02'. */
export function actionTime(at: number, now: number): string {
  if (at <= 0) return '';
  const min = Math.floor((now - at) / 60_000);
  if (min < 1) return 'now';
  if (min < 60) return `${String(min)} min`;
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** One entry's actions, oldest first (a tools entry has one per step). */
function entryActions(e: Entry, now: number): PreviewLine[] {
  const line = (key: string, text: string, at: number, ask = false): PreviewLine => ({ key, text, time: actionTime(at, now), ask });
  switch (e.kind) {
    case 'tools':
      return (e.tools?.items ?? []).map((t) => {
        const w = toolWords(t.text);
        if (t.kind === 'run') return line(`${String(e.pos)}.${String(t.pos)}`, `$ ${w}`, t.at_ms || e.at_ms);
        // '± panels.md': the file, never the tool's name (designer m_13271)
        if (t.kind === 'edit') return line(`${String(e.pos)}.${String(t.pos)}`, `± ${RAW_TOOL.test(t.text) ? w.replace(/^\S+\s+/u, '') : w}`, t.at_ms || e.at_ms);
        return line(`${String(e.pos)}.${String(t.pos)}`, `· ${w}`, t.at_ms || e.at_ms);
      });
    case 'agent': {
      const w = firstLine(e.text);
      return w === '' ? [] : [line(String(e.pos), `› ${w}`, e.at_ms)];
    }
    case 'report': {
      const kind = e.report?.kind ?? null;
      const r = reportLine(e.text, kind);
      if (r === null) return [];
      const mark = kind === 'done' ? '✓ ' : kind === 'failed' ? '▲ ' : '';
      return [line(String(e.pos), `${mark}${r}`, e.at_ms)];
    }
    case 'card':
      return e.card === null || e.card === undefined || e.card.answered ? [] : [line(String(e.pos), `? ${firstLine(e.card.question)}`, e.at_ms, true)];
    default:
      return [];
  }
}

/** The agent's last actions, newest last, at most PREVIEW_LINES; [] when it has none yet. */
export function previewLines(entries: readonly Entry[], now: number): readonly PreviewLine[] {
  return entries.flatMap((e) => entryActions(e, now)).slice(-PREVIEW_LINES);
}
