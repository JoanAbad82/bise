// The one store of bise desktop: fed by the core's typed events (bise-proto's
// HubEv | CoreEv, src/proto), read by React through hooks.ts. Pure: no React,
// no Electron; the core is a CorePort (window.bise.core, or a fake in tests).
//
// The rule it keeps (amb-win m_9478): a change re-renders only who reads it.
// Every slice has its own key and listeners; an object a slice gives out is
// replaced only when that slice changed, so useSyncExternalStore sees the
// same reference otherwise. A thread is a key `${project}/${agent}`: its
// order (positions), its entries by position (a `thread` page merges, an
// `entry` replaces only that entry), typing, and his pending sends.
//
// The hub's yes/no questions (`confirm`, bar I9) belong to the connection
// that asked: a new `welcome` for that project (the core reconnected, so the
// hub sees a new connection) drops them, so he never answers an id the hub
// tied to a gone connection.
//
// Unknown tags (a newer core, the capsule's older events) are ignored at
// runtime: only the tags of TAGS are applied, and TAGS is checked complete
// against the generated unions at compile time. The store's shapes, TAGS and
// its key and compare helpers live in types.ts (re-exported here).
import type {
  Account,
  SwitchRow,
  Card,
  ComputerAgent,
  Agent,
  Artifact,
  DevServer,
  Entry,
  Found,
  IndexRow,
  Job,
  JsonValue,
  Feature,
  Merged,
  Mode,
  Model,
  Part,
  PickCommand,
  RoleRow,
  PickSkill,
  Plugin,
  ProjectRow,
  ScheduledTask,
  Worktree,
  FlowMode,
  ReleaseEv,
  UpdateEv,
} from "@/proto";
import type { CoreCmd, CorePort, CoreState } from "@/shared/api";
import {
  type Away,
  type BranchesList,
  type Confirm,
  type Dictation,
  type Diff,
  diffKey,
  type Ev,
  type EvOf,
  type FilesAnswer,
  type HubLine,
  type PagesList,
  type Pending,
  type PrsList,
  type QueuedTake,
  type TalkShot,
  sameJson,
  sameOrder,
  sameStrings,
  takeKey,
  threadKey,
  type ThreadOrder,
  type ToolOut,
  toolOutKey,
  typed,
  type VersionsList,
  type VoiceModeState,
} from "./types";
import { applyTyped } from "./apply";
import { answered, echoOf, keepLanded, sentOf, type Sent } from "./echo";
const EMPTY_ORDER: ThreadOrder = {
  order: [],
  before: null,
  more: false,
  loaded: false,
};
const EMPTY: readonly never[] = [];
/** A stopped dictation's final is the core's within its FINAL_WAIT (1.5 s, core.rs); past this, the window ends it. */
export const DICTATE_STOP_WAIT_MS = 5000;

/**
 * How much earlier than his send its echo (the hub's 'you' entry) may say it was written: the
 * window's clock and the hub's line times are the same machine's, read a few ms apart.
 */
export const ECHO_SLACK_MS = 5000;

interface Thread {
  view: ThreadOrder;
  byPos: Map<number, Entry>;
  typing: string;
  pending: readonly Pending[];
  landedIds?: readonly number[]; // A1: his ids that landed before their send's answer (echo.ts)
}

type Listener = () => void;

export interface StoreOptions {
  readonly now?: () => number;
}

export class Store {
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly threads = new Map<string, Thread>();
  /** @internal for apply.ts */ readonly slices = new Map<string, unknown>();
  private readonly evListeners = new Set<(ev: Ev) => void>();
  private coreState: CoreState = "down";
  private cid = 0;
  /** R8: when this window last sent a /model (a setup_first after it is his; a replayed one isn't) */
  private modelSentAt = Number.NEGATIVE_INFINITY;
  /** tool_out asks in flight (by key), and each project's last one (an error names no call) */
  /** @internal for apply.ts */ readonly toolAsks = new Set<string>();
  /** @internal for apply.ts */ readonly toolAsk = new Map<string, string>();
  /** each project's last queued_take (its error carries no id: it answers that one) */
  /** @internal for apply.ts */ readonly takeAsk = new Map<string, string>();
  /**
   * the diff asks this window sent with a `req` (none today: the review asks without one); a diff
   * that answers another `req` (a terminal's `/diff` the hub broadcasts) is for the view that
   * asked, never the review's diff of the same agent (lead m_16528)
   */
  /** @internal for apply.ts */ readonly diffReqs = new Set<number>();
  /** the dictations this window started and not over yet (bar I) */
  /** @internal for apply.ts */ readonly dictating = new Set<string>();
  /** the `@` queries on their way: rid -> its project and resolve; each project's newest rid */
  private rid = 0;
  private readonly asked = new Map<
    number,
    { project: string; resolve: (a: FilesAnswer | null) => void }
  >();
  private readonly newestRid = new Map<string, number>();
  /** commands asked from this core (said again when a core comes up) */
  private commandsAsked = false;
  /** the last shown set sent (null: none yet); said again to a core that comes back up */
  private shownSet: readonly string[] | null = null;
  /** the threads this window follows (subscribeThread), said again to a core that comes back up */
  private readonly subs = new Map<
    string,
    { project: string; agent: string; limit: number | undefined }
  >();
  private readonly now: () => number;

