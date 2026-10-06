// ⌘K: the agent palette (tui-parity V1, W14; the TUI's sb/palette.rs):
// every agent of his projects the core holds, archived too, found by name.
// Type to filter, ↑↓ (ctrl+p/n, tab/shift+tab) move, ⏎ opens, esc closes.
// Its own field: the composer keeps its draft. Owner: amb-win.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Field, SpotRow, Spot } from '@/ds';
import type { Agent, ProjectRow } from '@/proto';
import { useProjects, useStore } from '@/store';
import { dotOf } from '@/agents/model';
import { MAIN } from './route';
import { useRouter } from './router';

export interface PaletteItem {
  readonly project: string;
  readonly projectName: string;
  readonly agent: Agent;
}

/** Every agent, by project in his order (bise first), then filtered: name prefix before substring, live before archived. Pure. */
export function paletteItems(projects: readonly ProjectRow[], agentsOf: (p: string) => readonly Agent[], query: string): PaletteItem[] {
  const q = query.trim().toLowerCase();
  const ordered = [...projects].sort((a, b) => Number(b.home) - Number(a.home) || a.order - b.order);
  const all = ordered.flatMap((p) => agentsOf(p.project).map((agent) => ({ project: p.project, projectName: p.home ? 'bise' : p.name, agent })));
  const score = (i: PaletteItem): number => {
    const n = i.agent.name.toLowerCase();
    const where = n.startsWith(q) ? 0 : n.includes(q) || i.projectName.toLowerCase().includes(q) ? 1 : -1;
    return where < 0 ? -1 : where * 2 + (i.agent.archived ? 1 : 0);
  };
  return all
    .map((i, k) => ({ i, s: q === '' ? (i.agent.archived ? 1 : 0) : score(i), k }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || a.k - b.k)
    .map((x) => x.i);
}

export function Palette({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const router = useRouter();
  const projects = useProjects();
  const [q, setQ] = useState('');
  const [at, setAt] = useState(0);
  const field = useRef<HTMLInputElement>(null);
  const items = useMemo(() => paletteItems(projects, (p) => store.agents(p), q).slice(0, 50), [projects, store, q]);
  const cur = Math.min(at, Math.max(0, items.length - 1));

  useEffect(() => {
    field.current?.focus();
  }, []);

  const open = (i: PaletteItem | undefined) => {
    if (i === undefined) return;
    onClose();
    router.go({ screen: 'thread', project: i.project, agent: i.agent.main ? MAIN : i.agent.name });
  };

  const onKey = (e: KeyboardEvent) => {
    const down = e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey) || (e.ctrlKey && e.key === 'n');
    const up = e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey) || (e.ctrlKey && e.key === 'p');
    if (down || up) {
      e.preventDefault();
      setAt(Math.max(0, Math.min(items.length - 1, cur + (down ? 1 : -1))));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open(items[cur]);
    } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      className="app-palette"
      data-testid="app.palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div onKeyDown={onKey}>
        <Spot
          to="to an agent"
          input={
            <Field
              ref={field}
              value={q}
              placeholder="find an agent"
              aria-label="find an agent"
              onChange={(e) => {
                setQ(e.currentTarget.value);
                setAt(0);
              }}
              testId="app.palette.field"
            />
          }
          keys="↑↓ move · ⏎ open · esc close"
        >
          {items.map((i, k) => (
            <SpotRow
              key={`${i.project}/${i.agent.name}`}
              lead={i.agent.archived ? 'off' : dotOf(i.agent.status)}
              name={i.agent.main ? `${i.projectName} · main` : i.agent.name}
              where={i.projectName}
              what={i.agent.archived ? 'archived' : i.agent.title}
              on={k === cur}
              onClick={() => {
                open(i);
              }}
              testId={`app.palette.item.${String(k)}`}
            />
          ))}
        </Spot>
      </div>
    </div>
  );
}
