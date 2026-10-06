// Test mode only: amb-web's parts mounted alone on fake data, so qa-type's checks (typing,
// accents, edit keys, pickers, chips, the spotlight, the pearl) run before a screen mounts them.
// What they send shows in a visible log (`lab.sent`, one row per send or command), the effect a
// check reads instead of a hook. Routes `lab/composer`, `lab/spotlight`, `lab/pearl` (amb-win's
// shell draws them only in test mode).
import { useState, type JSX } from 'react';
import { Composer } from './Composer';
import { prefixFirst } from './tokens';
import type { ArgKind, ComposerSources, PickFile } from './sources';
import { Spotlight, type SpotData } from '@/spotlight';
import { LivePearl, MOODS, type Mood } from '@/pearl';

const FILES: readonly PickFile[] = [
  { path: 'README.md', dir: false },
  { path: 'src', dir: true },
  { path: 'src/app.ts', dir: false },
  { path: 'src/main.rs', dir: false },
  { path: 'docs/my notes', dir: true },
  { path: 'docs/my notes/plan.md', dir: false },
  { path: 'shots/screen.png', dir: false },
];

/** The commands of bar 2.1 (with the /shortcuts alias /keys); the ones without a screen or a cmd yet are greyed. */
const COMMANDS = [
  ['new', 'start an agent: /new [-w] [name:] objective', true, true],
  ['archive', 'archive an agent', true, true],
  ['restore', 'bring an archived agent back', true, true],
  ['isolate', 'give an agent its own worktree', true, true],
  ['rename', 'rename an agent', true, true],
  ['answer', 'answer card N', true, true],
  ['close', 'close card N', true, true],
  ['model', 'the model of this agent', true, true],
  ['reasoning', 'its reasoning effort', true, true],
  ['interrupt', 'interrupt the turn', false, true],
  ['stop', 'stop an agent', true, true],
  ['compact', 'compact the thread', false, true],
  ['quit', 'quit the app (the agents keep running)', false, true],
  ['restart', 'restart the core, nothing lost', false, true],
  ['update', 'update bise', false, true],
  ['inbox', 'the inbox', false, false],
  ['cards', 'the inbox', false, false],
  ['agents', 'the agents', false, false],
  ['switch', 'find an agent', false, false],
  ['archived', 'archived agents', false, false],
  ['diff', 'review a branch', true, false],
  ['artifacts', 'artifacts', false, false],
  ['scheduled', 'scheduled jobs', false, false],
  ['models', 'models', false, false],
  ['provider', 'providers', false, false],
  ['plugins', 'plugins', true, false],
  ['computer-use', 'computer use', false, false],
  ['voice', 'voice settings', false, false],
  ['welcome', 'welcome', false, false],
  ['setup', 'check the setup again', false, false],
  ['help', 'the key list', false, false],
  ['shortcuts', 'the key list', false, false],
  ['keys', 'the key list', false, false],
  ['theme', 'auto, light or dark', true, false],
] as const;

const ARG_KINDS: Partial<Record<string, readonly ArgKind[]>> = {
  model: [{ words: [{ value: 'opus', desc: 'the strongest' }, { value: 'sonnet', desc: 'fast' }, { value: 'default', desc: 'the workspace default' }] }],
  reasoning: [{ words: [{ value: 'low', desc: '' }, { value: 'medium', desc: '' }, { value: 'high', desc: '' }] }],
  archive: ['agent'],
  stop: ['agent'],
  isolate: ['agent'],
  rename: ['agent', 'text'],
  restore: ['archived'],
  answer: ['card', 'text'],
  close: ['card', 'text'],
  new: ['text'],
};

