// The hero film's words over the town (DOM, over the canvas): the bims' labels as the app shows them
// (labels.ts's, placed by tags.ts so none covers another) but only one name at a time (bims-film v4:
// the bim the camera follows, or the one under his pointer); the '?' and '✗' pills and the eggs'
// words always; the sleepers' z's (zzz.ts). Reads the renderer's heads; decides nothing about the
// film. Owner: hero-town.
import type { Label } from '../bims/model';
import { placeTags, type TagIn } from '../bims/tags';
import { placeZzz } from '../bims/zzz';

export interface Overlay {
  readonly root: HTMLDivElement;
  /** the labels to show now, each with its head on the canvas (css px); a null head is off view */
  labels(ls: readonly { readonly key: string; readonly label: Label; readonly head: { x: number; y: number } | null; readonly rank: number }[]): void;
  /** the sleepers' heads (css px) */
  zzz(heads: ReadonlyMap<string, { readonly x: number; readonly y: number }>): void;
  dispose(): void;
}

/**
 * An egg's words as the hero shows them: never one of bise's signs as a joke (designer m_30865:
 * '!' means "needs your approval", '?' and '✗' are the pills): the stare's '!' reads '…'. Pure.
 */
export function eggWords(w: string): string {
  return w.replaceAll('!', '…').replaceAll('?', '…').replaceAll('✗', '…');
}

const PILL: Readonly<Record<'asks' | 'failed', string>> = { asks: '?', failed: '✗' };

function textOf(l: Label): string {
  if (l.mode === 'egg') return l.words;
  return l.words === '' ? l.name : `${l.name} · ${l.words}`;
}

export function makeOverlay(box: HTMLElement): Overlay {
  const root = document.createElement('div');
  root.className = 'bh-overlay';
  root.setAttribute('aria-hidden', 'true');
  const zz = document.createElement('div');
  zz.className = 'bims-zzzs';
  const tags = document.createElement('div');
  tags.className = 'bh-tags';
  root.append(zz, tags);
  box.append(root);
  const els = new Map<string, HTMLDivElement>();

  return {
    root,
    labels(ls) {
      const keep = new Set<string>();
      const ins: TagIn[] = [];
      for (const { key, label, head, rank } of ls) {
        keep.add(key);
        let el = els.get(key);
        const sig = `${label.mode}|${label.pill ?? ''}|${textOf(label)}`;
        if (el === undefined) {
          el = document.createElement('div');
          el.className = 'bh-tag';
          tags.append(el);
          els.set(key, el);
        }
        if (el.dataset.sig !== sig) {
          el.dataset.sig = sig;
          el.dataset.mode = label.mode;
          el.replaceChildren();
          if (label.pill !== null) {
            const p = document.createElement('span');
            p.className = `bh-pill ${label.pill}`;
            p.textContent = PILL[label.pill];
            el.append(p);
          }
          const words = label.mode === 'pill' ? '' : textOf(label);
          if (words !== '') {
            const s = document.createElement('span');
            s.className = 'bh-label';
            s.textContent = words;
            el.append(s);
          }
        }
        el.style.visibility = head === null ? 'hidden' : '';
        if (head !== null) ins.push({ name: key, x: head.x, y: head.y, w: el.offsetWidth, h: el.offsetHeight, pill: label.mode === 'pill', rank });
      }
      for (const [k, el] of els) {
        if (keep.has(k)) continue;
        el.remove();
        els.delete(k);
      }
      const { at } = placeTags(ins, box.clientWidth, box.clientHeight);
      for (const t of ins) {
        const el = els.get(t.name);
        const p = at.get(t.name);
        if (el === undefined) continue;
        el.style.visibility = p === undefined ? 'hidden' : '';
        if (p !== undefined) el.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
      }
    },
    zzz(heads) {
      placeZzz(zz, heads);
    },
    dispose() {
      root.remove();
    },
  };
}
