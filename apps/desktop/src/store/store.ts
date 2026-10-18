// The one store of bise desktop: fed by the core's typed events (bise-proto's
// HubEv | CoreEv, src/proto), read by React through hooks.ts. Pure: no React,
// no Electron; the core is a CorePort (window.bise.core, or a fake in tests).
//
// The rule it keeps (amb-win m_9478): a change re-renders only who reads it.
// Every slice has its own key and listeners; an object a slice gives out is
// replaced only when that slice changed, so useSyncExternalStore sees the
// same reference otherwise. A thread is a key `${project}/${agent}`: its
// order (positions), its entries by position (a `thread` page merges, an
// `entry` replaces only that entry), typing, and his pending sends. Its order
// may hold one detached window around a far entry (jumpTo / newerPage, the gap
// to the tail: window.ts).
//
// The store is becoming a pure state machine slice by slice (fast-try p4,
// machine/): a slice is step(state, facts, input) -> [state, outputs], and
// this class is its shell: it holds the state, stamps the clock, runs the
// outputs at one edge (stepIn: a kept list is put, told and written, a command
// goes to the core) and tells the listeners. HubFacts (machine/types.ts) holds
// the hubs' projects rows once, read by every slice. Moved so far: the cards
// slice (machine/cards.ts: his answers and closes in flight and how they
// settle); his gestures on it come in as store.do(intent).
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
  Entry,
  Mode,
  Part,
} from "@/proto";
import { cardRefusedOf, type Acted } from "./acted";
import type { Refused } from "./refused";
import { cardsInit, inboxView, stepCards, type AnswerJump, type CardsState } from "./machine/cards";
import type { InboxItem } from "@/inbox/listed";
import { factsOf, type Effect, type Input, type Intent, type Output, type WinEv } from "./machine/types";
import type { CoreState } from "@/shared/api";
import { common } from "@/proto/words.gen";
import {
  type Ev,
  type EvOf,
  type FilesAnswer,
  type HubLine,
  type Pending,
  type ThreadOrder,
  sameJson,
  sameOrder,
  sameStrings,
  threadKey,
  EMPTY_ORDER,
  typed,
} from "./types";
import { applyTyped } from "./apply";
import { answers, listsLive, merged, planJump, planNewer } from "./window";
import { trim } from "./trim";
import { answered, echoOf, keepLanded, sentOf, type Sent } from "./echo";
import { EMPTY, type Thread } from "./base";
import { cardAnsweredOf, cardKeyOf, type AnsweredFrom } from "./answered";
import { StoreVoice } from "./voice";

export { DICTATE_STOP_WAIT_MS } from "./voice";
export type { StoreOptions } from "./base";

export type { AnswerJump } from "./machine/cards";

export class Store extends StoreVoice {
  /** the cards slice (machine/cards.ts): his answers and closes in flight, how they settled; his kept lists read back */
  private cardsState: CardsState = cardsInit(this.asideKeep === null ? null : (k) => this.asideKeep?.read(k));
  /** the inbox's view as last read, and what it was made of (inboxItems()) */
  private inboxMemo: { rows: unknown; acted: unknown; refused: unknown; items: readonly InboxItem[] } | null = null;
  /** the app's edge for the machine's effects (onEffect) */
  private readonly effects = new Set<(e: Effect) => void>();

  // ---- the core's events

  /** Applies one raw event from the core; false when it isn't one the store knows. */
  apply(raw: unknown): boolean {
    const sent = sentOf(raw);
    if (sent !== null) return this.sendAnswered(sent);
    // main's window-local answers to this window's own card requests (machine/types.ts WinEv)
    const done = cardAnsweredOf(raw);
    if (done !== null) return this.settled({ ev: "card_answered", ...done });
    const refused = cardRefusedOf(raw);
    if (refused !== null) return this.settled({ ev: "card_refused", ...refused });
    const ev = typed(raw);
    if (ev === null) return false;
    this.applyTyped(ev);
    for (const fn of [...this.evListeners]) fn(ev);
    return true;
  }

