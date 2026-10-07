// src/ds · the gallery: every component in each of its states, dark and light side by side, on fake
// data. It is the design system's dev route and the source of its visual check (check.mjs takes one
// shot per section and theme). Sections are `data-testid="ds.gallery.<name>"`; `?only=a,b` keeps
// those sections. Pure: no store, no core.
import { type ReactNode } from "react";
import {
  Answered, Art, Bar, Board, Button, Capsule, Card, Check, Chip, ComposerFrame, ComposerStill, Day, Diff, Dock, Dot, Empty, Err,
  Field, Fold, Group, Head, Help, Job, Kbd, Main, Marker, Menu, MenuItem, MenuSep, Msg, Onb, Opts, Pearl, Quote, Route, Row,
  SectionHead, Seg, Settings, Side, SideView, Skel, Spot, SpotGroup, SpotRow, SpotStill, Tabs, Thread, Thumbs, Toast, Toggle, Tool,
  Win, type Opt,
} from "../index";

const OUT = ["13  workers: [Worker; 4],", "14  queue: Bounded<64>,"].join(String.fromCharCode(10));
const OPTS: Opt[] = [{ n: 1, text: "keep 4 workers", on: true }, { n: 2, text: "go to 8" }, { n: 3, text: "ask me later", state: "hover" }];

/** every color cue of the design system, by group: the same words, one state per entry */
export const CONTRAST: Record<string, Record<string, ReactNode>> = {
  dot: { idle: <Dot lg />, wk: <Dot state="wk" lg />, nd: <Dot state="nd" lg />, ok: <Dot state="ok" lg />, er: <Dot state="er" lg />, off: <Dot state="off" lg /> },
  chip: { plain: <Chip>state</Chip>, acc: <Chip tone="acc">state</Chip>, err: <Chip tone="err">state</Chip>, ok: <Chip tone="ok">state</Chip> },
  bar: { run: <Bar pct={60} />, done: <Bar pct={60} state="done" />, err: <Bar pct={60} state="err" /> },
  help: { plain: <Help>check the key</Help>, err: <Help err>check the key</Help> },
  field: { plain: <Field defaultValue="sk-test" readOnly />, error: <Field defaultValue="sk-test" readOnly state="error" /> },
  msg: { plain: <Msg from="agent" name="search" time="10:43">the build ran</Msg>, error: <Msg from="agent" name="search" time="10:43" state="error">the build ran</Msg> },
  dock: { question: <Dock head="search" q="the build ran" />, plain: <Dock kind="plain" head="search" q="the build ran" />, err: <Dock kind="err" head="search" q="the build ran" /> },
  toast: { plain: <Toast>the build ran</Toast>, err: <Toast err>the build ran</Toast> },
  tool: { plain: <Tool>cargo build</Tool>, err: <Tool state="err">cargo build</Tool> },
  job: {
    wk: <Job state="wk" name="index" what="the build" />, nd: <Job state="nd" name="index" what="the build" />,
    ok: <Job state="ok" name="index" what="the build" />, er: <Job state="er" name="index" what="the build" />,
  },
  route: { wk: <Route state="wk" p1="main → index" pct={50} />, ok: <Route state="ok" p1="main → index" />, er: <Route state="er" p1="main → index" /> },
  diff: { plain: <Diff file="a.rs" lines={[{ old: 1, new: 1, text: "x" }]} />, add: <Diff file="a.rs" lines={[{ new: 1, sign: "+", text: "x" }]} />, rm: <Diff file="a.rs" lines={[{ old: 1, sign: "-", text: "x" }]} /> },
};

