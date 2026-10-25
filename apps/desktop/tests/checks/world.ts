// The new app on the REAL core and a throwaway world (qa-flows): no scripted core, no hooks.
// The world is ambient-qa's (dev/plugins/ambient-qa/world.py): an isolated HOME under ~/.bise/gate
// with bise's home hub and 2 seeded projects, every hub on tests/fake_provider.py's scripted
// model. tests/checks/real.sh brings it up, runs the checks, and takes it down; `realWorld()` only
// reads it (`qa.py world state`). `launchReal()` starts the built app (out/) with
// BISE_DESKTOP_BISE = the world's bise, so main's process runs `bise ambient-core` exactly as
// for him, in the world's home given to the harness (launchDesktop's `home`: the harness sets HOME
// and BISE_HOME there and keeps its sentinel on): the core finds the world's hubs by his own
// rules, never his.
// `hub(project)` reads that hub straight from its socket (the effect outside the app), and
// `tui(project)` opens the terminal's own view of the same hub in a detached tmux session, the
// reference for every parity row (docs/desktop-bar.md).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { launchDesktop, type LaunchOptions, type Session } from '../harness';

const REPO = path.resolve(__dirname, '..', '..', '..', '..');
const QA = path.join(REPO, 'dev', 'plugins', 'ambient-qa', 'qa.py');
const GATE = path.join(os.homedir(), '.bise', 'gate') + path.sep;

export type HubInfo = { project: string; home: boolean; ws: string; sock: string; alive: boolean };
export type World = { world: string; home: string; bise: string; hubs: HubInfo[] };

const qa = (args: string[], timeout: number): string =>
  execFileSync('python3', ['-B', QA, ...args], { cwd: REPO, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'pipe'] });

/** One pure function of world.py (world_env, leaked, proc_env: amb-tools b81056b0), fed JSON on stdin. */
const worldPy = (call: string, input: unknown): unknown =>
  JSON.parse(execFileSync('python3', ['-B', '-c',
    `import sys, json; sys.path.insert(0, ${JSON.stringify(path.dirname(QA))}); import world; a = json.load(sys.stdin); print(json.dumps(${call}))`],
  { cwd: REPO, encoding: 'utf8', timeout: 20_000, input: JSON.stringify(input) })) as unknown;

const parse = (out: string): World => JSON.parse(out.slice(out.indexOf('{'))) as World;

/**
 * The world that tests/checks/real.sh brought up for this run (it takes it down after the run:
 * no world is left behind, and a test never starts or stops one: Playwright restarts its worker
 * after a failed test, so a worker-exit hook took the world down mid-run). Refuses anything
 * outside ~/.bise/gate, a dead hub, or a world whose bise build is gone.
 */
export function realWorld(): World {
  // the runner said the world didn't come up (covmap.mts RealWorld): red at once, no wait
  const none = process.env['BISE_CHECKS_NO_WORLD'];
  if (none) throw new Error(`no world up: ${none} (covmap checks said why)`);
  let w: World;
  try {
    w = parse(qa(['world', 'state'], 15_000));
  } catch (e) {
    throw new Error(`no world up: run the real-core checks through tests/checks/real.sh (${String(e).split('\n')[0] ?? ''})`);
  }
  if (!path.resolve(w.home).startsWith(GATE)) throw new Error(`refused: the world's home ${w.home} is not under ~/.bise/gate`);
  if (!existsSync(w.bise)) throw new Error(`the world's bise is gone: ${w.bise} (rerun tests/checks/real.sh)`);
  const dead = w.hubs.filter((h) => !h.alive).map((h) => h.project);
  if (dead.length) throw new Error(`the world's hubs are down: ${dead.join(', ')} (rerun tests/checks/real.sh)`);
  return w;
}

export const hubOf = (w: World, project: string): HubInfo => {
  const h = w.hubs.find((x) => x.project === project || (project === 'bise' && x.home));
  if (!h) throw new Error(`no project ${project} in the world (${w.hubs.map((x) => x.project).join(', ')})`);
  return h;
};

/** The world's env for any process of the test: its HOME, its run and temp folders, never his. */
export function worldEnv(w: World): Record<string, string> {
  const tmp = path.join(w.home, 'tmp');
  return {
    HOME: w.home,
    BISE_HOME_WORKSPACE: path.join(w.home, 'bise'),
    BEND_RUN_DIR: path.join(w.home, '.bise', 'run'),
    TMPDIR: tmp, TMP: tmp, TEMP: tmp,
  };
}

