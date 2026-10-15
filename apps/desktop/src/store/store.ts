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
import { actedAdd, actedAnswered, actedKey, actedOf, actedPrune, cardRefusedOf, type Acted } from "./acted";
import { refusedAdd, refusedDrop, refusedListOf, refusedOf, refusedPrune, type Attempt, type Refused } from "./refused";
import type { CoreState } from "@/shared/api";
import {
  type Ev,
  type EvOf,
  type FilesAnswer,
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
import { answered, echoOf, keepLanded, sentOf, ECHO_SLACK_MS, type Sent } from "./echo";
import { EMPTY, type Thread } from "./base";
import { answeredFromOf, answersOf, cardAnsweredOf, cardKeyOf, jumpOf, keptAnswers, type AnswerAt, type AnswerFrom, type AnsweredFrom, type CardAnswered } from "./answered";
import { StoreVoice } from "./voice";

export { DICTATE_STOP_WAIT_MS } from "./voice";
export type { StoreOptions } from "./base";

/** The keep's key of where he made his answers (answered.ts). */
const ANSWERS = "answered-from";

/** Where the window goes for an answer the hub took: that thread, at that card's answer; `seq` counts them. */
export interface AnswerJump extends AnswerAt {
  readonly card: number;
  readonly seq: number;
}

export class Store extends StoreVoice {
  /** inbox picks (3): where he was for each card he answered, until its result comes */
  private readonly answering = new Map<string, AnswerFrom>();
  /** what he sent for each card on its way, by cardKey: a refusal keeps it for 'try again' */
  private readonly attempts = new Map<string, Attempt>();

  // ---- the core's events

  /** Applies one raw event from the core; false when it isn't one the store knows. */
  apply(raw: unknown): boolean {
    const sent = sentOf(raw);
    if (sent !== null) return this.sendAnswered(sent);
    const done = cardAnsweredOf(raw);
    if (done !== null) return this.cardAnswered(done);
    const refused = cardRefusedOf(raw);
    if (refused !== null) return this.cardRefused(refused.project, refused.card, refused.text);
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
    const i = echoOf(t.pending, e, ECHO_SLACK_MS);
    if (i < 0) t.landedIds = keepLanded(t.landedIds, e.msg_id);
    if (i < 0) return;
    t.pending = t.pending.filter((_, j) => j !== i);
    this.emit(`pending:${key}`);
  }

  /**
   * answer-in-thread A: the window-local 'card_answered' (main's ipc.ts): his answer to a card this
   * window sent, as sb-core wrote it. The hub took it: where he made it is kept (the row's
   * 'answered from …'), and when it came from another project's thread (or bise's), the window
   * goes to the asking project's main thread at his answer (answered.ts). Always a known event.
   */
  private cardAnswered(d: CardAnswered): true {
    const k = cardKeyOf(d.project, d.card);
    // the hub took it: no refusal of it holds
    this.putRefused(refusedDrop(this.refused(), d.project, d.card));
    this.attempts.delete(actedKey(d.project, d.card));
    // the hub's rows came before its answer: still listed, the hub kept the card open (acted.ts)
    this.putActed(actedAnswered(this.acted(), d.project, d.card, this.projects()));
    const from = this.answering.get(k);
    this.answering.delete(k);
    if (from === undefined) return true;
    const got = answeredFromOf(from, d.project, d.card, d.answer, this.now());
    if (got !== null) {
      const list = keptAnswers(this.answersFrom(), got);
      this.put(ANSWERS, list);
      this.asideKeep?.write(ANSWERS, list);
    }
    const home = this.projects().find((p) => p.home)?.project ?? "";
    const to = jumpOf(from, d.project, home, d.answer !== null);
    if (to !== null) this.put("answer_jump", { ...to, card: d.card, seq: (this.slice<AnswerJump | null>("answer_jump", null)?.seq ?? 0) + 1 });
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
    this.putActed(actedPrune(this.acted(), rows, this.now()));
    this.putRefused(refusedPrune(this.refused(), rows));
    // what he sent matters only while it is on its way (acted)
    const on = new Set(this.acted().map((a) => a.key));
    for (const k of [...this.attempts.keys()]) if (!on.has(k)) this.attempts.delete(k);
  }
  /** He answered or closed it: out of every view until the hub's rows drop it, or its refusal; its last refusal goes. */
  private acts(project: string, card: number, attempt: Attempt): void {
    this.putActed(actedAdd(this.acted(), project, card, this.now()));
    this.putRefused(refusedDrop(this.refused(), project, card));
    this.attempts.set(actedKey(project, card), attempt);
  }
  /**
   * The cards whose answer or close was refused in this window (refused.ts): each view that draws
   * the card says 'not sent: <words> · try again' on it. Kept across a reload, as his asides.
   */
  refused(): readonly Refused[] {
    if (!this.slices.has("refused") && this.asideKeep !== null) this.slices.set("refused", refusedListOf(this.asideKeep.read("refused")));
    return this.slice<readonly Refused[]>("refused", EMPTY);
  }
  private putRefused(list: readonly Refused[]): void {
    if (list === this.refused()) return;
    this.put("refused", list);
    this.asideKeep?.write("refused", list);
  }
  /**
   * The window-local 'card_refused' (main's ipc.ts): the core or the hub refused his answer or
   * close of that very card (the RPC error to that request, architect m_23524), or the core went
   * before its hub said. The card is his again in every view, never hidden while it waits, and the
   * words go on that card (refused.ts), never on the project's line (try-gate-f2a7). Always a known event.
   */
  private cardRefused(project: string, card: number, text: string): true {
    const key = actedKey(project, card);
    this.answering.delete(`${project}/${String(card)}`);
    this.putActed(this.acted().filter((x) => x.key !== key));
    this.putRefused(refusedAdd(this.refused(), project, card, text, this.now(), this.attempts.get(key)));
    this.attempts.delete(key);
    return true;
  }
  /** 'try again' on a refused card: what he sent, sent again (none known: nothing, the card stays his). */
  retryCard(project: string, card: number): void {
    const a = refusedOf(this.refused(), project, card)?.attempt;
    if (a === undefined) return;
    if (a.kind === "close") this.close(project, card);
    else this.answer(project, card, a.reply, a.files, a.parts, a.from);
  }

  /** Where he made each answer this window sent (window-local, oldest first; kept across a reload). */
  answersFrom(): readonly AnsweredFrom[] {
    if (!this.slices.has(ANSWERS) && this.asideKeep !== null) this.slices.set(ANSWERS, answersOf(this.asideKeep.read(ANSWERS)));
    return this.slice<readonly AnsweredFrom[]>(ANSWERS, EMPTY);
  }
  /** Where he made his answer to card `card` of `project`, when this window sent it. */
  answeredFrom(project: string, card: number): AnsweredFrom | null {
    const k = cardKeyOf(project, card);
    return this.answersFrom().find((a) => a.key === k) ?? null;
  }
  /** The newest jump to an answer the hub took (answer-in-thread A); null before any. */
  answerJump(): AnswerJump | null {
    return this.slice<AnswerJump | null>("answer_jump", null);
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
  /**
   * Bring the entry at `pos` into the view (his answer weeks back, a find's hit): 'held' with the
   * row's pos when the view has it; 'asked' when its page is on its way (the view's window, with a
   * gap row to the tail, window.ts); 'wait' while the thread isn't loaded. Again with the page
   * there: 'held'.
   */
  jumpTo(project: string, agent: string, pos: number): { kind: "held"; pos: number } | { kind: "asked" | "wait" } {
    const key = threadKey(project, agent);
    const t = this.thread(key);
    const plan = planJump(t.view, pos);
    if (plan.kind !== "ask") return plan;
    if (t.ask?.kind === "jump" && t.ask.pos === pos) return { kind: "asked" };
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
  /** His answer to card `card`: its words, and the images he pasted or dropped (R41: absolute paths, as a send's files). */
  answer(
    project: string,
    card: number,
    reply: string,
    files?: readonly string[],
    parts?: readonly Part[],
    from?: AnswerFrom,
  ): void {
    // answer-in-thread A: where he was, for the row's 'answered from …' and the jump (answered.ts)
    if (from !== undefined) this.answering.set(`${project}/${String(card)}`, from);
    // every view leaves it out until the hub's rows drop it (acted.ts), or the hub refuses it
    this.acts(project, card, {
      kind: "answer",
      reply,
      ...(files !== undefined ? { files } : {}),
      ...(parts !== undefined ? { parts } : {}),
      ...(from !== undefined ? { from } : {}),
    });
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
    this.acts(project, card, { kind: "close" });
    this.command({ cmd: "close", project, card });
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
  InboxList,
  QueuedTake,
  TalkShot,
  ThreadOrder,
  ToolOut,
  VersionsList,
  VoiceModeState,
} from "./types";
