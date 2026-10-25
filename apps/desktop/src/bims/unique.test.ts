// The office's one-of-each law (Gabriel m_42685: « jamais plusieurs fois le même objet »; design
// bims-plugins m_42693): for any set of his plugins, on every map, grown or not, no object is drawn
// twice in an office (a plant once per pot): the office driver's steps (uniqueObjects, then
// extensions.ts grownFor and corners.ts objectSpots, a compact swap included). Fixtures only.
import { describe, expect, it } from 'vitest';
import type { PluginState } from '@/proto';
import { activities } from './activity';
import { labelsOf } from './labels';
import { localOf } from './eggs';
import { layoutOf } from './maps';
import { makeDriver, NO_ATTENTION } from './office-driver';
import { newTimeline } from './timeline';
import { MAP_IDS } from './maps/ids';
import { agent, mainAgent } from './fixtures';
import { objectSpots } from './corners';
import { grownFor } from './extensions';
import { officeObjects, uniqueObjects, unitOf, type PluginRow } from './plugin-objects';
import { OBJ_IDS, type ObjId } from './render/objects/ids';

/** his plugins as the core sends them: many share a default object (3 printers, 3 chart boards, 2 easels, plants, racks, shelves) */
const POOL: readonly (readonly [string, string])[] = [
  ['docs', 'plugin'], ['sheets', 'plugin'], ['slides', 'plugin'], ['blender', 'plugin'], ['computer', 'plugin'], ['bise_stats', 'plugin'],
  ['hn', 'plugin'], ['reddit', 'plugin'], ['kit', 'plugin'], ['bluesky', 'plugin'], ['x', 'plugin'], ['image_generation', 'plugin'],
  ['mistral:notion', 'mistral'], ['mistral:slack', 'mistral'], ['mistral:granola', 'mistral'], ['mistral:gmail', 'mistral'], ['mistral:outlook_calendar', 'mistral'],
  ['mistral:google_calendar', 'mistral'], ['mistral:github_app', 'mistral'], ['mistral:web_search', 'mistral'], ['mistral:tavily', 'mistral'], ['mistral:wandb', 'mistral'],
  ['mistral:bigquery', 'mistral'], ['mistral:metabase', 'mistral'], ['mistral:jira', 'mistral'], ['mistral:confluence', 'mistral'], ['mistral:datadog', 'mistral'],
  ['mistral:linear', 'mistral'], ['mistral:sentry_agent', 'mistral'], ['mistral:google_drive_mcp', 'mistral'], ['mistral:deskare', 'mistral'], ['mistral:getdx', 'mistral'],
  ['mistral:analytics', 'mistral'], ['figma', 'mcp'], ['playwright', 'mcp'], ['postgres', 'mcp'], ['skills:personal', 'skills'], ['skills:team', 'skills'], ['skills:repo', 'skills'],
  ['bise', 'plugin'],
];
const STATES: readonly PluginState[] = ['loaded', 'loaded', 'loaded', 'disabled', 'invalid'];

/** a small seeded generator (mulberry32): the same sets on every run */
function rand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** a set of his plugins and his picks: some rows lit, some off, some broken or owing a login; a few picks, two of them sometimes the same object */
function setOf(seed: number): { rows: PluginRow[]; picks: Map<string, ObjId> } {
  const r = rand(seed);
  const rows: PluginRow[] = [];
  const picks = new Map<string, ObjId>();
  const shared = OBJ_IDS[Math.floor(r() * OBJ_IDS.length)] as ObjId;
  for (const [id, kind] of POOL) {
    if (r() < 0.25) continue;
    const state = STATES[Math.floor(r() * STATES.length)] as PluginState;
    rows.push({ id, name: id, kind, state, ...(r() < 0.15 ? { login: 'needs' } : {}) });
    if (r() < 0.08) picks.set(id, r() < 0.5 ? shared : (OBJ_IDS[Math.floor(r() * OBJ_IDS.length)] as ObjId));
  }
  return { rows, picks };
}

const crew = [mainAgent(), agent('ada'), agent('bob'), agent('cy'), agent('dee')];

describe('the office: one of each object', () => {
  it('for any set of his plugins, on every map, no object is drawn twice (a plant once per pot)', () => {
    const twice: string[] = [];
    for (const map of MAP_IDS) {
      for (let seed = 1; seed <= 3; seed++) {
        const { rows, picks } = setOf(seed * 7919 + map.length);
        const o = layoutOf(crew, map);
        const objs = uniqueObjects(officeObjects(rows, picks));
        // the square first; what found no room there grows the office (a map that grows), placed again in it
        const first = objectSpots(o, objs);
        const placed = objectSpots(grownFor(o, objs, first.placed).office, objs, first.placed).placed;
        const seen = new Map<string, string>();
        for (const p of placed) {
          const u = unitOf(p);
          const had = seen.get(u);
          if (had !== undefined) twice.push(`${map} #${String(seed)}: ${u} for ${had} and ${p.key}`);
          seen.set(u, p.key);
        }
      }
    }
    expect(twice.slice(0, 12)).toEqual([]);
  }, 30_000);
});

describe('the office driver: his plugins objects, each once', () => {
  it('three printers in: a printer and a press drawn', () => {
    const d = makeDriver({ activities, labelsOf, layoutOf, newTimeline });
    d.rows({ agents: crew, cards: [], places: [] }, crew, 'loft');
    const rows: PluginRow[] = ['docs', 'sheets', 'slides'].map((name) => ({ name, state: 'loaded' }));
    d.objects(officeObjects(rows, new Map()));
    const t = 1_791_100_000;
    d.step({ t, local: localOf(new Date(t * 1000)), night: false, reduced: true, forced: null }, NO_ATTENTION);
    const s = d.step({ t: t + 1, local: localOf(new Date((t + 1) * 1000)), night: false, reduced: true, forced: null }, NO_ATTENTION);
    expect(s?.corners.placed.map((p) => [p.key, p.obj]).sort()).toEqual([['docs', 'printer'], ['sheets', 'press']]);
  });
});