const SOURCES: ComposerSources = {
  agents: [{ name: 'main', desc: 'bise' }, { name: 'perf', desc: 'sort_unstable in the hot query' }, { name: 'docs', desc: 'the README' }],
  skills: [
    { name: 'review', desc: 'review a change' },
    { name: 'plain-language', desc: 'concise replies' },
    { name: 'grill-me', desc: 'stress-test a plan' },
  ],
  commands: COMMANDS.map(([name, desc, args, ready]) => ({ name: `/${name}`, desc, args, ready, argKinds: ARG_KINDS[name] })),
  choices: (kind, q) => {
    const lists: Partial<Record<typeof kind, readonly { value: string; desc: string }[]>> = {
      agent: [{ value: 'perf', desc: 'sort_unstable in the hot query' }, { value: 'docs', desc: 'the README' }],
      archived: [{ value: 'old-fix', desc: 'archived 2 days ago' }],
      card: [{ value: '1', desc: 'alerts: which threshold?' }],
    };
    return prefixFirst(lists[kind] ?? [], q, (c) => c.value);
  },
  files: (q) => Promise.resolve(prefixFirst(FILES, q.replace(/^"/u, ''), (f) => f.path.split('/').at(-1) ?? f.path).slice(0, 20)),
  saveImage: (f) => Promise.resolve({ path: `/tmp/bise-lab/${f.name || 'pasted.png'}`, name: f.name || 'pasted.png' }),
};

const SPOT: SpotData = {
  projects: [
    { id: 'telemetry', name: 'telemetry', path: '/Users/me/code/telemetry', branch: 'main', agents: 2 },
    { id: 'shop', name: 'shop', path: '/Users/me/code/shop', branch: 'main', agents: 1 },
  ],
  agents: [
    { name: 'perf', project: 'telemetry', status: 'working', title: 'sort_unstable in the hot query' },
    { name: 'alerts', project: 'telemetry', status: 'idle', title: 'page on p99 regressions' },
    { name: 't1-97894', project: 'shop', status: 'done', title: 'checkout copy' },
  ],
  cards: [
    { id: 'c1', agent: 'alerts', project: 'telemetry', kind: 'question', text: 'Which threshold for p99: 250 ms or 400 ms?' },
    { id: 'c2', agent: 't1-97894', project: 'shop', kind: 'approval', text: 't1-97894 is ready to try\n1 commit on t1-97894 · +3 −0' },
  ],
  front: { app: 'Chrome', title: 'Pricing · Acme', url: 'https://acme.test/pricing' },
};

type Log = readonly string[];

function SentLog({ log }: { log: Log }): JSX.Element {
  return (
    <ol className="lab-sent" data-testid="lab.sent">
      {log.map((l, i) => (
        <li key={i} data-testid={`lab.sent.${i + 1}`}>
          {l}
        </li>
      ))}
    </ol>
  );
}

export function ComposerLab(): JSX.Element {
  const [log, setLog] = useState<Log>([]);
  const [busy, setBusy] = useState(false);
  return (
    <section className="lab" data-testid="lab.composer">
      <label>
        <input type="checkbox" checked={busy} onChange={(e) => { setBusy(e.currentTarget.checked); }} data-testid="lab.busy" /> a turn runs
      </label>
      <SentLog log={log} />
      <Composer
        target="lab/main"
        busy={busy}
        sources={SOURCES}
        to="you → bise · lab"
        onSend={(o) => { setLog((l) => [...l, JSON.stringify(o)]); }}
        onCommand={(name, args) => { setLog((l) => [...l, JSON.stringify({ command: name, args })]); }}
        onStop={() => { setLog((l) => [...l, JSON.stringify({ stop: true })]); }}
      />
    </section>
  );
}

export function SpotlightLab(): JSX.Element {
  const [log, setLog] = useState<Log>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  return (
    <section className="lab" data-testid="lab.spotlight">
      <SentLog log={log} />
      <Spotlight
        data={SPOT}
        answer={answer === null ? null : { text: answer, done: true }}
        onAsk={(text) => {
          setLog((l) => [...l, JSON.stringify({ ask: text })]);
          setAnswer(`bise heard: ${text}`);
        }}
        onOpen={(item) => { setLog((l) => [...l, JSON.stringify({ open: item.id })]); }}
        onOpenAnswer={() => { setLog((l) => [...l, JSON.stringify({ openAnswer: true })]); }}
        onClose={() => { setLog((l) => [...l, JSON.stringify({ close: true })]); }}
      />
    </section>
  );
}

const MOOD_NAMES = Object.keys(MOODS) as Mood[];

export function PearlLab(): JSX.Element {
  const [mood, setMood] = useState<Mood>('rest');
  return (
    <section className="lab" data-testid="lab.pearl">
      {MOOD_NAMES.map((m) => (
        <button key={m} type="button" onClick={() => { setMood(m); }} data-testid={`lab.mood.${m}`}>
          {m}
        </button>
      ))}
      <LivePearl mood={mood} size={68} testId="lab.pearl.canvas" />
    </section>
  );
}
