// A process in a side panel (designer's page process-panel v2, Gabriel's m_47397): one column, its
// title and state pill with its actions, who started it, where and when, its whole command
// highlighted, its CPU and memory as curves over the last 2 min while it runs (samples kept here,
// in the panel's own state, only while it is open: its hub is watched through a keyed lease, core
// processes_all {by: 'panel:…', project}), then its output taking the rest, or why none is kept.
// The words and the choices are procview.ts's. Owner: proc-panel.
import { useEffect, useMemo, useState } from 'react';
import { Press, tipAttrs } from '@/ds';
import { Code } from '@/thread/Code';
import { useProjects, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { useBarAgents } from '@/app/baragents';
import { procRoots } from '@/app/barrows';
import { running } from '@/proto/words_running.gen';
import { useAllProcesses } from './hooks';
import { isRunning, shortCwd, stateOf, urlWords, whereOf, type ProcItem, type St } from './model';
import { Output } from './Output';
import { RENEW_MS } from './Screen';
import { curve, memWords, metaTail, noneOf, pctWords, peakOf, pillOf, pushSample, quietOf, titleOf, type Empty, type Sample } from './procview';
import './panel.css';

/** The panel as the tab mounts it: its row from its hub, its watch while it runs, its samples. */
export function ProcPanel({ project, agent, id }: { project: string; agent: string; id: string }) {
  const store = useStore();
  const router = useRouter();
  const x = useAllProcesses(project).find((y) => y.p.agent === agent && y.p.id === id);
  const live = x !== undefined && isRunning(x.p);
  const now = useTick(live);
  const samples = useSamples(x, now);
  // open on a running one: its hub's list watched (every 2 s), the lease said again within its time
  useEffect(() => {
    if (!live) return;
    const by = `panel:${project}/${agent}/${id}`;
    const say = (on: boolean) => {
      store.command({ cmd: 'processes_all', on, by, project });
    };
    say(true);
    const t = setInterval(() => {
      say(true);
    }, RENEW_MS);
    return () => {
      clearInterval(t);
      say(false);
    };
  }, [store, project, agent, id, live]);
  const projects = useProjects();
  const agents = useBarAgents('');
  const roots = useMemo(() => procRoots(projects, agents), [projects, agents]);
  const [stopping, setStopping] = useState(false);
  if (x === undefined) {
    return (
      <div className="pn-screen pp" data-testid="app.panel.process">
        <p className="pp-gone" data-testid="proc.gone">{running.gone}</p>
      </div>
    );
  }
  const where = whereOfItem(x, roots.get(project) ?? []);
  const home = (window as { bise?: { home?: string } }).bise?.home || undefined;
  return (
    <ProcView
      x={x}
      st={stateOf(x.p, stopping)}
      now={now}
      where={where}
      cwd={shortCwd(x.p.cwd ?? '', home)}
      samples={samples}
      onAgent={() => { router.go({ screen: 'thread', project, agent }); }}
      onOpen={(url) => void (window as Partial<Window>).bise?.openExternal(url)}
      onStop={() => {
        setStopping(true);
        store.command({ cmd: 'proc_stop', project, agent, id });
      }}
      onCopy={(text) => void (window as Partial<Window>).bise?.copy(text)}
    />
  );
}

/** Where it runs in the meta line: 'acme › perf' (its project, then its worktree or folder). */
function whereOfItem(x: ProcItem, roots: Parameters<typeof whereOf>[1]): string {
  const w = whereOf(x.p.cwd, roots);
  return w === '' ? x.projectName : `${x.projectName} › ${w}`;
}

/** The panel from props (tests, shots): `now` pinned, `samples` given. */
export function ProcView({ x, st, now, where, cwd, samples, onAgent, onOpen, onStop, onCopy }: {
  x: ProcItem; st: St; now: number; where: string; cwd: string; samples: readonly Sample[];
  onAgent: () => void; onOpen: (url: string) => void; onStop: () => void; onCopy: (text: string) => void;
}) {
  const p = x.p;
  const live = st.k === 'running' || st.k === 'stopping';
  const pill = pillOf(p, st, now);
  const u = urlWords(p, st);
  const [asking, setAsking] = useState(false);
  const [lines, setLines] = useState(0);
  const [atError, setAtError] = useState(false);
  const failed = st.k === 'exited' && st.rc !== null && st.rc !== 0;
  const none = p.out === 'none' || p.out === 'unknown';
  const sub = live ? running.output_follows : atError ? running.output_first_error : lines > 0 ? running.output_lines({ n: lines.toLocaleString('en-US') as unknown as number }) : '';
  return (
    <div className="pn-screen pp" data-testid="app.panel.process" data-state={st.k}>
      <div className="pp-head">
        <h2 className="pp-title" data-testid="proc.title">{titleOf(p)}</h2>
        <span className={`pp-pill ${pill.tone}`} data-testid="proc.pill" {...tipAttrs(pill.tip)}>
          <span className={`pp-glyph${live ? ' breathe' : ''}`}>{pill.glyph}</span>
          {pill.words}
        </span>
        <span className="pp-acts">
          {u !== null && (
            <Press look="pp-act" onClick={() => { onOpen(u.url); }} data-testid="proc.open" {...tipAttrs(u.tip)}>{`${running.open} ${u.label}`}</Press>
          )}
          {st.k === 'running' && (
            <Press look={`pp-act${asking ? ' ask' : ''}`} onClick={() => { if (asking) onStop(); else setAsking(true); }} onBlur={() => { setAsking(false); }} data-testid="proc.stop">
              {asking ? running.stop_confirm : running.stop}
            </Press>
          )}
        </span>
      </div>
      <p className="pp-meta" data-testid="proc.meta">
        {running.meta_by}{' '}
        <Press look="pp-agent" onClick={onAgent} data-testid="proc.agent">{p.agent}</Press>
        {metaTail(p, st, where).map((m, i) => <span key={i}>{i === 0 ? ` ${m}` : ` · ${m}`}</span>)}
      </p>
      <div className="pp-cmd" data-testid="proc.cmd">
        <pre><Code text={p.cmd} lang="bash" /></pre>
        {cwd !== '' && <p className="pp-cwd">{running.cmd_in({ cwd })}</p>}
        <CopyButton text={p.cmd} onCopy={onCopy} testId="proc.copy" />
      </div>
      <Resources p={p} live={live} samples={samples} />
      <section className="pp-out" data-testid="proc.output">
        <div className="pp-shead">
          <h3>{running.output}</h3>
          {sub !== '' && <span className="pp-sub" data-testid="proc.output.sub">{sub}</span>}
        </div>
        <Output
          project={x.project}
          agent={p.agent}
          id={p.id}
          none={none}
          live={live}
          quiet={<EmptyFrame e={quietOf(p, st, now)} onCopy={onCopy} floating />}
          empty={<EmptyFrame e={noneOf(p)} onCopy={onCopy} />}
          onLines={setLines}
          {...(failed ? { openOnError: setAtError } : {})}
        />
      </section>
    </div>
  );
}

/** The output's empty place: a dashed frame, why (t-15 text-2), what to do (t-13 text-3), a command to copy. */
function EmptyFrame({ e, onCopy, floating = false }: { e: Empty; onCopy: (text: string) => void; floating?: boolean }) {
  return (
    <div className={`pp-empty${floating ? ' floating' : ''}`} data-testid={`proc.empty.${e.k}`}>
      <p className="pp-why">{e.why}</p>
      {e.todo !== undefined && <p className="pp-todo">{e.todo}</p>}
      {e.copy !== undefined && <CopyButton text={e.copy} onCopy={onCopy} label={running.copy_command} testId="proc.empty.copy" />}
    </div>
  );
}

function CopyButton({ text, onCopy, label = running.copy, testId }: { text: string; onCopy: (t: string) => void; label?: string; testId: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { setDone(false); }, 1_500);
    return () => { clearTimeout(t); };
  }, [done]);
  return (
    <Press look="pp-copy" onClick={() => { onCopy(text); setDone(true); }} data-testid={testId}>
      {done ? running.copied : label}
    </Press>
  );
}

