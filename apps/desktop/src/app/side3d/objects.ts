// src/app/side3d · the 3D object of each thing on the right side (page native-mac §7): one per
// bubble (its own minimal model, bubble3d.ts: agents = a bust, artifacts = three fanned sheets,
// scheduled = an hourglass, processes = a small laptop), then one per kind in the cards (PR mailbox, page lectern, deck blackboard, sheet
// chart, link globe, image easel, video TV; dev server retro computer, debugger electronics bench,
// any other process the rack; timer hourglass, watch telescope). Decided from typed state (the
// hub's kind, a process's url and ports), never from words. Three-free: ids only (bims/render/objects
// ids.ts); cache.ts draws them. Pure. Owner: nm-side.
import type { ObjId } from '@/bims/render/objects/ids';
import type { Proc } from '@/proto';

/** The four bubbles in their order, top to bottom (⌥⌘1-⌥⌘4), and the world's when it folds into one. */
export const BUBBLES = ['agents', 'artifacts', 'scheduled', 'processes'] as const;
export type BubbleId = (typeof BUBBLES)[number];

/** What a picture shows: an object of the office, a bim's head (an agent's card), or a bubble's own object (bubble3d.ts). */
export type Thing = { readonly obj: ObjId } | { readonly head: string; readonly main: boolean } | { readonly bubble: BubbleId };

/** Each bubble's object: its own minimal model (bubble3d.ts: a bust, three sheets, an hourglass, a laptop). Pure. */
export function bubbleThing(b: BubbleId): Thing {
  return { bubble: b };
}

/** An artifact's object by the hub's kind (an open set: anything else is a file, the lectern's paper). Pure. */
export function artifactObj(kind: string): ObjId {
  switch (kind.toLowerCase()) {
    case 'pr':
      return 'mailbox';
    case 'deck':
    case 'pptx':
    case 'slides':
      return 'blackboard';
    case 'sheet':
    case 'xlsx':
    case 'chart':
      return 'charts';
    case 'link':
    case 'url':
    case 'site':
      return 'globe';
    case 'image':
    case 'shot':
    case 'shots':
    case 'png':
      return 'easel';
    case 'video':
    case 'film':
      return 'crt';
    default:
      return 'lectern';
  }
}

/** A process's object: a web page found on it is a dev server, a port that is no web page a debugger, else the rack. Pure. */
export function procObj(p: Pick<Proc, 'url' | 'ports'>): ObjId {
  if ((p.url ?? '') !== '') return 'retro';
  if ((p.ports ?? []).length > 0) return 'electronics';
  return 'rack';
}

/** A scheduled task wakes on time (the hourglass); a watch waits on something (the telescope). Pure. */
export function laterObj(kind: 'timer' | 'watch'): ObjId {
  return kind === 'timer' ? 'hourglass' : 'telescope';
}
