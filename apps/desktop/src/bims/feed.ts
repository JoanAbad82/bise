// The office's real parts for Office.tsx (bims-lead m_27551): the pure modules, and the renderer
// behind a dynamic import so three.js is its own chunk, asked for only when the office shows (the
// list never loads it). One place to rename a part. Owner: bims-wire.
import { activities } from './activity';
import { labelsOf } from './labels';
import { layoutOf } from './maps';
import { newTimeline } from './timeline';
import type { Parts } from './Office';

export const parts: Parts = {
  activities,
  layoutOf,
  newTimeline,
  labelsOf,
  load: () => import('./render').then((m) => m.makeRenderer),
};
