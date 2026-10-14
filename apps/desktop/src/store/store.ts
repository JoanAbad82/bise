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
  Entry,
  Mode,
  Part,
  ProjectRow,
} from "@/proto";
import { actedAdd, actedKey, actedKeys, actedOf, actedPrune, cardClosedOf, type Acted } from "./acted";
import type { CoreState } from "@/shared/api";
import {
  type Ev,
  type EvOf,
  type FilesAnswer,
  type Pending,
  sameJson,
  sameOrder,
  sameStrings,
  threadKey,
  EMPTY_ORDER,
  typed,
} from "./types";
import { applyTyped } from "./apply";
import { answered, echoOf, keepLanded, sentOf, ECHO_SLACK_MS, type Sent } from "./echo";
import { EMPTY, type Thread } from "./base";
import { asideOf, asidesOf, cardAnsweredOf, keptAsides, type AnswerFrom, type Aside, type CardAnswered } from "./asides";
import { StoreVoice } from "./voice";

export { DICTATE_STOP_WAIT_MS } from "./voice";
export type { StoreOptions } from "./base";

export class Store extends StoreVoice {
  /** inbox picks (3): where he was for each card he answered, until its result comes */
  private readonly answering = new Map<string, AnswerFrom>();

  // ---- the core's events

  /** Applies one raw event from the core; false when it isn't one the store knows. */
  apply(raw: unknown): boolean {
    const sent = sentOf(raw);
    if (sent !== null) return this.sendAnswered(sent);
    const done = cardAnsweredOf(raw);
    if (done !== null) return this.cardAnswered(done);
    const closed = cardClosedOf(raw);
    if (closed !== null) return this.cardClosed(closed.project, closed.card);
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

  /**
   * Inbox picks (3): the window-local 'card_answered' (main's ipc.ts): his answer to a card this
   * window sent, as sb-core wrote it. Answered from a thread the hub writes no row in, it leaves
   * his row there (asides.ts). Always a known event.
   */
  private cardAnswered(d: CardAnswered): true {
    this.settle(d.project, d.card, "answer");
    const k = `${d.project}/${String(d.card)}`;
    const from = this.answering.get(k);
    this.answering.delete(k);
    if (from === undefined) return true;
    const got = asideOf(from, d.project, d.card, d.answer, this.now());
    if (got === null) return true;
    const tkey = threadKey(got.at.project, got.at.agent);
    const list = keptAsides([...this.asides(tkey).filter((a) => a.key !== got.aside.key), got.aside]);
    this.put(`asides:${tkey}`, list);
    this.asideKeep?.write(`asides:${tkey}`, list);
    return true;
  }
  /**
   * The cards he answered or closed in this window that the hub's rows still list (acted.ts):
   * every view leaves them out. Kept across a reload, as his asides.
   */
  acted(): readonly Acted[] {
    if (!this.slices.has("acted") && this.asideKeep !== null) this.slices.set("acted", actedOf(this.asideKeep.read("acted")));
    return this.slice<readonly Acted[]>("acted", EMPTY);
  }
  private putActed(list: readonly Acted[]): void {
    if (list === this.acted()) return;
    this.put("acted", list);
    this.asideKeep?.write("acted", list);
  }
  /** @internal for apply.ts: a projects event; the cards its rows no longer list leave the set */
  rowsCame(rows: readonly ProjectRow[]): void {
    this.putActed(actedPrune(this.acted(), rows));
    // an act whose card the rows dropped is settled: the hub took it
    const hidden = actedKeys(this.acted());
    for (const [project, list] of this.acting) this.acting.set(project, list.filter((a) => hidden.has(actedKey(project, a.card))));
  }
  /** His answers and closes on their way, per project, oldest first: the hub answers a connection in order. */
  private readonly acting = new Map<string, readonly { card: number; cmd: "answer" | "close" }[]>();
  /** He answered or closed it: out of every view, on its way until the hub's word. */
  private acts(project: string, card: number, cmd: "answer" | "close"): void {
    this.acting.set(project, [...(this.acting.get(project) ?? []), { card, cmd }]);
    this.putActed(actedAdd(this.acted(), project, card, this.now()));
  }
  private settle(project: string, card: number, cmd: "answer" | "close"): void {
    const list = this.acting.get(project) ?? [];
    const i = list.findIndex((a) => a.card === card && a.cmd === cmd);
    if (i >= 0) this.acting.set(project, list.filter((_, j) => j !== i));
  }
  /**
   * @internal for apply.ts: the hub refused his oldest answer (or close) still on its way in that
   * project (its error names the command, not the card; the hub answers a connection's commands
   * in order): that card is his again in every view, never hidden while it waits (architect m_23450).
   */
  cardRefused(project: string, cmd: "answer" | "close"): void {
    const list = this.acting.get(project) ?? [];
    const a = list.find((x) => x.cmd === cmd);
    if (a === undefined) return;
    this.settle(project, a.card, cmd);
    this.answering.delete(`${project}/${String(a.card)}`);
    this.putActed(this.acted().filter((x) => x.key !== actedKey(project, a.card)));
  }
  /** The window-local 'card_closed' (main's ipc.ts): card/close's result, the hub took it. Always a known event. */
  private cardClosed(project: string, card: number): true {
    this.settle(project, card, "close");
    return true;
  }

  /** His answers made from this thread to a card asked elsewhere (window-local, oldest first; kept across a reload). */
  asides(key: string): readonly Aside[] {
    const k = `asides:${key}`;
    if (!this.slices.has(k) && this.asideKeep !== null) this.slices.set(k, asidesOf(this.asideKeep.read(k)));
    return this.slice<readonly Aside[]>(k, EMPTY);
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
    // G: the cid goes along (echoed on its error); with parts, no text: the hub renders it (m_22248)
    this.command({
      cmd: "send",
      project: a.project,
      agent: a.agent,
      text: parts === undefined ? a.text : "",
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
    from?: AnswerFrom,
  ): void {
    // inbox picks (3): where he was, so the answer's result can leave his row there (asides.ts)
    if (from !== undefined) this.answering.set(`${project}/${String(card)}`, from);
    // every view leaves it out until the hub's rows drop it (acted.ts), or the hub refuses it
    this.acts(project, card, "answer");
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
    this.acts(project, card, "close");
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
