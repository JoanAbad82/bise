// Test harness: a throwaway Chrome profile with the extension loaded, the
// pages of test/pages/ on a local server, and a fake native host that
// hands the extension's port to the test (the test plays bise's broker,
// contract C4). Never the user's Chrome profile: --user-data-dir in $TMPDIR.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import net from "node:net";
import path from "node:path";
import { Readable, Writable } from "node:stream";

export const here = path.dirname(new URL(import.meta.url).pathname);
export const extDir = path.resolve(here, "..");
export const EXT_ID = "bogffepmbkbmbfejcadaipgphgkocgob";
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BROWSERS: Record<string, string> = {
  chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  edge: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  brave: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
};
export const installed = (name: string) => existsSync(BROWSERS[name] ?? "");

/** The port a listening server got. */
export function portOf(server: net.Server): number {
  const a = server.address();
  if (a === null || typeof a !== "object") throw new Error("the server listens on no port");
  return a.port;
}

/** The test pages on 127.0.0.1:<port>. */
export async function servePages() {
  const dir = path.join(here, "pages");
  const server = createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    const file = path.join(dir, path.basename(u.pathname) || "index.html");
    if (!existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const base = `http://127.0.0.1:${portOf(server)}/`;
  return { base, close: () => server.close() };
}

/** What a C4 reply's result carries: each op sets its own fields (sw/act.js, sw/tabs.js). */
export type Result = {
  target: string;
  url: string;
  title: string;
  text: string;
  summary: string;
  changed: string;
  refs: number;
  truncated: boolean;
  width: number;
  height: number;
  data: string;
  mime: string;
  tab_id: number;
  created: boolean;
};
/** One C4 reply: ok with its result, or an error; ms, the round trip. */
export type Reply<T = Result> = { id: number; ms: number } & ({ ok: true; result: T; error?: undefined } | { ok: false; result?: undefined; error: ReplyError });
/** A refused or failed op (sw/act.js): candidates on a locator miss, summary the user's line. */
export type ReplyError = { code: string; message: string; summary?: string; candidates?: unknown[] };
/** The result of a reply that must be ok (a test step that can't go on without it). */
export function resultOf<T>(r: Reply<T>): T {
  if (!r.ok) throw new Error(`${r.error.code}: ${r.error.message}`);
  return r.result;
}
/** What the extension says unasked: its hello, its events. */
export type Msg = { id?: number; hello?: unknown; event?: string; [k: string]: unknown };
export type Broker = Awaited<ReturnType<typeof fakeBroker>>;

/** The fake bise side: accepts the fake host's connection, speaks C4. */
export async function fakeBroker() {
  let sock: net.Socket | null = null, buf = "", id = 0;
  const pending = new Map<number, (m: Msg) => void>();
  const events: (Msg & { at: number })[] = [];
  const hellos: unknown[] = [];
  type Waiter = { test: () => boolean; done: () => void };
  const waiters: Waiter[] = [];
  const onMsg = (m: Msg) => {
    if (m.hello) hellos.push(m.hello);
    else if (m.event) events.push({ ...m, at: Date.now() });
    else if (m.id !== undefined) { const p = pending.get(m.id); if (p) { p(m); pending.delete(m.id); } }
    for (const w of [...waiters]) if (w.test()) { waiters.splice(waiters.indexOf(w), 1); w.done(); }
  };
  const server = net.createServer((s) => {
    sock = s;
    s.on("data", (d) => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (line) onMsg(JSON.parse(line)); }
    });
    s.on("close", () => { if (sock === s) sock = null; });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const send = (m: unknown) => { if (!sock) throw new Error("the extension is not connected"); sock.write(JSON.stringify(m) + "\n"); };
  return {
    port: portOf(server),
    hellos,
    events,
    connected: () => !!sock,
    send,
    /** One C4 request; resolves to {ok, result|error} plus ms. T: the op's result, when not Result's fields. */
    request<T = Result>(agent: string | undefined, op: string, args: object = {}, timeout = 30_000, extra: object = {}): Promise<Reply<T>> {
      const n = ++id;
      const t0 = Date.now();
      return new Promise((res, rej) => {
        const timer = setTimeout(() => { pending.delete(n); rej(new Error(`no answer to ${op} in ${timeout} ms`)); }, timeout);
        // the reply as the extension wrote it (JSON): the op's fields, read by the test that asked
        pending.set(n, (m) => { clearTimeout(timer); res(JSON.parse(JSON.stringify({ ...m, ms: Date.now() - t0 }))); });
        send({ id: n, agent, op, args, ...extra });
      });
    },
    /** Wait until test() is true (re-checked on every message). */
    until(test: () => boolean, timeout = 10_000) {
      if (test()) return Promise.resolve(true);
      return new Promise<boolean>((res) => {
        const w: Waiter = { test, done: () => { clearTimeout(timer); res(true); } };
        const timer = setTimeout(() => { waiters.splice(waiters.indexOf(w), 1); res(false); }, timeout);
        waiters.push(w);
      });
    },
    /** Cut the current connection (the host exits, like a broker restart). */
    drop: () => sock?.destroy(),
    close: () => { sock?.destroy(); server.close(); },
  };
}

/**
 * A throwaway headless browser with the extension, its native host = the fake host
 * connected to `brokerPort`. Returns a CDP client on the browser (pipe).
 */
export async function launch({ browser = "chrome", brokerPort, startUrl, windowSize = "1000,700" }: { browser?: string; brokerPort: number; startUrl: string; windowSize?: string }) {
  // Headless (new mode: the full browser, tab groups and extensions included):
  // a test never opens a window in front of the user (the product's own rule).
  const tmp = process.env.TMPDIR || "/tmp";
  const profile = mkdtempSync(path.join(tmp, "cu-profile-"));
  // The native host, registered in the throwaway profile only.
  mkdirSync(path.join(profile, "NativeMessagingHosts"), { recursive: true });
  const hostSh = path.join(profile, "host.sh");
  writeFileSync(hostSh, `#!/bin/bash\nexec "${process.execPath}" --experimental-strip-types --disable-warning=ExperimentalWarning "${path.join(here, "fake-host.ts")}" ${brokerPort}\n`, { mode: 0o755 });
  writeFileSync(path.join(profile, "NativeMessagingHosts", "dev.bise.computer_use.json"), JSON.stringify({
    name: "dev.bise.computer_use", description: "bise computer use (test)", path: hostSh, type: "stdio",
    allowed_origins: [`chrome-extension://${EXT_ID}/`],
  }));
  const bin = BROWSERS[browser];
  if (!bin) throw new Error(`no such browser: ${browser}`);
  const proc = spawn(bin, [
    `--user-data-dir=${profile}`,
    "--remote-debugging-pipe",
    "--enable-unsafe-extension-debugging",
    "--no-first-run", "--no-default-browser-check", "--disable-sync", "--disable-features=Translate",
    "--headless=new",
    `--window-size=${windowSize}`,
    startUrl,
  ], { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
  const toB = proc.stdio[3], fromB = proc.stdio[4];
  if (!(toB instanceof Writable) || !(fromB instanceof Readable)) throw new Error("no CDP pipe to the browser");
  let id = 0, buf = "";
  const pending = new Map<number, (r: CdpMessage) => void>();
  const listeners: ((m: CdpMessage) => void)[] = [];
  fromB.on("data", (d: Buffer) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\0")) >= 0) {
      const msg: CdpMessage = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1);
      const p = msg.id ? pending.get(msg.id) : undefined;
      if (msg.id && p) { p(msg); pending.delete(msg.id); }
      else for (const l of listeners) l(msg);
    }
  });
  // one CDP call; T: the fields of its result the caller reads
  const send = <T = unknown>(method: string, params = {}, sessionId?: string) => new Promise<T>((res, rej) => {
    const m: { id: number; method: string; params: object; sessionId?: string } = { id: ++id, method, params };
    if (sessionId) m.sessionId = sessionId;
    // the result as the browser wrote it (JSON), read by the caller as T
    pending.set(m.id, (r) => (r.error ? rej(new Error(method + ": " + JSON.stringify(r.error))) : res(JSON.parse(JSON.stringify(r.result ?? null)))));
    toB.write(JSON.stringify(m) + "\0");
  });
  const kill = () => {
    try { proc.kill("SIGKILL"); } catch { /* gone */ }
    rmSync(profile, { recursive: true, force: true });
  };
  // Never leave this Chrome behind, also when the test dies.
  process.on("exit", kill);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => { kill(); process.exit(130); });
  process.on("uncaughtException", (e) => { console.error(e); kill(); process.exit(1); });
  const quit = async () => {
    try { await Promise.race([send("Browser.close"), sleep(2000)]); } catch { /* gone */ }
    await sleep(500);
    kill();
  };
  return { send, on: (f: (m: CdpMessage) => void) => listeners.push(f), proc, profile, quit };
}