/** CPU and memory over the last 2 min, its port; ended: the curve at half with 'while it ran'; never measured: nothing. */
function Resources({ p, live, samples }: { p: ProcItem['p']; live: boolean; samples: readonly Sample[] }) {
  if (!live && samples.length === 0) return null;
  const cpu = samples.map((s) => s.cpu);
  const mb = samples.map((s) => s.mb);
  const last = samples.at(-1);
  const port = live ? (p.ports ?? [])[0] : undefined;
  return (
    <section className={`pp-res${live ? '' : ' ended'}`} data-testid="proc.resources">
      <div className="pp-shead">
        <h3>{running.resources}</h3>
        <span className="pp-sub">{live ? running.resources_live : running.resources_ended}</span>
      </div>
      <div className="pp-graphs">
        <Graph label={running.label_cpu} vals={cpu} floor={10} at={samples.map((s) => s.at)} fmt={(v) => `${pctWords(v)} %`}
          words={live && last !== undefined ? running.now_peak_pct({ now: pctWords(last.cpu), peak: pctWords(peakOf(cpu)) }) : running.peak_pct({ peak: pctWords(peakOf(cpu)) })} testId="proc.cpu" />
        <Graph label={running.label_memory} vals={mb} floor={64} at={samples.map((s) => s.at)} fmt={memWords}
          words={live && last !== undefined ? running.now_peak_mem({ now: memWords(last.mb), peak: memWords(peakOf(mb)) }) : running.peak_mem({ peak: memWords(peakOf(mb)) })} testId="proc.mem" />
        <div className="pp-listen" data-testid="proc.listening">
          <span className="pp-glabel">{running.label_listening}</span>
          <span className="pp-gval">{port !== undefined ? `:${String(port)}` : running.listening_none}</span>
        </div>
      </div>
    </section>
  );
}

