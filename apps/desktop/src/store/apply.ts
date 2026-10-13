// The store's reading of one typed event from the core (HubEv | CoreEv): which slice it puts,
// which thread it merges, which pending send it settles. Split out of store.ts (the file cap);
// the Store calls it from apply(). Owner: amb-core (the store), amb-win (the split).

import {
  type BranchesList,
  type Dictation,
  diffKey,
  type Ev,
  type HubLine,
  type PagesList,
  type PrsList,
  type QueuedTake,
  takeKey,
  threadKey,
  type ToolOut,
  toolOutKey,
  type VersionsList,
} from "./types";
import type { Store } from "./store";

/** no confirms: one shared empty list, so a reader keeps the same reference */
const EMPTY: readonly never[] = [];

/** Applies one typed event to the store's slices and threads. */
export function applyTyped(s: Store, ev: Ev): void {
  switch (ev.ev) {
    case "projects":
      s.put("projects", ev.projects);
      for (const row of ev.projects) {
        if (
          row.cards !== undefined &&
          !s.slices.has(`hubcards:${row.project}`)
        ) {
          s.put(`cards:${row.project}`, row.cards);
        }
      }
      return;
    case "agents":
      s.put(`agents:${ev.project}`, ev.agents);
      return;
    case "cards":
      s.slices.set(`hubcards:${ev.project}`, true);
      // his cards and bise's own (`others`: a drop asking him, a done, a merge...) in one
      // list by id, as the TUI's inbox (state_rows::cards_of_rows): a drop of an agent
      // mid-turn is a question for him, and only `others` carries it
      s.put(
        `cards:${ev.project}`,
        (ev.others ?? []).length === 0
          ? ev.cards
          : [...ev.cards, ...(ev.others ?? [])].sort((a, b) => a.id - b.id),
      );
      return;
    case "thread":
      s.page(ev);
      return;
    case "entry":
      s.entryEv(ev);
      return;
    case "typing": {
      const key = threadKey(ev.project, ev.agent);
      const t = s.thread(key);
      if (t.typing === ev.text) return;
      t.typing = ev.text;
      s.emit(`typing:${key}`);
      return;
    }
    case "artifacts":
    case "scheduled":
    case "worktrees":
    case "dev_servers":
    case "merged":
    case "features":
    case "models":
    case "jobs":
      s.put(`${ev.ev}:${ev.project}`, ev.items);
      return;
    case "branches":
      // the answer to branches (scanned on a thread): the review's branch picker
      s.put(`branches:${ev.project}`, {
        base: ev.base,
        rows: ev.rows,
      } satisfies BranchesList);
      return;
    case "versions":
      s.put(`versions:${ev.project}`, {
        current: ev.current,
        dev: ev.dev === true,
        installed: ev.installed === true,
        items: ev.items,
      } satisfies VersionsList);
      return;
    case "flow":
      // the repo's [flow] mode; none = not set
      s.put(`flow:${ev.project}`, ev.flow ?? null);
      return;
    case "switch":
      // where the hub's version switch is (/reload, /restart): at hello and when it moved; none = no switch yet
      s.put(`switch:${ev.project}`, ev.switch ?? null);
      return;
    case "pages":
      s.put(`pages:${ev.project}`, {
        items: ev.items,
        overdue: ev.overdue,
      } satisfies PagesList);
      return;
    case "release":
    case "update":
      // a /release-bise run (dev builds) or /update's build: its latest step, whole each time
      s.put(`${ev.ev}:${ev.project}`, ev);
      return;
    case "prs":
      s.put(`prs:${ev.project}`, {
        head: ev.head,
        items: ev.items,
        none: ev.none ?? null,
      } satisfies PrsList);
      return;
    case "tool_out": {
      const key = toolOutKey(ev.project, ev.agent, ev.pos);
      s.toolAsks.delete(key);
      s.put(key, {
        out: ev.out,
        cut: ev.cut,
        ...(ev.total == null ? {} : { total: ev.total }),
      } satisfies ToolOut);
      return;
    }
    case "queued_taken": {
      const key = takeKey(ev.project, ev.agent, ev.id);
      if (s.takeAsk.get(ev.project) === key) s.takeAsk.delete(ev.project);
      s.put(key, { text: ev.text } satisfies QueuedTake);
      return;
    }
    case "diff":
      // an answer to someone else's `req` (a terminal's /diff) never lands on this window's views
      if (ev.req != null) {
        if (!s.diffReqs.has(ev.req)) return;
        s.diffReqs.delete(ev.req);
      }
      s.put(diffKey(ev.project, ev.agent, ev.commit ?? undefined), ev);
      return;
    case "prefs":
      s.put("prefs", ev.prefs);
      return;
    case "accounts":
      s.put("accounts", ev.items);
      // a sign-in's end: its link is no longer open
      if (s.signing() !== null) s.put("signing", null);
      return;
    case "signing":
      s.put("signing", { id: ev.id, url: ev.url });
      return;
    case "found":
      s.put("found", ev.items);
      return;
    case "plugins":
      s.put(`plugins:${ev.project ?? ""}`, ev.items);
      return;
    case "computer_use":
      s.put("computer_use", ev);
      return;
    case "computer_live":
      // S29: every agent using computer use now, whole each time
      s.put("computer_live", ev.items);
      return;
    case "computer_peek":
      // S29: the latest still of that agent replaces the last (memory only)
      s.put(`peek:${ev.key}`, ev);
      return;
    case "away_summary":
      s.put("away", ev);
      return;
    case "commands":
      s.put("commands", ev.items);
      return;
    case "roles":
      s.put("roles", ev.items);
      return;
    case "skills":
      s.put(`skills:${ev.project}`, ev.items);
      return;
    case "files":
      s.filesAnswer(ev);
      return;
    case "heard":
      // fn's talk: the whole text so far, then all of it (final); the capsule's talk view draws it
      s.put("heard", { text: ev.text, final: ev.final });
      return;
    case "shot":
      // fn's talk: the still it will send (file: its stored path), null once it went or was dropped
      s.put("shot", ev.file == null ? null : { file: ev.file, app: ev.app ?? null, title: ev.title ?? null });
      return;
    case "level":
      // a meter's input (~30 Hz): only who reads that voice re-renders
      if (s.slices.get(`level:${ev.who}`) !== ev.v)
        s.put(`level:${ev.who}`, ev.v);
      return;
    case "voice_answer":
      // bar N14: his talk answered a card in view; the inbox shows it, then answers
      s.put("voice_answer", ev);
      return;
    case "voice_mode":
      // only the window that turned it on gets it (main's routes); its
      // last (on: false) stays until he turns it on again
      s.put("voice_mode", ev);
      return;
    case "dictation":
      // only the window that started it gets it (main's routes); an id
      // this store never started, or one already over, is ignored
      if (!s.dictating.has(ev.id)) return;
      if (ev.final) s.dictating.delete(ev.id);
      s.put(`dictation:${ev.id}`, {
        text: ev.text,
        final: ev.final,
        cancelled: ev.cancelled ?? false,
        error: ev.error ?? null,
        ...(ev.final && ev.kept === true ? { kept: true } : {}),
      } satisfies Dictation);
      return;
    case "error":
      if (ev.cmd === "sign_in" && s.signing() !== null) s.put("signing", null);
      // a typed line the hub's router refused (HubCmd slash): his words to fix, as an error line
      if (ev.cmd === "slash" && ev.project != null) {
        s.put(`notice:${ev.project}`, {
          text: ev.text,
          level: "error",
        } satisfies HubLine);
        return;
      }
      // a queued message he took back had gone already (delivered, no longer waiting): the hub's words on its row
      if (ev.cmd === "queued_take" && ev.project != null) {
        const key = s.takeAsk.get(ev.project);
        if (key !== undefined) {
          s.takeAsk.delete(ev.project);
          s.put(key, { error: ev.text } satisfies QueuedTake);
          return;
        }
      }
      // the hub found no such call or no result yet: that project's last ask says so (asked again on the next open)
      if (ev.cmd === "tool_out" && ev.project != null) {
        const key = s.toolAsk.get(ev.project);
        if (key !== undefined) {
          s.toolAsks.delete(key);
          s.put(key, { error: ev.text } satisfies ToolOut);
        }
        return;
      }
      if (ev.cmd !== "send") return;
      // G: exactly the row with this cid; with no cid (an older core or
      // hub) the oldest sending row of that project, as before
      if (ev.cid !== undefined && ev.cid !== null)
        s.failCid(ev.cid, ev.reason ?? "refused", ev.text);
      else s.failOldest(ev.project ?? null, ev.text);
      return;
    case "confirm":
      // a question belongs to the connection that asked: only this window gets it
      s.put(`confirms:${ev.project}`, [
        ...s.confirms(ev.project).filter((c) => c.id !== ev.id),
        { project: ev.project, id: ev.id, text: ev.text },
      ]);
      return;
    case "notice": {
      // the answer to his own /restart (its cid): the row says the app's version too
      const restart = ev.cid != null && s.restartCids.delete(ev.cid);
      s.put(`notice:${ev.project}`, {
        text: ev.text,
        level: "note",
        ...(restart ? { restart: true } : {}),
      } satisfies HubLine);
      return;
    }
    case "approvals":
      // bar V8/W21: the mode, the checker and the rules, whole each time
      s.put(`approvals:${ev.project}`, ev);
      return;
    case "refused":
      // a hub's own refusal of a connection: the core reads it and says
      // hub_refused; it never reaches a window as is
      return;
    case "index":
      // ⌘K's index: the projects the core doesn't hold, from their files
      s.put("index", ev.projects);
      return;
    case "setup_first":
      // R8: his /model needs that provider's setup first (the core holds the line)
      s.put("setup_first", ev);
      return;
    case "keychain":
      // N1: where his keys and sign-ins are kept, and the last /keychain move's lines
      s.put("keychain", ev);
      return;
    case "hub_refused":
      // a project's hub refused this core: its words until he retries
      s.put(`hub_refused:${ev.project}`, ev.error);
      return;
    case "broken":
      // this core can start no hub (its runtime is missing): why, for this core's life
      s.put("broken", ev.reason);
      return;
    case "welcome":
      // its hub took this core (again): no refusal holds
      if (s.slices.get(`hub_refused:${ev.project}`) != null)
        s.put(`hub_refused:${ev.project}`, null);
      // a new hello: the hub tied the open questions to a connection
      // that is gone (the core reconnected), so none can be answered
      if (s.confirms(ev.project).length > 0)
        s.put(`confirms:${ev.project}`, EMPTY);
      // the hub's last plain line was said on the connection before this hello: a /restart's
      // 'restarting the hub …' is over once the hub says hello again, so it goes (his m_22835:
      // it stayed 40 min after the hub came back; designer m_22843: no past line). A refused line
      // (his words to fix) stays. A restart's keeps its mark: the app's staged build still shows.
      {
        const line = s.notice(ev.project);
        if (line?.level === "note" && line.back !== true)
          s.put(`notice:${ev.project}`, line.restart === true ? { ...line, back: true } : null);
      }
      return;
    case "route":
    case "route_done":
    case "job_end":
    case "followed_end":
    case "open":
    case "page_changed":
    case "card_open":
    case "focused":
      // one-shot: read through onEvent (page_changed: a 'v2 published' moment before the next
      // pages; card_open: open that card in the inbox; focused: this connection's thread moved)
      return;
  }
}