/** A CDP message from the browser: a call's answer (id) or an event (method). */
export type CdpMessage = { id?: number; method?: string; params?: Record<string, unknown>; sessionId?: string; result?: unknown; error?: unknown };
export type TargetInfo = { targetId: string; type: string; url: string; title?: string; attached?: boolean };
type Evaluated = { result: { value?: unknown }; exceptionDetails?: unknown };
export type Browser = Awaited<ReturnType<typeof launch>>;

/** Load the extension (pipe only) and give an evaluator on its worker. */
export async function loadExtension(b: Browser, dir = extDir) {
  const { id } = await b.send<{ id: string }>("Extensions.loadUnpacked", { path: dir });
  let sw: TargetInfo | undefined;
  for (let i = 0; i < 50 && !sw; i++) {
    const { targetInfos } = await b.send<{ targetInfos: TargetInfo[] }>("Target.getTargets");
    sw = targetInfos.find((t) => t.type === "service_worker" && t.url.includes(id));
    if (!sw) await sleep(100);
  }
  if (!sw) throw new Error("the extension's worker never started");
  const { sessionId } = await b.send<{ sessionId: string }>("Target.attachToTarget", { targetId: sw.targetId, flatten: true });
  // an expression in the worker; T: what the caller expects it to give (JSON)
  const ev = async <T = unknown>(expr: string): Promise<T> => {
    const r = await b.send<Evaluated>("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
    return JSON.parse(JSON.stringify(r.result.value ?? null));
  };
  return { id, ev };
}

/** A CDP session on a page target (the "user" acting in a tab). */
export async function pageSession(b: Browser, match: (t: TargetInfo) => boolean) {
  const { targetInfos } = await b.send<{ targetInfos: TargetInfo[] }>("Target.getTargets");
  const t = targetInfos.find((x) => x.type === "page" && match(x));
  if (!t) throw new Error("no such page");
  const { sessionId } = await b.send<{ sessionId: string }>("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  return {
    targetId: t.targetId,
    call: <T = unknown>(m: string, p?: object) => b.send<T>(m, p, sessionId),
    detach: () => b.send("Target.detachFromTarget", { sessionId }),
  };
}
