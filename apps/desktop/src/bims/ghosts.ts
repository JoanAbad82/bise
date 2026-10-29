// A new project's welcome office (page new-project-home, pick A): the plan laid as if `n` more
// agents had come, so their desks' spots are the first free ones in start order on any map; those
// desks are not built (no desk, no chair, no bim) but drawn as dashed outlines (render/ghost.ts,
// Office.ghosts). Their furniture boxes stay: the outline's footprint is the desk's own. Pure.
// Owner: project-home.
import type { Agent } from '@/proto';
import type { LayoutFn } from './model';

/** the empty desks the welcome shows (designer m_38070: 4) */
export const WELCOME_GHOSTS = 4;

/** a ghost's name: no agent's (a name never holds a NUL) */
const ghostName = (i: number): string => `\u0000ghost${String(i)}`;

/** `layoutOf` with `n` empty desks drawn as ghosts after the live agents' desks. Pure. */
export function withGhosts(layoutOf: LayoutFn, n: number = WELCOME_GHOSTS): LayoutFn {
  return (agents, map) => {
    const like = agents[0];
    if (like === undefined || n <= 0) return layoutOf(agents, map);
    const ghosts: Agent[] = [];
    for (let i = 0; i < n; i++) ghosts.push({ ...like, name: ghostName(i), main: false, archived: false });
    const o = layoutOf([...agents, ...ghosts], map);
    const names = new Set(ghosts.map((g) => g.name));
    const desks = new Map([...o.desks].filter(([name]) => !names.has(name)));
    const spots = ghosts.flatMap((g) => {
      const s = o.desks.get(g.name);
      return s === undefined ? [] : [s];
    });
    return { ...o, desks, ghosts: spots };
  };
}
