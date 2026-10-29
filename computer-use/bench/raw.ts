#!/usr/bin/env node
// Wave 2 smoke: the raw `computer.*` tools through the real MCP server
// (`bise computer-use mcp`), the real broker, native host and extension.
// Run it inside stack.ts (it needs the stack's BISE_HOME):
//   node --experimental-strip-types computer-use/bench/stack.ts --bise <bise> -- node --experimental-strip-types computer-use/bench/raw.ts
// No bend-jsrt needed: it speaks MCP itself (the SDK on top has its own tests).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { servePages } from "../extension/test/harness.ts";

const bise = process.env.STACK_BISE || "bise";
const env = { ...process.env, SB_AGENT: "cu-smoke" };
const mcp = spawn(bise, ["computer-use", "mcp"], { env, stdio: ["pipe", "pipe", "inherit"] });
const lines = createInterface({ input: mcp.stdout });
/** One JSON-RPC answer of the MCP server. */
type RpcReply = { id?: number; result?: { content?: { text?: string }[]; isError?: boolean; tools?: { name: string }[] }; error?: unknown };
/** A tool's answer (its text, parsed): the fields these checks read. */
type Body = {
  ok?: boolean; target?: string; text?: string; refs?: number; summary?: string; changed?: string;
  path?: string; mime?: string; width?: number; height?: number; browsers?: { connected: boolean }[];
  error?: { code?: string; summary?: string; candidates?: unknown[] };
};
const waiting = new Map<number | undefined, (m: RpcReply) => void>();
lines.on("line", (l) => {
  const m: RpcReply = JSON.parse(l);
  const f = waiting.get(m.id);
  if (f) { f(m); waiting.delete(m.id); }
});
let n = 0;
const rpc = (method: string, params: object) => new Promise<RpcReply>((res) => {
  const id = ++n;
  waiting.set(id, res);
  mcp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
});
// T: what the tool's text holds (JSON), read by the check that asked
const call = async <T = Body>(name: string, args: object) => {
  const t = Date.now();
  const r = await rpc("tools/call", { name, arguments: args });
  const text = r.result?.content?.[0]?.text ?? JSON.stringify(r.error);
  // not JSON: the text itself, which every check's ?. reads as a miss
  let body: T; try { body = JSON.parse(text); } catch { body = JSON.parse(JSON.stringify(text)); }
  return { isError: !!r.result?.isError, body, ms: Date.now() - t };
};

const checks: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: unknown, info?: string) => { checks.push({ name, ok: !!ok }); console.log(`${ok ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };

const pages = await servePages();
try {
  await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "raw", version: "0" } });
  mcp.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  const listed = (await rpc("tools/list", {})).result?.tools;
  if (!listed) throw new Error("tools/list gave no tools");
  const tools = listed.map((t) => t.name).sort();
  check("7 tools", tools.length === 7, tools.join(","));

  const st = await call("status", {});
  check("status: a browser connected", st.body.browsers?.some((b) => b.connected));

  const o = await call("open", { url: pages.base + "form.html" });
  const target = o.body.target;
  check("open: a background tab", /^tab:\d+$/.test(target || ""), `${o.ms} ms`);

  const s = await call("snapshot", { target });
  check("snapshot: C2 text with refs", s.body.text?.startsWith("# Test shop") && (s.body.refs ?? 0) > 5, `${s.body.refs} refs, ${s.ms} ms`);
  check("snapshot: password masked", !String(s.body.text).includes("hunter2"));

  const c = await call("act", { target, action: "click", locator: { role: "button", name: "Add to cart" } });
  check("click by role+name", c.body.ok && /clicked "Add to cart"/.test(c.body.summary || ""), `${c.ms} ms · ${c.body.summary}`);
  check("click: under a second (focus emulation)", c.ms < 1000);

  const f = await call("act", { target, action: "fill", locator: { role: "textbox", name: "Email" }, text: "ana@example.com" });
  check("fill", f.body.ok, f.body.summary);

  // passwords are the user's (ship plan §6): refused on any site, by ref or focus
  const pw = await call("act", { target, action: "fill", locator: { label: "Password" }, text: "x" });
  check("fill a password field: refused", pw.body.error?.code === "refused" && /passwords himself/.test(pw.body.error?.summary || ""), pw.body.error?.summary);

  const r = await call("act", { target, action: "read", locator: { text: "bought 1" } });
  check("the click landed (read)", r.body.ok && /bought 1/.test(r.body.changed || ""), r.body.changed);

  const nf = await call("act", { target, action: "click", locator: { role: "button", name: "Nope" }, timeout_ms: 500 });
  check("not_found is a normal result with candidates", !nf.isError && nf.body.error?.code === "not_found" && (nf.body.error?.candidates?.length ?? 0) > 0);
  check("not_found carries a summary", typeof nf.body.error?.summary === "string", nf.body.error?.summary);

  const amb = await call("act", { target, action: "click", locator: { role: "button", name: "More" }, timeout_ms: 500 });
  check("ambiguous", amb.body.error?.code === "ambiguous");

  const sh = await call("screenshot", { target });
  check("screenshot: a JPEG file in TMPDIR", sh.body.path && existsSync(sh.body.path) && sh.body.mime === "image/jpeg", `${sh.body.width}x${sh.body.height}, ${sh.ms} ms`);

  const tabs = await call<Body[]>("tabs", {});
  check("tabs: only this agent's", Array.isArray(tabs.body) && tabs.body.length === 1 && tabs.body[0].target === target);

  const ref = await call("open", { url: "chrome://settings" });
  check("refused: chrome://", ref.body.error?.code === "refused");

  const cl = await call("act", { target, action: "close" });
  check("close", cl.body.ok);
} catch (e) {
  check("no exception", false, e instanceof Error ? e.stack : String(e));
} finally {
  pages.close();
  mcp.kill();
}
const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed}/${checks.length} checks`);
process.exit(failed ? 1 : 0);