  constructor(
    private readonly port: Pick<CorePort, "send"> | null = null,
    opts: StoreOptions = {},
  ) {
    this.now = opts.now ?? Date.now;
  }

  // ---- subscriptions

  subscribe(key: string, fn: Listener): () => void {
    let set = this.listeners.get(key);
    if (set === undefined) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }

  /** Every applied event, after the store changed (one-shot things: open, route, job_end, error). */
  onEvent(fn: (ev: Ev) => void): () => void {
    this.evListeners.add(fn);
    return () => {
      this.evListeners.delete(fn);
    };
  }

  /** @internal for apply.ts */ emit(key: string): void {
    const set = this.listeners.get(key);
    if (set === undefined) return;
    for (const fn of [...set]) fn();
  }

  /** @internal for apply.ts */ put(key: string, value: unknown): void {
    this.slices.set(key, value);
    this.emit(key);
  }

  private slice<T>(key: string, empty: T): T {
    return (this.slices.get(key) as T | undefined) ?? empty;
  }

  // ---- reads (stable references between changes)

  projects(): readonly ProjectRow[] {
    return this.slice("projects", EMPTY);
  }
  agents(project: string): readonly Agent[] {
    return this.slice(`agents:${project}`, EMPTY);
  }
  /** The hub's cards when it sent them, else the projects row's. */
  cards(project: string): readonly Card[] {
    return this.slice(`cards:${project}`, EMPTY);
  }
  /** the last answer by voice the core heard (bar N14), null: none */
  voiceAnswer(): EvOf<"voice_answer"> | null {
    return this.slice<EvOf<"voice_answer"> | null>("voice_answer", null);
  }
  /** The card in front of him in this focused window (bar N14), or none: fn's talk can answer it by voice. */
  cardInView(project: string | null, card: number | null): void {
    this.command(
      project === null || card === null
        ? { cmd: "card_in_view" }
        : { cmd: "card_in_view", project, card },
    );
  }
  /** the hub's open yes/no questions to this window, oldest first */
  confirms(project: string): readonly Confirm[] {
    return this.slice(`confirms:${project}`, EMPTY);
  }
  /** the hub's last line to this window: a notice (a no's 'drop of @x cancelled', /flow) or a refused slash line */
  notice(project: string): HubLine | null {
    return this.slice<HubLine | null>(`notice:${project}`, null);
  }
  /** how tool calls are approved on this machine and the repo's saved rules (bar V8/W21); null until the hub said */
  approvals(project: string): EvOf<"approvals"> | null {
    return this.slice<EvOf<"approvals"> | null>(`approvals:${project}`, null);
  }
  prefs(): JsonValue | null {
    return this.slice<JsonValue | null>("prefs", null);
  }
  /** V14: the sign-in open in his browser (its link, to copy), until its end (accounts or error). */
  signing(): { readonly id: string; readonly url: string } | null {
    return this.slice<{ readonly id: string; readonly url: string } | null>(
      "signing",
      null,
    );
  }
  accounts(): readonly Account[] {
    return this.slice("accounts", EMPTY);
  }
  found(): readonly Found[] {
    return this.slice("found", EMPTY);
  }
  /** computer use's state (P.2); null until the core sent it */
  computerUse(): EvOf<"computer_use"> | null {
    return this.slice<EvOf<"computer_use"> | null>("computer_use", null);
  }
  /** S29: every agent using computer use now (each with its project when it is one of his) */
  computerLive(): readonly ComputerAgent[] {
    return this.slice("computer_live", EMPTY);
  }
  /** S29: the latest peek answer for an agent's key (a still, or why none); null before one */
  peek(key: string): EvOf<"computer_peek"> | null {
    return this.slice<EvOf<"computer_peek"> | null>(`peek:${key}`, null);
  }
  /** S29: his act on an agent's computer use by its key (take, hand_back, stop, peek); the rows follow state.json, never optimistic */
  computer(
    act: "take" | "hand_back" | "stop" | "peek",
    key: string,
    maxWidth?: number,
  ): void {
    this.command({
      cmd: "computer",
      act,
      key,
      ...(maxWidth === undefined ? {} : { max_width: maxWidth }),
    });
  }
  /** S29: forgets an agent's last still (its row unmounted: no image kept) */
  dropPeek(key: string): void {
    if (this.slices.get(`peek:${key}`) != null) this.put(`peek:${key}`, null);
  }
  /** a workspace's agent plugins (none: bise's home's); null until the core sent them */
  plugins(project?: string): readonly Plugin[] | null {
    return this.slice<readonly Plugin[] | null>(
      `plugins:${project ?? ""}`,
      null,
    );
  }
  artifacts(project: string): readonly Artifact[] {
    return this.slice(`artifacts:${project}`, EMPTY);
  }
  worktrees(project: string): readonly Worktree[] {
    return this.slice(`worktrees:${project}`, EMPTY);
  }
  /** the project's live scheduled tasks (sb every), whole each time; none until the hub said */
  scheduled(project: string): readonly ScheduledTask[] {
    return this.slice(`scheduled:${project}`, EMPTY);
  }
  devServers(project: string): readonly DevServer[] {
    return this.slice(`dev_servers:${project}`, EMPTY);
  }
  merged(project: string): readonly Merged[] {
    return this.slice(`merged:${project}`, EMPTY);
  }
  /** a project's features (amb-feed 5f436473: at hello, on change, on HubCmd features) */
  features(project: string): readonly Feature[] {
    return this.slice(`features:${project}`, EMPTY);
  }
  /** the models a project's agents can run, the TUI's /model list (amb-feed 7dfd1c74) */
  models(project: string): readonly Model[] {
    return this.slice(`models:${project}`, EMPTY);
  }
  /** a project's open PRs as the TUI's /prs (amb-feed 66faffe3): its head, rows, and the 'none' words; null until the hub sent them */
  /** a project's branches (the answer to branches); null before one */
  branches(project: string): BranchesList | null {
    return this.slice<BranchesList | null>(`branches:${project}`, null);
  }
  /** bise's versions (state at hello, again after versions) */
  versions(project: string): VersionsList | null {
    return this.slice<VersionsList | null>(`versions:${project}`, null);
  }
  /** the repo's flow mode: null before the hub said, or when it is not set */
  flow(project: string): FlowMode | null {
    return this.slice<FlowMode | null>(`flow:${project}`, null);
  }
  /** the hub's newest version switch (its phase, to/from, why it rolled back, at_ms); null: none said */
  switchRow(project: string): SwitchRow | null {
    return this.slice<SwitchRow | null>(`switch:${project}`, null);
  }
  /** his pages and the late promises' count; null before the hub said */
  pages(project: string): PagesList | null {
    return this.slice<PagesList | null>(`pages:${project}`, null);
  }
  /** /update's build in bise's source tree, its latest step; null when none ran */
  hubUpdate(project: string): UpdateEv | null {
    return this.slice<UpdateEv | null>(`update:${project}`, null);
  }
  /** a /release-bise run (dev builds), its latest step; null when none ran */
  release(project: string): ReleaseEv | null {
    return this.slice<ReleaseEv | null>(`release:${project}`, null);
  }
  /** ask a project's branches (the answer: branches) */
  askBranches(project: string): void {
    this.command({ cmd: "branches", project });
  }
  /** ask bise's versions again (the answer: versions) */
  askVersions(project: string): void {
    this.command({ cmd: "versions", project });
  }
  prs(project: string): PrsList | null {
    return this.slice<PrsList | null>(`prs:${project}`, null);
  }
  jobs(project: string): readonly Job[] {
    return this.slice(`jobs:${project}`, EMPTY);
  }
  /**
   * A tool call's real output (amb-feed dece0fe9: up to 4 KB from the session log, `cut` when
   * longer or only the 200-char preview was found), or the hub's refusal; null until asked and
   * answered. Ask with askToolOut on open: the answer goes to the asking connection only.
   */
  toolOut(project: string, agent: string, pos: number): ToolOut | null {
    return this.slice<ToolOut | null>(toolOutKey(project, agent, pos), null);
  }
  /** Ask the hub for a call's output once (an open row asks; a second open reads what came). */
  askToolOut(project: string, agent: string, pos: number): void {
    const key = toolOutKey(project, agent, pos);
    if (this.slices.get(key) != null || this.toolAsks.has(key)) return;
    this.toolAsks.add(key);
    this.toolAsk.set(project, key);
    this.port?.send({ cmd: "tool_out", project, agent, pos });
  }
  /** His queued message taken back (queued_take): its words, or the hub's refusal; null until then. */
  queuedTaken(project: string, agent: string, id: number): QueuedTake | null {
    return this.slice<QueuedTake | null>(takeKey(project, agent, id), null);
  }
  /**
   * Take back a message the hub holds until the agent's turn ends (amb-feed 34c35175: 'edit' =
   * take + his words back in the composer, 'drop' = take). The answer is queued_taken (its words),
   * or an error with the hub's words (already delivered, no longer waiting); the row leaves
   * Agent.queued at the next agents event.
   */
  queuedTake(project: string, agent: string, id: number): void {
    const key = takeKey(project, agent, id);
    if (this.slices.get(key) != null) this.put(key, null);
    this.takeAsk.set(project, key);
    this.command({ cmd: "queued_take", project, agent, id });
  }
  /** The latest diff of an agent's change, or of one commit (`commit`). */
  diff(project: string, agent: string, commit?: string): Diff | null {
    return this.slice<Diff | null>(diffKey(project, agent, commit), null);
  }
  away(): Away | null {
    return this.slice<Away | null>("away", null);
  }
  core(): CoreState {
    return this.coreState;
  }
  threadOrder(key: string): ThreadOrder {
    return this.threads.get(key)?.view ?? EMPTY_ORDER;
  }
  entry(key: string, pos: number): Entry | undefined {
    return this.threads.get(key)?.byPos.get(pos);
  }
  typing(key: string): string {
    return this.threads.get(key)?.typing ?? "";
  }
  pending(key: string): readonly Pending[] {
    return this.threads.get(key)?.pending ?? EMPTY;
  }