/** The new app on the real core of the world; workspace '' = bise's home (--home), as he starts it.
 * The harness runs it in the world's home (launchDesktop's `home`, amb-tools 9c85cc18): it sets
 * HOME and BISE_HOME itself, keeps its sentinel on, and never deletes the world. */
export function launchReal(w: World, o: LaunchOptions & { workspace?: string } = {}): Promise<Session> {
  const { workspace, ...rest } = o;
  return launchDesktop({
    ...rest,
    home: w.home,
    env: { BISE_DESKTOP_BISE: w.bise, BISE_DESKTOP_WORKSPACE: workspace ?? '', ...(o.env ?? {}) },
  });
}

/**
 * One JSON-RPC exchange with a hub, as any client of hub.sock since client-protocol
 * (docs/client-protocol.md; the old {op: hello} lines get 'the released door only' and no state):
 * `initialize`, `initialized`, then `method` if given. Returns initialize's result and the call's.
 */
function hubRpc(sock: string, method: string | null, params: Record<string, unknown>, timeoutMs: number): Promise<{ init: Record<string, unknown>; result: unknown }> {
  return new Promise((resolve, reject) => {
    const c = net.createConnection(sock);
    let buf = '';
    let init: Record<string, unknown> | null = null;
    const done = (f: () => void) => { clearTimeout(t); c.destroy(); f(); };
    const t = setTimeout(() => { done(() => { reject(new Error(`no answer from ${sock} in ${String(timeoutMs)} ms`)); }); }, timeoutMs);
    c.on('connect', () => {
      c.write(JSON.stringify({ jsonrpc: '2.0', id: 'qa-init', method: 'initialize', params: { proto: 1, client: { name: 'qa-flows', version: '0' }, capabilities: {} } }) + '\n');
    });
    c.on('data', (d) => {
      buf += d.toString();
      for (;;) {
        const i = buf.indexOf('\n');
        if (i < 0) break;
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        let m: Record<string, unknown>;
        try {
          m = JSON.parse(line) as Record<string, unknown>;
        } catch {
          continue;
        }
        if (m['error'] !== undefined && (m['id'] === 'qa-init' || m['id'] === 'qa-call')) {
          done(() => { reject(new Error(`${String(m['id'])}: ${JSON.stringify(m['error'])}`)); });
          return;
        }
        if (m['id'] === 'qa-init') {
          init = (m['result'] as Record<string, unknown> | undefined) ?? {};
          c.write(JSON.stringify({ jsonrpc: '2.0', method: 'initialized' }) + '\n');
          if (method === null) {
            const got = init;
            done(() => { resolve({ init: got, result: null }); });
            return;
          }
          c.write(JSON.stringify({ jsonrpc: '2.0', id: 'qa-call', method, params }) + '\n');
        } else if (m['id'] === 'qa-call' && init !== null) {
          const got = init;
          done(() => { resolve({ init: got, result: m['result'] }); });
          return;
        }
      }
    });
    c.on('error', (e) => { clearTimeout(t); reject(e); });
  });
}

/**
 * One hub's state, read from its socket like any client: initialize's `hub.state` (one hub-wide
 * notification of each kind, as sent now), their params merged: agents, cards, ... what the
 * app's actions must change.
 */
export async function hubState(sock: string, timeoutMs = 10_000): Promise<Record<string, unknown>> {
  const { init } = await hubRpc(sock, null, {}, timeoutMs).catch((e: unknown) => {
    throw new Error(`no state from ${sock}: ${String(e)}`);
  });
  const notes = ((init['hub'] as { state?: { method?: string; params?: Record<string, unknown> }[] } | undefined)?.state) ?? [];
  const out: Record<string, unknown> = { project: init['project'] };
  for (const n of notes) Object.assign(out, n.params ?? {});
  return out;
}

/** One hub method by JSON-RPC (e.g. approvals/set {project, mode}); `project` is filled from initialize when absent. */
export async function hubCall(sock: string, method: string, params: Record<string, unknown> = {}, timeoutMs = 10_000): Promise<unknown> {
  if (params['project'] === undefined) {
    const { init } = await hubRpc(sock, null, {}, timeoutMs);
    params = { ...params, project: init['project'] };
  }
  return (await hubRpc(sock, method, params, timeoutMs)).result;
}

