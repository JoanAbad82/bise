// src/app/side3d · the artifacts float (mockup 13), the processes float and the scheduled float
// (one each, designer m_44975): rows of 48 with a 40 object per kind (objects.ts). Artifacts: the
// name as the pink chip, its kind and agent under it, the accent dot when new, its age. Processes:
// the command as typed, mono 12 (typed), whose and where under it ('designer · :47977 · 1 d'), '∿'
// in text-3 while it runs (the processes page's mark: green is only a diff's +, designer m_44499).
// Scheduled: a timer's hourglass, a watch's telescope, its rhythm and next time. Each row opens its thing in a tab (openTab) and
// wires its entity's menu (useEntityMenu). Owner: nm-side.
import type { Agent, Proc } from '@/proto';
import { AppIcon, tipAttrs, type AppIconName } from '@/ds';
import { ago } from '@/agents/model';
import { kindOf, type Item } from '@/artifacts/model';
import { isRunning, markOf, portWords, rowCmd, stateOf, urlWords, type ProcItem } from '@/running/model';
import { asks, howOften, nextWords, type Task } from '@/scheduled/model';
import { alarms } from '@/thread/wake';
import { panel } from '@/proto/words_panel.gen';
import { side } from '@/proto/words_side.gen';
import { useEntityMenu } from '../menus/use';
import { ThingPic } from './Bubbles';
import { SideRow } from './Flyout';
import { artifactObj, laterObj, procObj } from './objects';
import { openTab } from './ports';

/** a row's object, css px */
export const ROW_PX = 40;

const CHIP: Record<ReturnType<typeof kindOf>, AppIconName> = { pr: 'branch', page: 'file', file: 'file', shots: 'artifacts' };

export function ArtifactRow({ it, now }: { it: Item; now: number }) {
  const a = it.a;
  const menu = useEntityMenu({ kind: 'artifact', project: it.project, id: a.id });
  return (
    <SideRow
      pic={<ThingPic thing={{ obj: artifactObj(a.kind) }} px={ROW_PX} tile="artifacts" />}
      title={
        <span className="b-artchip s3-chip">
          <AppIcon name={CHIP[kindOf(a.kind)]} size={14} />
          <span className="b-artchip-title">{a.title}</span>
        </span>
      }
      sub={`${a.kind} · ${a.agent}`}
      end={
        <>
          {a.new && <span className="s3-dot" data-tone="acc" {...tipAttrs(side.new_tip)} />}
          <span className="s3-age">{ago(a.at_ms, now)}</span>
        </>
      }
      label={a.title}
      onClick={() => {
        openTab({ kind: 'artifact', project: it.project, id: a.id });
      }}
      menu={menu}
      testId={`app.flyout.artifacts.${it.project}.${a.id}`}
    />
  );
}

/** where a process listens, its age: 'perf · localhost:5173 · 2 h' */
function procSub(p: Proc, now: number): string {
  const s = stateOf(p);
  const where = urlWords(p, s)?.row ?? portWords(p, s);
  return [p.agent, where, ago(p.started_ms, now)].filter((x) => x !== '').join(' · ');
}

/** a process's command as he typed it ('python3 -m http.server 47977'), never the system's process name; its program by name, a 'cd <its folder> &&' gone (running/model rowCmd) */
export function typed(p: Pick<Proc, 'cmd' | 'cwd'>): string {
  const c = rowCmd(p.cmd, p.cwd);
  return c.args === '' ? c.prog : `${c.prog} ${c.args}`;
}

export function ProcRow({ x, now }: { x: ProcItem; now: number }) {
  const p = x.p;
  const menu = useEntityMenu({ kind: 'process', project: x.project, agent: p.agent, id: p.id });
  const on = isRunning(p);
  return (
    <SideRow
      pic={<ThingPic thing={{ obj: procObj(p) }} px={ROW_PX} tile="terminal" />}
      title={<span className="s3-cmd">{typed(p)}</span>}
      sub={procSub(p, now)}
      end={on ? <span className="s3-wave" {...tipAttrs(side.running_tip)} data-testid={`app.flyout.processes.${x.project}.${p.agent}.${p.id}.runs`}>{markOf(stateOf(p)).glyph}</span> : undefined}
      label={p.cmd}
      tip={p.cmd}
      onClick={() => {
        openTab({ kind: 'process', project: x.project, agent: p.agent, id: p.id });
      }}
      menu={menu}
      testId={`app.flyout.processes.${x.project}.${p.agent}.${p.id}`}
    />
  );
}

export function TaskRow({ x, now }: { x: Task; now: number }) {
  const menu = useEntityMenu({ kind: 'scheduled', project: x.project, id: x.t.id });
  return (
    <SideRow
      pic={<ThingPic thing={{ obj: laterObj('timer') }} px={ROW_PX} tile="scheduled" />}
      title={asks(x.t)}
      sub={[x.t.agent, howOften(x.t), nextWords(x.t, now)].join(' · ')}
      label={asks(x.t)}
      tip={x.t.words}
      onClick={() => {
        openTab({ kind: 'scheduled', project: x.project, id: x.t.id });
      }}
      menu={menu}
      testId={`app.flyout.scheduled.${x.project}.${String(x.t.id)}`}
    />
  );
}

/** An agent's watches (sb wake): its telescope rows, each opening the agent. */
export function WatchRows({ project, a, now, onOpen }: { project: string; a: Agent; now: number; onOpen: (agent: string) => void }) {
  const menu = useEntityMenu({ kind: 'agent', project, agent: a.name });
  return (
    <>
      {alarms(a, now).map((al) => (
        <SideRow
          key={al.id}
          pic={<ThingPic thing={{ obj: laterObj('watch') }} px={ROW_PX} tile="scheduled" />}
          title={a.name}
          sub={[al.note, al.end === '' ? '' : panel.until({ at: al.end })].filter((s) => s !== '').join(' · ')}
          label={al.title}
          tip={al.title}
          onClick={() => {
            onOpen(a.name);
          }}
          menu={menu}
          testId={`app.flyout.scheduled.${project}.${a.name}.watch.${String(al.id)}`}
        />
      ))}
    </>
  );
}