  // ---- the core's events

  /** Applies one raw event from the core; false when it isn't one the store knows. */
  apply(raw: unknown): boolean {
    const sent = sentOf(raw);
    if (sent !== null) return this.sendAnswered(sent);
    const ev = typed(raw);
    if (ev === null) return false;
    this.applyTyped(ev);
    for (const fn of [...this.evListeners]) fn(ev);
    return true;
  }

  private applyTyped(ev: Ev): void {
    applyTyped(this, ev);
  }

  /** The core went up or down: down fails every send still on its way ('not sent · retry'). */
  setCore(state: CoreState): void {
    if (state === this.coreState) return;
    this.coreState = state;
    this.emit("core");
    // a new core knows nothing of the window: what it shows is said again
    if (state === "up") this.sayAgain();
    if (state !== "down") return;
    this.commandsAsked = false;
    for (const a of this.asked.values()) a.resolve(null);
    this.asked.clear();
    for (const [key, t] of this.threads) {
      if (!t.pending.some((p) => p.state === "sending")) continue;
      t.pending = t.pending.map((p) =>
        p.state === "sending" ? { ...p, state: "failed", why: "not sent" } : p,
      );
      this.emit(`pending:${key}`);
    }
  }

  /**
   * A (re)started core knows nothing of this window (qa-native m_9736): what it
   * shows, then every thread it follows, are said again (their pages come back
   * and merge: an entry already held is replaced only if it changed).
   */
  private sayAgain(): void {
    if (this.shownSet !== null)
      this.command({ cmd: "shown", projects: [...this.shownSet] });
    if (this.slices.has("commands") || this.commandsAsked) {
      this.commandsAsked = false;
      this.askCommands();
    }
    for (const s of this.subs.values()) {
      this.command({
        cmd: "subscribe",
        project: s.project,
        agent: s.agent,
        ...(s.limit === undefined ? {} : { limit: s.limit }),
      });
    }
  }