/** Whether that agent's transcript in that hub holds the words: the hub really got them. */
export function transcriptHas(w: World, project: string, agent: string, words: string): boolean {
  const f = path.join(path.dirname(hubOf(w, project).sock), 'agents', agent, 'transcript.log');
  try {
    return readFileSync(f, 'utf8').includes(words);
  } catch {
    return false;
  }
}

/**
 * The hub's own lines of one kind in that agent's transcript ('sb approval', 'sb pr', …), in both
 * forms: the record form `sb <kind> :: <json>` (bise_proto::core::Feed, rust/proto/src/core/feed.rs:
 * json is the record's fields, e.g. approval {how, who, what, note}, pr {state, number, url, text})
 * and the older text form `sb <kind> : <text>` that old transcripts keep (json undefined there).
 */
export function transcriptFeed(w: World, project: string, agent: string, kind: string): { raw: string; json?: Record<string, unknown> }[] {
  const f = path.join(path.dirname(hubOf(w, project).sock), 'agents', agent, 'transcript.log');
  let text = '';
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    return [];
  }
  return feedLines(text, kind);
}

/** `transcriptFeed` on a transcript's text. */
export function feedLines(text: string, kind: string): { raw: string; json?: Record<string, unknown> }[] {
  const out: { raw: string; json?: Record<string, unknown> }[] = [];
  for (const raw of text.split('\n')) {
    const at = raw.indexOf(`sb ${kind} :`);
    if (at < 0) continue;
    const rest = raw.slice(at + `sb ${kind}`.length);
    if (rest.startsWith(' :: ')) {
      try {
        const v: unknown = JSON.parse(rest.slice(4));
        out.push(v !== null && typeof v === 'object' ? { raw, json: v as Record<string, unknown> } : { raw });
      } catch {
        out.push({ raw });
      }
    } else out.push({ raw });
  }
  return out;
}

/**
 * The TUI's side panel, one trimmed string per screen line: the text between the panel's left
 * border (the '┬' in the top border) and the right border. Cut by column, not by '│': a tip
 * popover ('new: your agents…') drawn over the feed can cover the border between feed and panel.
 */
function panelOf(screen: string): string[] {
  const lines = screen.split('\n');
  const col = (lines[0] ?? '').indexOf('┬');
  // no '┬' (the top border is the title bar): the panel's width from its 'agents' head line
  // ('│  agents   │'), cut from each line's right border. Not by '│': the first-run tip box
  // ('new: your agents…', qa-native e3f7e598) drawn just left of the panel puts its own corners and
  // borders on the agent rows' lines, so the cell before the last '│' can be the whole feed.
  // With a '┬' too: a feed line holding a character of two code units ('✉︎' is U+2709 + U+FE0E, the
  // TUI's message rows) shifts everything after it by one, so a cut at the '┬' column misses the
  // panel on that line ('│  agents' instead of 'agents'); from the right border it never does.
  const head = lines.find((l) => /│\s+agents\s+│\s*$/.test(l));
  const width = head ? head.lastIndexOf('│') - head.lastIndexOf('│', head.lastIndexOf('agents')) - 1 : -1;
  return lines.map((l) => {
    if (width > 0) {
      const end = l.lastIndexOf('│');
      return end > width ? l.slice(end - width, end).trim() : '';
    }
    if (col < 0) {
      const cells = l.split('│');
      return (cells.length >= 3 ? (cells[cells.length - 2] ?? '') : '').trim();
    }
    const end = l.lastIndexOf('│');
    return end > col ? l.slice(col + 1, end).trim() : '';
  });
}

/** The terminal on the same hub, in a detached tmux session of its own (never his tmux server). */
export type Tui = { screen: () => string; keys: (...k: string[]) => void; close: () => void };