  private settled(ev: WinEv): true {
    this.stepIn({ at_ms: this.now(), in: "win", ev });
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
      // not answered yet: it may have reached the hub by now (lostAt: echo.ts takes it by its words)
      const now = this.now();
      t.pending = t.pending.map((p) =>
        p.state !== "sending"
          ? p
          : { ...p, state: "failed", why: common.not_sent, ...(typeof p.msgId === "number" ? {} : { lostAt: now }) },
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
      // a window's page asked of the old core never comes
      delete this.thread(threadKey(s.project, s.agent)).ask;
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

  /** @internal for apply.ts */ page(ev: EvOf<"thread">): void {
    const key = threadKey(ev.project, ev.agent);
    const t = this.thread(key);
    for (const e of ev.entries) this.putEntry(key, t, e);
    // his message can come back in a page, not as an entry event: a thread he opened after
    // sending (from the bar, the spotlight), or the page a reconnection sends. Its pending row
    // goes the same way (ambient-lead m_20138: it stayed 'sending…' after main answered)
    if (t.pending.length > 0)
      for (const e of ev.entries) if (e.kind === "you") this.landed(key, t, e);
    // a page of older entries keeps the newer ones; its before/more are the oldest page's; the
    // window's page (a jump's, a newer one's) moves the gap (window.ts)
    const pos = ev.entries.map((e) => e.pos);
    const ask = t.ask !== undefined && answers(t.ask, t.view, pos) ? t.ask : null;
    if (ask !== null) delete t.ask;
    this.setView(key, t, merged(t.view, pos, ev.before, ev.more, ask));
  }

  private setView(key: string, t: Thread, v: ThreadOrder): void {
    const o = t.view;
    const g = (x: ThreadOrder) => (x.gap === undefined ? "" : `${String(x.gap.lo)}/${String(x.gap.hi)}/${String(x.gap.from)}`);
    if (o.loaded && o.before === v.before && o.more === v.more && g(o) === g(v) && sameOrder(o.order, v.order)) return;
    t.view = v;
    this.emit(`order:${key}`);
  }

  /** @internal for apply.ts */ entryEv(ev: EvOf<"entry">): void {
    const key = threadKey(ev.project, ev.agent);
    const t = this.thread(key);
    const known = t.byPos.has(ev.entry.pos);
    this.putEntry(key, t, ev.entry);
    // a live entry lands in the tail; one that falls in the window's gap waits for its page
    if (!known && listsLive(t.view, ev.entry.pos)) {
      const order = [...t.view.order, ev.entry.pos].sort((a, b) => a - b);
      this.setView(key, t, { ...t.view, order, loaded: true });
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
    const i = echoOf(t.pending, e);
    // no row, or a lost row taken by its words: the id is kept, so a send answered with it
    // later leaves at once (review-refactor m_30778)
    if (i < 0 || t.pending[i]?.msgId !== e.msg_id) t.landedIds = keepLanded(t.landedIds, e.msg_id);
    if (i < 0) return;
    t.pending = t.pending.filter((_, j) => j !== i);
    this.emit(`pending:${key}`);
  }

  /**
   * One input through the cards slice (machine/cards.ts), then its outputs at the edge, in order:
   * a kept list is put (its listeners told) and written to his asides, a command goes to the core;
   * a window move or a window.bise call goes to the app's edge (onEffect, app/edge.ts); a new jump
   * is told last, then the inbox's view when its rows, acted or refused changed.
   */
  private stepIn(input: Input, rowsCame = false): readonly Output[] {
    const was = this.cardsState;
    const [next, outs] = stepCards(was, this.facts, input);
    this.cardsState = next;
    for (const o of outs) {
      switch (o.out) {
        case "cmd":
          this.command(o.cmd);
          break;
        case "keep":
          this.emit(o.key);
          this.asideKeep?.write(o.key, o.value);
          break;
        case "nav":
        case "fx":
          for (const fn of [...this.effects]) fn(o);
          break;
      }
    }
    if (next.jump !== was.jump) this.emit("answer_jump");
    if (rowsCame || next.acted !== was.acted || next.refused !== was.refused) this.emit("inbox_items");
    return outs;
  }
  /** The app's edge (app/edge.ts) runs the machine's window moves and window.bise calls; a test records them. */
  onEffect(fn: (e: Effect) => void): () => void {
    this.effects.add(fn);
    return () => {
      this.effects.delete(fn);
    };
  }
  /** The inbox's one view (machine/cards.ts inboxView); the same array until its rows, acted or refused change. */
  inboxItems(): readonly InboxItem[] {
    const s = this.cardsState;
    const m = this.inboxMemo;
    if (m !== null && m.rows === this.facts.rows && m.acted === s.acted && m.refused === s.refused) return m.items;
    const items = inboxView(s, this.facts);
    this.inboxMemo = { rows: this.facts.rows, acted: s.acted, refused: s.refused, items };
    return items;
  }
  /** His gesture (machine/types.ts Intent), through the machine. */
  do(intent: Intent): { readonly answered: boolean } {
    const outs = this.stepIn({ at_ms: this.now(), in: "do", intent });
    // what it did, from its outputs: a view folds the card only when his answer went (architect m_29867)
    return { answered: outs.some((o) => o.out === "cmd" && o.cmd.cmd === "answer") };
  }
  /**
   * The cards he answered or closed in this window that the hub's rows still list (acted.ts):
   * every view leaves them out. Kept across a reload, as his asides.
   */
  acted(): readonly Acted[] {
    return this.cardsState.acted;
  }
  /**
   * A page's item kept open across the views (notif-artifact, designer m_26776): the inbox block that
   * opens the page beside, or unmounts with that item open, sets it; the block that mounts reads it
   * and clears it once its list holds the item. A view slice: the window's own, never the hub's.
   */
  keepOpen(at: { readonly project: string; readonly card: number } | undefined): void {
    this.slices.set("reopen", at);
  }
  keptOpen(): { readonly project: string; readonly card: number } | undefined {
    return this.slice<{ readonly project: string; readonly card: number } | undefined>("reopen", undefined);
  }
  /** @internal for apply.ts: an event the hubs' facts keep (machine/types.ts factsOf); its slice key told */
  factsCame(ev: Ev, key: string): void {
    this.facts = factsOf(this.facts, ev);
    this.emit(key);
  }
  /** @internal for apply.ts: a projects event: the hub's rows, then the cards its rows no longer list leave the set */
  rowsCame(ev: EvOf<"projects">): void {
    this.facts = factsOf(this.facts, ev);
    this.emit("projects");
    this.stepIn({ at_ms: this.now(), in: "ev", ev }, true);
  }
  /**
   * The cards whose answer or close was refused in this window (refused.ts): each view that draws
   * the card says 'not sent: <words> · try again' on it. Kept across a reload, as his asides.
   */
  refused(): readonly Refused[] {
    return this.cardsState.refused;
  }

  /** Where he made each answer this window sent (window-local, oldest first; kept across a reload). */
  answersFrom(): readonly AnsweredFrom[] {
    return this.cardsState.answersFrom;
  }
  /** Where he made his answer to card `card` of `project`, when this window sent it. */
  answeredFrom(project: string, card: number): AnsweredFrom | null {
    const k = cardKeyOf(project, card);
    return this.answersFrom().find((a) => a.key === k) ?? null;
  }
  /** The newest jump to an answer the hub took (answer-in-thread A); null before any. */
  answerJump(): AnswerJump | null {
    return this.cardsState.jump;
  }

  /** A message of his is on its way (a pending row still sending): the app's update waits for it (update/moment.ts). */
  sending(): boolean {
    for (const t of this.threads.values()) if (t.pending.some((p) => p.state === "sending")) return true;
    return false;
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
   * His words to an agent: shown at once as pending, then sent. Returns its cid.
   * His images and files go as parts (the hub stores each image once).
   */
  send(a: {
    project: string;
    agent: string;
    text: string;
    mode?: Mode;
    parts?: readonly Part[];
  }): number {
    const key = threadKey(a.project, a.agent);
    const t = this.thread(key);
    this.cid += 1;
    const mode = a.mode ?? "now";
    // msg-parts: his message typed (quotes, words, pastes); the hub renders the model's text from them
    const parts =
      a.parts !== undefined && a.parts.length > 0 ? [...a.parts] : undefined;
    const p: Pending = {
      cid: this.cid,
      project: a.project,
      agent: a.agent,
      text: a.text,
      mode,
      ...(parts === undefined ? {} : { parts }),
      at_ms: this.now(),
      state: "sending",
    };
    t.pending = [...t.pending, p];
    this.emit(`pending:${key}`);
    if (this.coreState === "down") {
      this.failOldest(a.project, common.not_sent);
      return p.cid;
    }
    // G: the cid goes along (echoed on its error); with parts, no text: the hub renders it (m_22248)
    this.command({
      cmd: "send",
      project: a.project,
      agent: a.agent,
      text: parts === undefined ? a.text : "",
      mode,
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
  /**
   * Bring the entry at `pos` into the view (his answer weeks back, a find's hit): 'held' with the
   * row's pos when the view has it; 'asked' when its page is on its way (the view's window, with a
   * gap row to the tail, window.ts); 'wait' while the thread isn't loaded. Again with the page
   * there: 'held'. One window page on its way at a time: while one is (the window's newer page,
   * another jump's), 'asked' and nothing sent; ask again when the view changes. Replaced before
   * its answer, that page would land in the tail without its gap (find-walk-red: ⌘F's ⏎ while the
   * gap row paged newer, the list jumped to rows no match was in).
   */
  jumpTo(project: string, agent: string, pos: number): { kind: "held"; pos: number } | { kind: "asked" | "wait" } {
    const key = threadKey(project, agent);
    const t = this.thread(key);
    const plan = planJump(t.view, pos);
    if (plan.kind !== "ask") return plan;
    if (t.ask !== undefined) return { kind: "asked" };
    t.ask = plan.ask;
    this.setView(key, t, plan.view);
    this.command({ cmd: "page", project, agent, before: plan.ask.before, limit: plan.limit });
    return { kind: "asked" };
  }
  /** The window's next newer page, toward the tail (its gap row came into view); one at a time. */
  newerPage(project: string, agent: string): void {
    const t = this.thread(threadKey(project, agent));
    if (t.ask !== undefined) return;
    const plan = planNewer(t.view);
    if (plan === null) return;
    t.ask = plan.ask;
    this.command({ cmd: "page", project, agent, before: plan.ask.before, limit: plan.limit });
  }
  /**
   * He reads the entry at `pos` (the list's row under its top edge, as he scrolls): the entries far
   * from it leave the view and the store (trim.ts), the hub pages them back when he scrolls there.
   * Not while a window page is asked.
   */
  reading(project: string, agent: string, pos: number): void {
    const key = threadKey(project, agent);
    const t = this.threads.get(key);
    if (t === undefined || t.ask !== undefined) return;
    const { view, dropped } = trim(t.view, pos);
    if (dropped.length === 0) return;
    for (const p of dropped) t.byPos.delete(p);
    this.setView(key, t, view);
  }
  /**
   * ⌘F over a whole thread (`thread/find`, thread-perf): the hub searches its transcript and its
   * `thread_hits` comes back as the thread's `hits:` slice (useThreadHits). Its rid: an answer for
   * an older one is stale. A hub without the method refuses it: the slice says so (hits null).
   */
  findInThread(project: string, agent: string, needle: string): number {
    this.rid += 1;
    const rid = this.rid;
    this.finding.set(project, { key: threadKey(project, agent), rid });
    this.command({ cmd: "find", project, agent, needle, rid });
    return rid;
  }
  /** His answer to the hub's yes/no question (a no's line comes back as a notice). */
  confirm(project: string, id: number, yes: boolean): void {
    this.dropConfirm(project, id);
    this.command({ cmd: "confirm", project, id, yes });
  }
  /** The hub's line he saw on the key line is over (he typed, sent, esc, its time): it goes, unless a newer one came. */
  dropNotice(project: string, line: HubLine): void {
    if (this.notice(project) === line) this.put(`notice:${project}`, null);
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
  stop(project: string, agent: string): void {
    this.command({ cmd: "stop", project, agent });
  }
  /**
   * A file he gives an agent (a drop on its thread, the artifacts list's '+ add' or drop): the
   * hub's do: add (the TUI's /artifacts add) makes it an artifact of `agent`, by you; the window
   * never writes the store. The hub's words come back as a notice, the row in `artifacts`.
   */
  addArtifact(project: string, agent: string, path: string): void {
    this.command({ cmd: "artifacts_add", project, agent, target: path });
  }
}

// the store's shapes and helpers live in types.ts; importers keep reading them here
export {
  TAGS,
  diffKey,
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
  InboxList,
  QueuedTake,
  TalkShot,
  ThreadHits,
  ThreadOrder,
  ToolOut,
  VersionsList,
  VoiceModeState,
} from "./types";