  /** @internal for apply.ts */ thread(key: string): Thread {
    let t = this.threads.get(key);
    if (t === undefined) {
      t = { view: EMPTY_ORDER, byPos: new Map(), typing: "", pending: EMPTY };
      this.threads.set(key, t);
    }
    return t;
  }

  private setOrder(
    key: string,
    t: Thread,
    order: readonly number[],
    before: number | null,
    more: boolean,
  ): void {
    const v = t.view;
    if (
      v.loaded &&
      v.before === before &&
      v.more === more &&
      sameOrder(v.order, order)
    )
      return;
    t.view = { order, before, more, loaded: true };
    this.emit(`order:${key}`);
  }

  /** @internal for apply.ts */ page(ev: EvOf<"thread">): void {
    const key = threadKey(ev.project, ev.agent);
    const t = this.thread(key);
    for (const e of ev.entries) this.putEntry(key, t, e);
    // his message can come back in a page, not as an entry event: a thread he opened after
    // sending (from the bar, the spotlight), or the page a reconnection sends. Its pending row
    // goes the same way (ambient-lead m_20138: it stayed 'sending…' after main answered)
    if (t.pending.length > 0)
      for (const e of ev.entries) if (e.kind === "you") this.landed(key, t, e);
    const all = new Set(t.view.order);
    for (const e of ev.entries) all.add(e.pos);
    const order = [...all].sort((a, b) => a - b);
    // a page of older entries keeps the newer ones; its before/more are the oldest page's
    const oldest =
      ev.entries.length === 0 ||
      (t.view.order.length > 0 &&
        (ev.entries[0]?.pos ?? 0) < (t.view.order[0] ?? 0));
    const fresh = !t.view.loaded;
    const before = fresh || oldest ? ev.before : t.view.before;
    const more = fresh || oldest ? ev.more : t.view.more;
    this.setOrder(key, t, order, before, more);
  }