export function tui(w: World, project: string, size = '160x50'): Tui {
  const h = hubOf(w, project);
  const sockDir = mkdtempSync(path.join(path.join(w.home, 'tmp'), 'tmux-'));
  const tsock = path.join(sockDir, 's');
  const name = `qaf${Date.now() % 1_000_000}`;
  const [cols, rows] = size.split('x');
  // the world's hubs' rule (world.py world_env, an allowlist: no secret-named variable, the fake
  // Mistral key), so the TUI sees the providers its hub sees; this process's BEND_* are an agent's,
  // never the world's (worldEnv gives the world's own)
  const mine = Object.fromEntries(Object.entries(process.env).filter((e): e is [string, string] => e[1] !== undefined && !e[0].startsWith('BEND_')));
  const env = worldPy('world.world_env(a)', { ...mine, ...worldEnv(w), PATH: process.env['PATH'] ?? '/usr/bin:/bin', TERM: 'xterm-256color', LANG: 'en_US.UTF-8' }) as Record<string, string>;
  // its own tmux server, started with that env: the pane gets the server's env, never his tmux's
  const tm = (args: string[]): string => execFileSync('tmux', ['-S', tsock, ...args], { encoding: 'utf8', env, timeout: 10_000 });
  const cmd = `cd ${JSON.stringify(h.ws)} && exec ${JSON.stringify(w.bise)}`;
  tm(['new-session', '-d', '-s', name, '-x', cols ?? '160', '-y', rows ?? '50', cmd]);
  // the law (world.py refuse_leak): no real key in the TUI or its tmux server (ps -E, names only)
  for (const pid of tm(['display', '-p', '-t', name, '#{pid} #{pane_pid}']).trim().split(/\s+/)) {
    const names = worldPy('world.leaked(world.proc_env(a))', Number(pid)) as string[];
    if (names.length > 0) {
      try { tm(['kill-server']); } catch { /* gone */ }
      throw new Error(`the TUI next to the world (pid ${pid}) holds secret-named variables: ${names.join(', ')} (values never shown)`);
    }
  }
  return {
    screen: () => tm(['capture-pane', '-p', '-t', name]),
    keys: (...k) => { tm(['send-keys', '-t', name, ...k]); },
    close: () => { try { tm(['kill-server']); } catch { /* gone */ } },
  };
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * The TUI ready on its feed: the world's home is fresh, so it opens on its first-run pages (the
 * splash, the provider step: esc leaves them, as a person who signs in later would); ready once its
 * side panel shows its agents.
 */
export async function tuiReady(t: Tui, timeoutMs = 20_000): Promise<void> {
  const t0 = Date.now();
  for (;;) {
    const s = t.screen();
    // its first-run pages: the 'hi, i'm bise … any key' splash, the provider step: esc leaves each
    if (/how do you want to pay|any key/.test(s)) t.keys('Escape');
    // ready: its panel lists agents (the 'agents' head alone can come a frame before its rows)
    else if (/│\s+agents\s+│/.test(s) && tuiAgents(s).length > 0) return;
    if (Date.now() - t0 > timeoutMs) throw new Error(`the TUI isn't ready after ${timeoutMs} ms:\n${s}`);
    await sleep(300);
  }
}

/**
 * The TUI's inbox, from its side panel (`inbox`, then rows `N ? <agent>  <text…>`), in its order:
 * [{ n, agent, text }] with the text as drawn (cut with … at the panel's width).
 */
export function tuiInbox(screen: string): { n: number; agent: string; text: string }[] {
  const panel = panelOf(screen);
  const at = panel.indexOf('inbox');
  if (at < 0) return [];
  const out: { n: number; agent: string; text: string }[] = [];
  for (const row of panel.slice(at + 1)) {
    const m = /^(\d+) \S (\S+)\s+(.*)$/.exec(row);
    if (!m) break;
    out.push({ n: Number(m[1]), agent: m[2] ?? '', text: (m[3] ?? '').replace(/…$/, '').trim() });
  }
  return out;
}

/**
 * The TUI's agents, from its side panel (`agents`, then rows `N <glyph> <name> …`), in its order:
 * [{ n, glyph, name }]. The glyph is its status (rust/tui/src/theme.rs, TUI_STATUS).
 */
export function tuiAgents(screen: string): { n: number; glyph: string; name: string }[] {
  const panel = panelOf(screen);
  const at = panel.indexOf('agents');
  if (at < 0) return [];
  const out: { n: number; glyph: string; name: string }[] = [];
  for (const raw of panel.slice(at + 1)) {
    // the first-run tip box ('new: your agents… ⌥ 1 to look inside') can end on the panel's left
    // edge on the agent rows' lines (qa-native, packed e3f7e598): its border chars lead the row
    const row = raw.replace(/^[│╮╯╭╰─┐┘\s]+/u, '');
    // a feature's agents come under its own head ('ψ gift-cards'), after a blank line
    if (row === '' || row.startsWith('ψ ')) continue;
    if (row === 'inbox') break;
    const m = /^(\d+) (\S) (\S+)/.exec(row);
    if (!m) break;
    out.push({ n: Number(m[1]), glyph: m[2] ?? '', name: m[3] ?? '' });
  }
  return out;
}

/**
 * The TUI's panel agents once it draws them: the screen is read again until the panel has rows
 * (a capture can land mid-redraw, with only the top border drawn). [] after `timeoutMs`.
 */