const GW = 240;
const GH = 40;

function Graph({ label, vals, at, floor, fmt, words, testId }: { label: string; vals: readonly number[]; at: readonly number[]; floor: number; fmt: (v: number) => string; words: string; testId: string }) {
  const c = curve(vals, GW, GH, floor);
  const [hover, setHover] = useState<number | null>(null);
  const tip = hover === null ? undefined : running.point({ v: fmt(vals[hover] ?? 0), at: clock(at[hover] ?? 0) });
  return (
    <div className="pp-graph" data-testid={testId}>
      <span className="pp-glabel">{label}</span>
      <svg
        viewBox={`0 0 ${String(GW)} ${String(GH)}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label} ${words}`}
        onMouseMove={(e) => {
          if (vals.length < 2) return;
          const r = e.currentTarget.getBoundingClientRect();
          const step = r.width / 59;
          const i = vals.length - 1 - Math.round((r.right - e.clientX) / step);
          setHover(i >= 0 && i < vals.length ? i : null);
        }}
        onMouseLeave={() => { setHover(null); }}
        {...tipAttrs(tip)}
      >
        <line className="pp-base" x1="0" x2={GW} y1={GH - 0.5} y2={GH - 0.5} />
        {c !== null && <path className="pp-area" d={c.area} />}
        {c !== null && <path className="pp-line" d={c.line} vectorEffect="non-scaling-stroke" />}
      </svg>
      <span className="pp-gval">{words}</span>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (ms: number): string => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Its samples while the panel is open: one per row its hub sends (every 2 s while watched). */
function useSamples(x: ProcItem | undefined, now: number): readonly Sample[] {
  // a new row from its hub is a new sample, at the panel's clock (its 2 s tick): kept as the render
  // sees it (React's 'state from a prop that changed'), never in an effect
  const p = x?.p;
  const [held, setHeld] = useState<{ readonly from: ProcItem['p'] | undefined; readonly ring: readonly Sample[] }>({ from: undefined, ring: [] });
  if (p !== held.from) {
    const ring = p !== undefined && isRunning(p) ? pushSample(held.ring, { at: now, cpu: p.cpu, mb: p.rss_mb }) : held.ring;
    setHeld({ from: p, ring });
    return ring;
  }
  return held.ring;
}

/** The clock for the pill's age: every 2 s while it runs. */
function useTick(live: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => { setNow(Date.now()); }, 2_000);
    return () => { clearInterval(t); };
  }, [live]);
  return now;
}