  /** @internal for apply.ts */ entryEv(ev: EvOf<"entry">): void {
    const key = threadKey(ev.project, ev.agent);
    const t = this.thread(key);
    const known = t.byPos.has(ev.entry.pos);
    this.putEntry(key, t, ev.entry);
    if (!known) {
      const order = [...t.view.order, ev.entry.pos].sort((a, b) => a - b);
      this.setOrder(key, t, order, t.view.before, t.view.more);
    }
    if (ev.entry.kind === "you") this.landed(key, t, ev.entry);
  }

  private putEntry(key: string, t: Thread, e: Entry): void {
    const old = t.byPos.get(e.pos);
    if (old !== undefined && sameJson(old, e)) return;
    t.byPos.set(e.pos, e);
    this.emit(`entry:${key}:${String(e.pos)}`);
    // a steer's receipt came (amb-feed 9633cd2a: the entry is re-sent with steered_at): the rows
    // move (the window shows it where the agent read it), so the order's readers recompute
    if (
      old !== undefined &&
      t.view.loaded &&
      (old.steered_at ?? null) !== (e.steered_at ?? null)
    ) {
      t.view = { ...t.view };
      this.emit(`order:${key}`);
    }
  }

  /** His message landed: its pending send goes, by its id (A1, echo.ts); no row: its id is kept. */
  private landed(key: string, t: Thread, e: Entry): void {
    const i = echoOf(t.pending, e, ECHO_SLACK_MS);
    if (i < 0) t.landedIds = keepLanded(t.landedIds, e.msg_id);
    if (i < 0) return;
    t.pending = t.pending.filter((_, j) => j !== i);
    this.emit(`pending:${key}`);
  }

  /** A1: the window-local 'sent' (main's ipc.ts): the send `cid` has its message id. Always a known event. */
  private sendAnswered(s: Sent): true {
    const key = threadKey(s.project, s.agent);
    const t = this.threads.get(key);
    const next = t && answered(t.pending, s, new Set(t.landedIds));
    if (t === undefined || next == null) return true;
    t.pending = next;
    this.emit(`pending:${key}`);
    return true;
  }

  /**
   * G: the send `cid` failed. refused: nothing reached the thread, his row
   * shows 'not delivered' with retry. undelivered: the hub wrote its
   * undelivered entry in the thread, which stands in for his row (gone).
   */
  /** @internal for apply.ts */ failCid(
    cid: number,
    reason: string,
    why: string,
  ): void {
    for (const [key, t] of this.threads) {
      if (!t.pending.some((p) => p.cid === cid)) continue;
      t.pending =
        reason === "undelivered"
          ? t.pending.filter((p) => p.cid !== cid)
          : t.pending.map((p) =>
              p.cid === cid ? { ...p, state: "failed", why } : p,
            );
      this.emit(`pending:${key}`);
      return;
    }
  }

  /** @internal for apply.ts */ failOldest(
    project: string | null,
    why: string,
  ): void {
    let oldest: { key: string; t: Thread; p: Pending } | null = null;
    for (const [key, t] of this.threads) {
      for (const p of t.pending) {
        if (
          p.state !== "sending" ||
          (project !== null && p.project !== project)
        )
          continue;
        if (oldest === null || p.cid < oldest.p.cid) oldest = { key, t, p };
      }
    }
    if (oldest === null) return;
    const { key, t, p } = oldest;
    t.pending = t.pending.map((x) =>
      x.cid === p.cid ? { ...x, state: "failed", why } : x,
    );
    this.emit(`pending:${key}`);
  }

  // ---- actions (typed commands to the core)

  command(cmd: CoreCmd): void {
    // a new talk starts with nothing heard and no still
    if (cmd.cmd === "talk_start" && this.slices.get("heard") != null)
      this.put("heard", null);
    if (cmd.cmd === "talk_start" && this.slices.get("shot") != null)
      this.put("shot", null);
    if (cmd.cmd === "slash" && cmd.line.trim().startsWith("/model "))
      this.modelSentAt = this.now();
    this.port?.send(cmd);
  }