/** the sections, in the reference's order; each draws in one theme */
export const SECTIONS: Record<string, () => ReactNode> = {
  buttons: () => (
    <>
      <div className="g-row"><Button testId="ds.btn.default">default</Button><Button kind="pri">send</Button><Button kind="ghost">later</Button><Button kind="danger">stop it</Button></div>
      <div className="g-row"><Button state="hover">hover</Button><Button state="active">active</Button><Button state="focus">focus</Button><Button state="disabled">disabled</Button><Button kind="pri" state="loading">sending</Button></div>
    </>
  ),
  chips: () => (
    <div className="g-row"><Chip>main.rs</Chip><Chip tone="acc">new</Chip><Chip tone="err">failed</Chip><Chip tone="ok">merged</Chip><Kbd>⌘I</Kbd><Kbd>esc</Kbd></div>
  ),
  seg: () => (
    <div className="g-col">
      <Seg items={["thread", "changes", "artifacts"]} on={0} testId="ds.seg" />
      <Seg items={["all", "needs you", "done"]} on={1} hover={2} />
    </div>
  ),
  controls: () => (
    <div className="g-row"><Toggle on={false} label="off" /><Toggle on label="on" /><Toggle on={false} state="hover" /><Toggle on state="hover" /><Toggle on state="focus" /><Toggle on={false} state="disabled" /><Check on={false} /><Check on /></div>
  ),
  field: () => (
    <div className="g-col">
      <Field placeholder="search projects" testId="ds.field" />
      <Field defaultValue="acme/assistant" state="focus" />
      <Field defaultValue="sk-…" state="error" />
      <Help err>that key was refused: check it in your provider's console</Help>
      <Help>stored in your Keychain, never in a file</Help>
    </div>
  ),
  status: () => (
    <div className="g-col">
      <div className="g-row"><Dot state="wk" /><Dot state="nd" /><Dot state="ok" /><Dot state="er" /><Dot state="off" /><Dot /><Dot state="nd" lg /><Pearl size={22} /><Pearl size={40} /></div>
      <Bar pct={42} /><Bar /><Bar pct={100} state="done" /><Bar pct={60} state="err" />
      <Skel /><Skel />
    </div>
  ),
  empty: () => (
    <div className="g-col">
      <Empty title="nothing waits for you">bise brings what needs you here</Empty>
      <Err>the core stopped: restarting it</Err>
    </div>
  ),
  rows: () => (
    <div className="g-side">
      <Side foot="+ add a project" testId="ds.side">
        <Row kind="me" name="bise" sub="every project" on testId="ds.row.bise" />
        <SectionHead>projects</SectionHead>
        <Row kind="pj" name="telemetry" dot="nd" end="2" needs />
        <Row kind="ag" name="alerts" dot="wk" end="12 min" />
        <Row kind="ag" name="search" dot="nd" end="?" needs state="hover" />
        <Row kind="pj" name="stock" dot="ok" end="10:40" />
        <Row kind="ag" name="flash-sale" dot="ok" end="done" state="focus" />
        <Row kind="arch" name="old-import" end="2d" />
      </Side>
    </div>
  ),
  head: () => (
    <div className="g-main">
      <Main>
        <Head title="telemetry" sub="main · 3 agents" dot="nd" end={<><Chip>⌥1</Chip><Button kind="ghost">changes</Button></>} />
        <Head title="bise" sub="every project" pearl={22} />
      </Main>
    </div>
  ),
  thread: () => (
    <div className="g-main">
      <Thread testId="ds.thread">
        <Day>today</Day>
        <Msg from="you" name="you" av="G" time="10:41" via="by voice, from Chrome" context={<Chip>decode_pool.rs</Chip>}
          quote={<>1 “workers: [Worker; 4],” decode_pool.rs:13-14 · 2 lines</>}>
          why only 4 workers here?
        </Msg>
        <Msg from="bise" name="bise" time="10:41"
          after={<><Tool>read decode_pool.rs</Tool><Tool state="open" out={OUT}>grep Worker</Tool>
            <Tool state="run">cargo test -p decode</Tool><Tool state="err">cargo build: 2 errors</Tool>
            <Route state="wk" p1="telemetry · main → alerts" p2="raise the pool to 8 and bench it" p3="2 min" pct={40} />
            <Route state="ok" p1="stock · main → flash-sale" p2="replay done" p3="10:40" />
            <Art title="↗ flash sale replay" meta="stock · 10:40" isNew /></>}>
          4 was the core count of the CI box. on your Mac, <code>8</code> is safe; i asked alerts to bench it.
        </Msg>
        <Fold>4 messages between 2 agents</Fold>
        <Msg from="agent" name="alerts" dot="wk" time="10:42" indent state="streaming">benching 8 workers on the replay set</Msg>
        <Marker>? search asked you · it waits above the composer</Marker>
        <Answered>main answered for you: “keep the old index”</Answered>
        <Msg from="agent" name="search" dot="er" time="10:43" state="error">the index build failed twice: out of disk</Msg>
      </Thread>
    </div>
  ),
  diff: () => (
    <Diff file="src/decode_pool.rs" add={2} rm={1} testId="ds.diff" pop="quote 2 lines"
      lines={[
        { old: 12, new: 12, text: "pub struct Pool {" },
        { old: 13, sign: "-", text: "    workers: [Worker; 4]," },
        { new: 13, sign: "+", text: "    workers: [Worker; 8],", sel: true },
        { new: 14, sign: "+", text: "    queue: Bounded<128>,", sel: true },
        { old: 14, new: 15, text: "}" },
      ]} />
  ),
  composer: () => (
    <div className="g-main">
      <ComposerFrame send="off" to="you → bise · opus · high" keys="@ file   $ skills   / commands   ⌘I inbox" testId="ds.composer">
        <ComposerStill placeholder="ask bise, or tell it what to do" />
      </ComposerFrame>
      <ComposerFrame send="on" to="you → telemetry · main" focus quote={<Quote>1 “workers: [Worker; 4],” decode_pool.rs:13-14 · 2 lines</Quote>}>
        <ComposerStill text="raise it to 8 and bench it" caret />
      </ComposerFrame>
      <ComposerFrame send="stop" to="you → alerts">
        <ComposerStill placeholder="a turn runs: what you send waits for its end" />
      </ComposerFrame>
    </div>
  ),
  dock: () => (
    <div className="g-main">
      <ComposerFrame send="off" to="you → search"
        tabs={<Tabs testId="ds.tabs" items={[{ id: "search", text: "search", dot: "nd", on: true }, { id: "review", text: "the review", dot: "nd" }, { id: "alerts", text: "alerts" }]} />}
        dock={<Dock head="? search needs you" keys="1 of 3   ← →   esc back" q="rebuild the index from scratch, or keep the old one?"
          ctx={{ body: "the nightly build ran out of disk at 92%; the old index still answers.", origin: "search · 10:43" }}
          opts={OPTS} typeHint="or type your answer below" testId="ds.dock" />}>
        <ComposerStill placeholder="your answer" />
      </ComposerFrame>
      <Dock head="the review asks you to approve" q="merge flash-sale into main?" opts={[{ n: 1, text: "merge" }, { n: 2, text: "not yet", picked: true }]} typeHint="pick 1 or 2" />
      <Dock kind="plain" head="alerts reports" q="8 workers: 1.9× faster, no drops." />
      <Dock kind="err" head="search failed" q="out of disk on /var: 0 B free." />
      <Opts items={OPTS} />
    </div>
  ),
  cards: () => (
    <div className="g-col">
      <Card who="telemetry · alerts" rest=" needs you" k="1 of 2" q="8 workers or keep 4?" keys="1 2 pick   esc later" stacked testId="ds.card">
        <Opts items={OPTS.slice(0, 2)} />
      </Card>
      <Card plain lead="ok" who="stock · flash-sale" rest=" is done" k="10:40" q="the replay ran clean: 0 oversold.">
        <Art title="↗ flash sale replay" meta="stock · 10:40" />
      </Card>
    </div>
  ),
  spotlight: () => (
    <div className="g-col">
      <Spot input={<SpotStill placeholder="ask bise, or jump to a project" />} keys="↵ open   ⌘↵ ask bise   esc close" testId="ds.spot">
        <SpotRow lead="bise" name="ask bise" what="“why only 4 workers”" hotkey="⌘↵" on />
        <SpotGroup>agents</SpotGroup>
        <SpotRow lead="nd" name="search" where="telemetry" what="needs you: rebuild the index?" hotkey="⌥2" />
        <SpotRow lead="wk" name="alerts" where="telemetry" what="benching 8 workers" hotkey="⌥1" />
        <SpotRow lead="ok" name="flash-sale" where="stock" what="done 10:40" />
      </Spot>
      <Spot input={<SpotStill text="why only 4 workers" />} to="to telemetry" />
    </div>
  ),
  menus: () => (
    <div className="g-row g-top">
      <Menu testId="ds.menu">
        <MenuItem hotkey="⌘C">copy</MenuItem>
        <MenuItem hotkey="⌘⇧C" on>copy as markdown</MenuItem>
        <MenuItem disabled>quote</MenuItem>
        <MenuSep />
        <MenuItem danger>stop the agent</MenuItem>
      </Menu>
      <div className="g-col">
        <Toast dot="ok" action={{ text: "open" }}>flash-sale is done</Toast>
        <Toast err action={{ text: "retry" }}>the send failed: the core is offline</Toast>
        <Toast>copied</Toast>
      </div>
    </div>
  ),
  board: () => (
    <div className="g-row g-top">
      <Board testId="ds.board">
        <Job state="wk" name="alerts" hotkey="⌥1" psi end="12 min" what="bench 8 workers" pct={40} />
        <Job state="wk" name="index" end="2 min" what="rebuild the index" ind on />
        <Job state="nd" name="search" hotkey="⌥2" endChip={{ children: "?", tone: "acc" }} what="rebuild or keep?" hover />
        <Job state="er" name="import" end="▲" what="out of disk" />
        <Job state="ok" name="flash-sale" end="10:40" what="replay done" />
        <Job state="" name="docs" end="idle" what="waits for a task" />
        <Job state="sched" name="nightly" end="02:00" what="the nightly replay" />
        <Job state="loading" name="…" />
      </Board>
      <div style={{ width: 220 }}><Thumbs items={[{ id: "a", title: "flash sale replay" }, { id: "b", title: "bench chart", hover: true }]} /></div>
    </div>
  ),
  sideview: () => (
    <div className="g-row g-top">
      <SideView title="changes" end={<><Chip tone="ok">+2 −1</Chip><Button kind="ghost">open in editor</Button></>} testId="ds.sideview">
        <Row name="src/decode_pool.rs" end="+2 −1" on />
        <Row name="src/bench.rs" end="+40" />
      </SideView>
      <SideView title="artifacts" loading />
      <SideView title="versions" empty={{ title: "no versions yet", text: "the agent hasn't made any" }} />
    </div>
  ),
  settings: () => (
    <Settings title="general" sub="how bise looks and listens"
      nav={<><Row name="general" on /><Row name="models" /><Row name="voice" /><Row name="plugins" /></>}>
      <Group title="appearance" testId="ds.group" items={[
        { id: "theme", label: "theme", control: <Seg items={["system", "dark", "light"]} on={0} /> },
        { id: "sounds", label: "sounds", sub: "a soft tick when an agent needs you", control: <Toggle on /> },
        { id: "workspace", label: "workspace", value: "~/bise" },
        { id: "sync", label: "sync drafts", check: <Check on />, control: <Button>sync now</Button> },
      ]} help="changes apply at once" />
    </Settings>
  ),
  onboarding: () => (
    <Onb pearl={{ mood: "listen" }} title="hold fn, then talk" sub="bise hears you only while fn is down. let go and it acts on what you said."
      fn="down" cta={{ text: "continue" }} steps={4} step={1} testId="ds.onb" />
  ),
  capsule: () => (
    <div className="g-col">
      <Capsule words={<>raise the pool to 8 in <b>telemetry</b> <span className="lo">and bench it</span></>} typing wave="on" shot
        chips={<><Chip>Chrome · grafana</Chip><Chip tone="acc">telemetry</Chip></>} hint="release fn to send   fn esc cancel" testId="ds.capsule" />
      <Capsule words="sending to telemetry…" countdown />
      <Capsule lead="off" words={<span className="lo">offline: what you say waits</span>} wave="off" />
    </div>
  ),
  // never by color alone (bar N2): each group draws the same words in each of its color states;
  // shoot.mjs checks that, with increase contrast, every state of a group reads differently without
  // its color (a glyph, a word or a shape), items `ds.contrast.<group>.<state>`
  contrast: () => (
    <div className="g-col">
      {Object.entries(CONTRAST).map(([group, states]) => (
        <div key={group} className="g-row" data-testid={"ds.contrast." + group}>
          {Object.entries(states).map(([state, node]) => (
            <div key={state} className="g-cell" data-testid={"ds.contrast." + group + "." + state}>{node}</div>
          ))}
        </div>
      ))}
    </div>
  ),
  window: () => (
    <Win
      side={<Side foot="+ add a project"><Row kind="me" name="bise" sub="every project" /><SectionHead>projects</SectionHead><Row kind="pj" name="telemetry" dot="nd" end="2" needs on /></Side>}
      main={<Main><Head title="telemetry" sub="main · 3 agents" dot="nd" /><Thread><Msg from="bise" name="bise" time="10:41">i asked alerts to bench 8 workers.</Msg></Thread>
        <ComposerFrame send="off" to="you → telemetry · main"><ComposerStill placeholder="ask telemetry" /></ComposerFrame></Main>}
    />
  ),
};

export const WIDE = new Set(["thread", "composer", "dock", "board", "sideview", "settings", "onboarding", "window", "head", "rows"]);

/** the gallery: each section, dark | light */
export function Gallery({ only }: { only?: readonly string[] }) {
  const names = Object.keys(SECTIONS).filter((n) => !only || only.length === 0 || only.includes(n));
  return (
    <div className="g-page b-ui">
      {names.map((n) => (
        <section key={n} className={WIDE.has(n) ? "g-sec wide" : "g-sec"} data-testid={"ds.gallery." + n}>
          <h2 className="g-h">{n}</h2>
          <div className="g-themes">
            {(["dark", "light"] as const).map((t) => (
              <div key={t} className="g-theme b-ui" data-theme={t} data-testid={"ds.gallery." + n + "." + t}>{SECTIONS[n]?.()}</div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