export async function tuiPanel(t: Tui, timeoutMs = 5000): Promise<{ n: number; glyph: string; name: string }[]> {
  const t0 = Date.now();
  for (;;) {
    const rows = tuiAgents(t.screen());
    if (rows.length > 0 || Date.now() - t0 > timeoutMs) return rows;
    await sleep(200);
  }
}

/** The statuses a TUI panel glyph stands for (rust/tui/src/theme.rs: G_WORKING …). */
export const TUI_STATUS: Readonly<Record<string, readonly string[]>> = {
  '∿': ['working'], '·': ['working'], '?': ['blocked', 'waiting'], '…': ['waiting'],
  '✓': ['done'], '✗': ['failed'], '○': ['idle'], '–': ['idle'],
};

/** One agent as the hub's socket state has it (the fields the A rows read). */
export type HubAgent = { name: string; status: string; main: boolean; dropped: boolean; archived?: boolean; branch: string | null; report: string | null; model: string; effort?: string | null; efforts?: string[]; mode?: string; path?: string; changes: { add: number; del: number; files: number } | null };

/** The hub's agents, read straight from its socket (`hubState`). */
export async function hubAgents(w: World, project: string): Promise<HubAgent[]> {
  const s = await hubState(hubOf(w, project).sock);
  return (s['agents'] as HubAgent[] | undefined) ?? [];
}

/**
 * A line to a project's fake main from outside the app and the TUI (`qa.py world say`): the agents'
 * side of a flow, e.g. '[[bash: sb feature ready gift-cards]]' opens the feature's try card.
 */
export function worldSay(project: string, text: string): void {
  qa(['world', 'say', project, text], 120_000);
}

/**
 * An app-menu key (⌘I: 'CmdOrCtrl+I') as NSMenu does it: the item's click with the focused window
 * (none: the harness never focuses one, so main's own lookup decides where it goes). A menu key
 * never reaches the page's keyboard, so page.keyboard.press can't stand for it. Returns its label.
 */
export async function menuKey(s: Session, accelerator: string): Promise<string> {
  return s.app.evaluate(({ Menu, BrowserWindow }, acc) => {
    const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
      for (const it of items) {
        if (it.accelerator === acc) return it;
        const sub = it.submenu ? find(it.submenu.items) : undefined;
        if (sub) return sub;
      }
      return undefined;
    };
    const it = find(Menu.getApplicationMenu()?.items ?? []);
    if (!it) return '';
    const click = it.click as unknown as (e: unknown, w: Electron.BrowserWindow | null, c: unknown) => void;
    click.call(it, {}, BrowserWindow.getFocusedWindow(), undefined);
    return it.label;
  }, accelerator);
}

/**
 * The app started on a route (the harness's start screen). A fresh world's first launch shows the
 * first-run setup instead ('hi. i'm bise … start / skip for now'), whatever the route: skip it by
 * its button, close, and launch again on the route (the skip is kept in the world's home).
 */
export async function launchOn(w: World, route: string, screen: string): Promise<Session> {
  const s = await launchReal(w, { route });
  const skip = s.page.locator('[data-testid="setup.skip"]');
  await s.page.locator(`${screen}, [data-testid="setup.skip"]`).first().waitFor({ timeout: 15_000 }).catch(() => undefined);
  if (!(await skip.isVisible())) return s;
  await skip.click();
  await s.page.waitForTimeout(500);
  await s.close();
  return launchReal(w, { route });
}

/**
 * A left click on the first place the TUI's screen shows `text` (its first letter), as his mouse
 * does it: an SGR mouse press and release written to the pane (the TUI captures the mouse).
 * False when the screen doesn't show it.
 */
export function tuiClick(t: Tui, text: string): boolean {
  const lines = t.screen().split('\n');
  const row = lines.findIndex((l) => l.includes(text));
  if (row < 0) return false;
  // terminal cells: one per code point here (box lines and ASCII names)
  const col = Array.from((lines[row] ?? '').slice(0, (lines[row] ?? '').indexOf(text))).length;
  const at = `${String(col + 1)};${String(row + 1)}`;
  t.keys('-l', `\x1b[<0;${at}M\x1b[<0;${at}m`);
  return true;
}

/** The TUI's prompt: type these words (literally) and Enter. */
export function tuiSay(t: Tui, words: string): void {
  t.keys('-l', words);
  t.keys('Enter');
}