  /**
   * The composer's mic (bar I): the core records and sends this window the
   * words (useDictation(id)); never to main. Returns the dictation's id.
   */
  /** R8: this window sent a /model in the last `ms` (then forgets it: one setup_first per send). */
  takeModelSent(ms: number): boolean {
    const mine = this.now() - this.modelSentAt <= ms;
    this.modelSentAt = Number.NEGATIVE_INFINITY;
    return mine;
  }

  /** Each role's model and effort (V17; set with command({cmd: 'role_set', role, model?, effort?})). */
  roles(): readonly RoleRow[] {
    return this.slice("roles", EMPTY);
  }
  /** The `/` list (the TUI's commands.rs), asked once from each core. */
  commands(): readonly PickCommand[] {
    return this.slice("commands", EMPTY);
  }
  askCommands(): void {
    if (this.commandsAsked) return;
    this.commandsAsked = true;
    this.command({ cmd: "commands" });
  }
  /** A workspace's `$` list (the TUI's skills.rs); askSkills reads it again. */
  skills(project: string): readonly PickSkill[] {
    return this.slice(`skills:${project}`, EMPTY);
  }
  askSkills(project: string): void {
    this.command({ cmd: "skills", project });
  }
  /**
   * An `@` query's rows, ranked by the core (the TUI's files.rs). Resolves
   * with the first answer (partial while the first walk runs: the fuller one
   * then lands in useFiles(project)), or null when a newer query of the
   * project replaced it or the core went down.
   */
  files(
    project: string,
    q: string,
    limit?: number,
  ): Promise<FilesAnswer | null> {
    return this.askFiles(project, q, limit);
  }
  /** R14: he took `path` (as `files` answered it; a file, never a folder he browsed) from `project`'s @ list: it ranks first in that list's next answers. */
  filePicked(project: string, path: string): void {
    this.command({ cmd: "file_picked", project, path });
  }
  /** R8: the last /model the core holds until its provider works (amb-home's setup opens on it), or null. */
  setupFirst(): EvOf<"setup_first"> | null {
    return this.slice<EvOf<"setup_first"> | null>("setup_first", null);
  }
  /** Why this core can start no hub (CoreEv broken: its runtime is missing); null: it can. */
  broken(): string | null {
    return this.slice<string | null>("broken", null);
  }

  /** N1: where his keys and sign-ins are (the core's keychain event); none yet: null */
  keychain(): EvOf<"keychain"> | null {
    return this.slice<EvOf<"keychain"> | null>("keychain", null);
  }
  private askFiles(
    project: string,
    q: string,
    limit?: number,
  ): Promise<FilesAnswer | null> {
    this.rid += 1;
    const rid = this.rid;
    for (const [r, a] of this.asked) {
      if (a.project !== project) continue;
      this.asked.delete(r);
      a.resolve(null);
    }
    this.newestRid.set(project, rid);
    return new Promise((resolve) => {
      this.asked.set(rid, { project, resolve });
      this.command({
        cmd: "files",
        project,
        q,
        rid,
        ...(limit === undefined ? {} : { limit }),
      });
    });
  }
  /** The newest `@` answer of a project (a partial one, then the full one). */
  filesNow(project: string): FilesAnswer | null {
    return this.slice<FilesAnswer | null>(`files:${project}`, null);
  }

  /** @internal for apply.ts */ filesAnswer(ev: EvOf<"files">): void {
    // an older query's late answer never replaces a newer one's
    if (ev.rid !== this.newestRid.get(ev.project)) return;
    const a: FilesAnswer = {
      q: ev.q,
      items: ev.items,
      folder: ev.folder ?? null,
      partial: ev.partial ?? false,
    };
    this.put(`files:${ev.project}`, a);
    const asked = this.asked.get(ev.rid);
    if (asked === undefined) return;
    this.asked.delete(ev.rid);
    asked.resolve(a);
  }

