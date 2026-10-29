// The real stack as a library (stack.ts is its command line, paths.ts
// its tests): a throwaway headless Chrome with the bise extension, whose
// native host is a given `bise computer-use chrome-host` (so the real
// broker), all under a temp BISE_HOME. Never the user's browser.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { launch, loadExtension, sleep, EXT_ID, type Browser, type ReplyError } from "../extension/test/harness.ts";

export { sleep };

const NL = String.fromCharCode(10);

type Ext = Awaited<ReturnType<typeof loadExtension>>;
/** `bise computer-use status`, parsed (or its raw output when it isn't JSON). */
type Status = { browsers?: { connected: boolean }[]; raw?: string; [k: string]: unknown };
/** What a C3 result carries: each op sets its own fields (the ones the paths read). */
export type CallResult = { target: string; url: string; text: string; changed: string; screen_recording?: boolean | null; me?: { stopped?: boolean } };
/** One C3 reply: ok with its result, or an error; ms, the round trip. */
export type CallReply = { ms: number } & ({ ok: true; result: CallResult; error?: undefined } | { ok: false; result?: undefined; error: ReplyError });
/** One line of C6 events.jsonl. */
export type StackEvent = { agent?: string; event?: string; by?: string; [k: string]: unknown };
/** One agent's C3 connection to the broker. */
export type Agent = { call(op: string, args?: object): Promise<CallReply>; close(): void };
export type Stack = Awaited<ReturnType<typeof startStack>>;

/**
 * Start the stack: the broker, then a browser whose extension reached it.
 * Returns { home, env, status, connected, agent, events, ctl, b, ext,
 * killBrowser, startBrowser, stop }.
 */
export async function startStack({ bise, browser = "chrome", brokerArgs = ["--no-helper-launch"] }: { bise: string; browser?: string; brokerArgs?: string[] }) {
  // A short BISE_HOME: the broker's unix socket path must stay under 104 bytes.
  const home = mkdtempSync(path.join(process.env.HOME ?? "", ".bise", "gate", "cu-stack-"));
  mkdirSync(path.join(home, "run"), { recursive: true, mode: 0o700 });
  const env = { ...process.env, BISE_HOME: home, STACK_BISE: bise };
  const ctl = (args: string[]) => spawnSync(bise, ["computer-use", ...args], { encoding: "utf8", env });
  const status = (): Status => {
    const r = ctl(["status"]);
    try { return JSON.parse(r.stdout); } catch { return { raw: r.stdout + r.stderr }; }
  };
  const connected = () => (status().browsers || []).filter((x) => x.connected).length;

  // the broker first, so the host and the agents find it
  const broker = spawn(bise, ["computer-use", "broker", ...brokerArgs], { env, stdio: "ignore" });
  await sleep(500);

  let b: Browser | null = null, ext: Ext | null = null;
  const all: Browser[] = [];
  /** One more browser (its own throwaway profile, like a second Chrome profile); it becomes `b`. */
  const startBrowser = async () => {
    const before = connected();
    // harness.launch writes a fake host; overwrite it with the real one
    const nb = await launch({ browser, brokerPort: 0, startUrl: "about:blank" });
    b = nb;
    const hostSh = path.join(nb.profile, "host.sh");
    writeFileSync(hostSh, ["#!/bin/bash", `export BISE_HOME="${home}"`, `exec "${bise}" computer-use chrome-host "$@"`, ""].join(NL), { mode: 0o755 });
    writeFileSync(path.join(nb.profile, "NativeMessagingHosts", "dev.bise.computer_use.json"), JSON.stringify({
      name: "dev.bise.computer_use", description: "bise computer use (stack)", path: hostSh, type: "stdio",
      allowed_origins: [`chrome-extension://${EXT_ID}/`],
    }));
    const ne = await loadExtension(nb);
    ext = ne;
    if (ne.id !== EXT_ID) throw new Error(`extension id ${ne.id}, expected ${EXT_ID}`);
    all.push(nb);
    for (let i = 0; i < 50 && connected() <= before; i++) await sleep(200);
    if (connected() <= before) throw new Error("the extension never reached the broker");
    return { b: nb, ext: ne };
  };

  /** C3 as one agent (or as `bise computer-use`: name null, the ctl role): call(op, args) resolves to {ok, result|error, ms}. */
  const agent = async (name: string | null): Promise<Agent> => {
    const sock = net.connect(path.join(home, "run", "computer-use.sock"));
    await new Promise((res, rej) => { sock.once("connect", res); sock.once("error", rej); });
    let buf = "", id = 0;
    // a broker line as it comes (JSON): ok with its result, or an error
    type Wire = { id?: number } & ({ ok: true; result: CallResult } | { ok: false; error: ReplyError });
    const pending = new Map<number | undefined, (m: Wire) => void>();
    sock.on("data", (d) => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf(NL)) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        let m: Wire;
        try { m = JSON.parse(line); } catch { continue; }
        const f = pending.get(m.id);
        if (f) { f(m); pending.delete(m.id); }
      }
    });
    sock.on("close", () => {
      for (const f of pending.values()) f({ ok: false, error: { code: "closed", message: "the broker closed the connection" } });
      pending.clear();
    });
    const hello = name === null ? { op: "hello", role: "ctl" } : { op: "hello", agent: name, session: "s", tmpdir: process.env.TMPDIR || "/tmp" };
    sock.write(JSON.stringify(hello) + NL);
    return {
      call(op: string, args: object = {}) {
        const n = ++id, t0 = Date.now();
        return new Promise<CallReply>((res) => {
          pending.set(n, (m) => res(m.ok === true ? { ok: true, result: m.result, ms: Date.now() - t0 } : { ok: false, error: m.error, ms: Date.now() - t0 }));
          sock.write(JSON.stringify({ id: n, op, args }) + NL);
        });
      },
      close: () => sock.destroy(),
    };
  };

  /** C6 events.jsonl, parsed. */
  const events = (): StackEvent[] => {
    const f = path.join(home, "run", "computer-use", "events.jsonl");
    if (!existsSync(f)) return [];
    return readFileSync(f, "utf8").split(NL).filter(Boolean).map((l): StackEvent => JSON.parse(l));
  };

  const stop = async () => {
    for (const x of all) await x.quit();
    ctl(["stop", "--all"]);
    try { broker.kill("SIGTERM"); } catch { /* gone */ }
    // the brokers and hosts this stack started
    spawnSync("pkill", ["-f", `BISE_HOME=${home}`]);
    rmSync(home, { recursive: true, force: true });
  };

  const stack = {
    home, env, status, connected, agent, events, ctl, stop, startBrowser,
    // set by the startBrowser below, before the stack is returned
    get b(): Browser { if (!b) throw new Error("no browser started"); return b; },
    get ext(): Ext { if (!ext) throw new Error("no browser started"); return ext; },
    /** The browser dies at once (quit, crash): SIGKILL, no goodbye to the host. */
    async killBrowser(which: Browser | null = b) {
      try { which?.proc.kill("SIGKILL"); } catch { /* gone */ }
      await sleep(300);
    },
  };
  try {
    await startBrowser();
  } catch (e) {
    await stop();
    throw e;
  }
  return stack;
}
