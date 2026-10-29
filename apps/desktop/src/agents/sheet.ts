// An agent's sheet asked from anywhere (designer m_43315): the agent menu's 'Rename…' and 'Change
// Model…' open the agents page's one sheet (Tune.tsx AgentSheet), focused on its own field. A menu
// whose agent no page shows asks here and goes to the agents page, which opens the asked sheet when
// it mounts: the ask is kept in keep.ts (an open panel, no age), so a reload keeps it too. Pure but
// for keep. Owner: nm-pages-b.
import { keep } from '@/app/keep';

/** The field the sheet opens on. */
export type SheetField = 'name' | 'model';

/** The sheet open on a project's agents page: whose, and on which field. */
export interface SheetAsk {
  readonly agent: string;
  readonly field: SheetField;
}

const keyOf = (project: string) => `agents.sheet:${project}`;

/** The sheet kept open on `project`'s agents page (none: no sheet). */
export function keptSheet(project: string): SheetAsk | null {
  const v = keep.view(keyOf(project));
  if (typeof v !== 'object' || v === null) return null;
  const { agent, field } = v as Partial<SheetAsk>;
  return typeof agent === 'string' && (field === 'name' || field === 'model') ? { agent, field } : null;
}

/** Keeps `ask` as `project`'s open sheet (null: closed). */
export function keepSheet(project: string, ask: SheetAsk | null): void {
  keep.setView(keyOf(project), ask === null ? undefined : { agent: ask.agent, field: ask.field });
}