  /**
   * Voice mode with the agent in view (the TUI's ctrl+r twice): the core's
   * mic and speaker, his turns to that agent, its answers said aloud. Another
   * agent while on: it follows him there; off: it ends (useVoiceMode's last
   * state has on: false and the note).
   */
  voiceMode(project: string, agent: string, on: boolean): void {
    this.command({ cmd: "voice_mode", project, agent, on });
  }
  /** His mic off (m) or on again; the agent still speaks. */
  voiceMute(on: boolean): void {
    this.command({ cmd: "voice_mute", on });
  }
  /** He types (tab): the mic waits; his normal send to that agent gets its answer said. */
  voiceType(on: boolean): void {
    this.command({ cmd: "voice_type", on });
  }
  /** What he said goes now (the TUI's space tap). */
  voiceSend(): void {
    this.command({ cmd: "voice_send" });
  }
  /** Cut the agent off: its voice stops, its running turn is stopped. */
  voiceCut(): void {
    this.command({ cmd: "voice_cut" });
  }
  /**
   * ⌘K's index (core/index.rs): every project the core doesn't hold now,
   * from its view.json (agents, the newest artifacts and their total), as of
   * written_ms, with up (its hub runs). askIndex() once; it comes again on
   * change, at most every 5 s.
   */
  index(): readonly IndexRow[] {
    return this.slice("index", EMPTY);
  }
  askIndex(): void {
    this.command({ cmd: "index" });
  }
  /** Why a project's hub refused this core (its words), or null. */
  hubRefused(project: string): string | null {
    return this.slice<string | null>(`hub_refused:${project}`, null);
  }
  /** Try a refused project's hub again (his click): the core connects once more. */
  hubRetry(project: string): void {
    this.command({ cmd: "hub_retry", project });
  }
  voiceModeNow(): VoiceModeState | null {
    return this.slice<VoiceModeState | null>("voice_mode", null);
  }

  dictateStart(): string {
    this.cid += 1;
    const id = `d${String(this.cid)}-${String(this.now())}`;
    this.dictating.add(id);
    this.put(`dictation:${id}`, {
      text: "",
      final: false,
      cancelled: false,
      error: null,
    } satisfies Dictation);
    this.command({ cmd: "dictate_start", id });
    return id;
  }
  /**
   * The mic off; the final words come in one last `dictation`. A core that never answers (its mic
   * stuck opening, the start lost) never leaves 'listening…' up: after DICTATE_STOP_WAIT_MS the
   * dictation ends here with the words it has and a note (amb-tools' run on the cut, m_20100).
   */
  dictateStop(id: string): void {
    if (!this.dictating.has(id)) return;
    this.command({ cmd: "dictate_stop", id });
    setTimeout(() => {
      if (!this.dictating.has(id)) return;
      this.dictating.delete(id);
      this.put(`dictation:${id}`, {
        text: this.dictation(id)?.text ?? "",
        final: true,
        cancelled: false,
        error: "the mic didn't answer.",
      } satisfies Dictation);
    }, DICTATE_STOP_WAIT_MS);
  }
  /** esc: the dictation is over at once, here; the core is told, its late answer is ignored
   *  (a core that never answers leaves nothing up). */
  dictateCancel(id: string): void {
    if (!this.dictating.has(id)) return;
    this.command({ cmd: "dictate_cancel", id });
    this.dictating.delete(id);
    this.put(`dictation:${id}`, {
      text: "",
      final: true,
      cancelled: true,
      error: null,
    } satisfies Dictation);
  }
  /** fn's talk: what bise heard so far (the whole text; final once the talk ended), null before a talk. */
  heard(): { readonly text: string; readonly final: boolean } | null {
    return this.slice<{
      readonly text: string;
      readonly final: boolean;
    } | null>("heard", null);
  }
  /** fn's talk: the still of his front window it will send (its stored file), null: none or gone. */
  shot(): TalkShot | null {
    return this.slice<TalkShot | null>("shot", null);
  }
  /** A voice's loudness now, 0..1: 'you' (the mic), 'main' (its spoken answer). */
  level(who: string): number {
    return this.slice(`level:${who}`, 0);
  }
  dictation(id: string): Dictation | null {
    return this.slice<Dictation | null>(`dictation:${id}`, null);
  }

  /**
   * His words to an agent: shown at once as pending, then sent. Returns its cid.
   * files: absolute paths he attached; the hub renders them once after his
   * words (an image as one the model sees, any other file by its path).
   */
  send(a: {
    project: string;
    agent: string;
    text: string;
    mode?: Mode;
    files?: readonly string[];
    parts?: readonly Part[];
  }): number {
    const key = threadKey(a.project, a.agent);
    const t = this.thread(key);
    this.cid += 1;
    const mode = a.mode ?? "now";
    const files =
      a.files !== undefined && a.files.length > 0 ? [...a.files] : undefined;
    // msg-parts: his message typed (quotes, words, pastes); the hub renders the model's text from them
    const parts =
      a.parts !== undefined && a.parts.length > 0 ? [...a.parts] : undefined;
    const p: Pending = {
      cid: this.cid,
      project: a.project,
      agent: a.agent,
      text: a.text,
      mode,
      ...(files === undefined ? {} : { files }),
      ...(parts === undefined ? {} : { parts }),
      at_ms: this.now(),
      state: "sending",
    };
    t.pending = [...t.pending, p];
    this.emit(`pending:${key}`);
    if (this.coreState === "down") {
      this.failOldest(a.project, "not sent");
      return p.cid;
    }
    // G: the cid goes along; the core or the hub echoes it on this send's error
    this.command({
      cmd: "send",
      project: a.project,
      agent: a.agent,
      text: a.text,
      mode,
      ...(files === undefined ? {} : { files }),
      ...(parts === undefined ? {} : { parts }),
      cid: p.cid,
    });
    return p.cid;
  }

  /** A failed send goes again (same words, same mode), as a new pending row. */
  retry(key: string, cid: number): void {
    const t = this.threads.get(key);
    const p = t?.pending.find((x) => x.cid === cid && x.state === "failed");
    if (t === undefined || p === undefined) return;
    t.pending = t.pending.filter((x) => x.cid !== cid);
    this.emit(`pending:${key}`);
    this.send({
      project: p.project,
      agent: p.agent,
      text: p.text,
      mode: p.mode,
      ...(p.files === undefined ? {} : { files: p.files }),
      ...(p.parts === undefined ? {} : { parts: p.parts }),
    });
  }

  /** Drops a failed send (he gave up on it). */
  dismiss(key: string, cid: number): void {
    const t = this.threads.get(key);
    if (t === undefined || !t.pending.some((x) => x.cid === cid)) return;
    t.pending = t.pending.filter((x) => x.cid !== cid);
    this.emit(`pending:${key}`);
  }

  /**
   * The projects the window shows now (on load and each route change, amb-win
   * m_9717): the core holds their hubs and sends their rows, agents and cards
   * only after the first one. Sent only when the set changed.
   */
  shown(projects: readonly string[]): void {
    const set = [...new Set(projects)];
    if (this.shownSet !== null && sameStrings(this.shownSet, set)) return;
    this.shownSet = set;
    this.command({ cmd: "shown", projects: set });
  }

  /** A thread's newest page then its live entries; kept, and asked again of a core that comes back up. */
  subscribeThread(project: string, agent: string, limit?: number): void {
    this.subs.set(threadKey(project, agent), { project, agent, limit });
    this.command({
      cmd: "subscribe",
      project,
      agent,
      ...(limit === undefined ? {} : { limit }),
    });
  }
  unsubscribeThread(project: string, agent: string): void {
    this.subs.delete(threadKey(project, agent));
    this.command({ cmd: "unsubscribe", project, agent });
  }
  /** The page before the oldest entry held (nothing when there is no more). */
  olderPage(project: string, agent: string, limit?: number): void {
    const v = this.threadOrder(threadKey(project, agent));
    if (!v.more || v.before === null) return;
    this.command({
      cmd: "page",
      project,
      agent,
      before: v.before,
      ...(limit === undefined ? {} : { limit }),
    });
  }
  /** His answer to card `card`: its words, and the images he pasted or dropped (R41: absolute paths, as a send's files). */
  answer(
    project: string,
    card: number,
    reply: string,
    files?: readonly string[],
    parts?: readonly Part[],
  ): void {
    this.command({
      cmd: "answer",
      project,
      card,
      reply,
      ...(files !== undefined && files.length > 0 ? { files: [...files] } : {}),
      ...(parts !== undefined && parts.length > 0 ? { parts: [...parts] } : {}),
    });
  }
  /** His answer to the hub's yes/no question (a no's line comes back as a notice). */
  confirm(project: string, id: number, yes: boolean): void {
    this.dropConfirm(project, id);
    this.command({ cmd: "confirm", project, id, yes });
  }
  /** Put off (esc): the question leaves the window; the hub holds nothing for it, a later command asks again. */
  putOff(project: string, id: number): void {
    this.dropConfirm(project, id);
  }
  private dropConfirm(project: string, id: number): void {
    const now = this.confirms(project);
    if (now.some((c) => c.id === id))
      this.put(
        `confirms:${project}`,
        now.filter((c) => c.id !== id),
      );
  }
  /** Close a card without answering it (the TUI's /close N). */
  close(project: string, card: number): void {
    this.command({ cmd: "close", project, card });
  }
  stop(project: string, agent: string): void {
    this.command({ cmd: "stop", project, agent });
  }
}

// the store's shapes and helpers live in types.ts; importers keep reading them here
export {
  TAGS,
  diffKey,
  sentParts,
  sentWords,
  takeKey,
  threadKey,
  toolOutKey,
  typed,
} from "./types";
export type {
  Away,
  AwayProject,
  BranchesList,
  Confirm,
  Dictation,
  Diff,
  Ev,
  EvOf,
  FilesAnswer,
  HubLine,
  PagesList,
  Pending,
  PrsList,
  QueuedTake,
  TalkShot,
  ThreadOrder,
  ToolOut,
  VersionsList,
  VoiceModeState,
} from "./types";
