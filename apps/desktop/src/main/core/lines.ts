// The core's stdio lines (pure): its stdout cut into lines (chunks come in
// at any boundary, a line is only given out once its newline arrived), and
// JSON-RPC both ways (client-protocol step 6, bise_proto::app_rpc: the
// names come from src/proto/app_methods.gen.ts).
import { HUB_CMDS, INITIALIZE, INITIALIZED, NO_LOG, PROTO } from '../../proto/app_methods.gen';

/**
 * The log line of a core line that is not one of the protocol (its first
 * 200 characters). A line that names a never-logged method or event (a
 * computer use still, a key, a shot: app_rpc's NO_LOG, S29's one rule) says
 * its size only, never its text: a broken one may hold the bytes.
 */
export function notAnEventLog(line: string): string {
  const secret = noLog(line);
  if (secret !== null) {
    return `core: not an event: a ${secret} line (${String(line.length)} bytes, not logged)`;
  }
  return `core: not an event: ${line.slice(0, 200)}`;
}

/** The NO_LOG name a line names (by method or bare tag, or a still's "shot"), else null. */
function noLog(line: string): string | null {
  // a whole name first: a still's line holds "shot" too
  const named = NO_LOG.find((n) => line.includes(n)) ?? NO_LOG.find((n) => line.includes(n.slice(n.indexOf('/') + 1)));
  if (named !== undefined) return named;
  return line.includes('"shot"') ? 'core/computer_peek' : null;
}

/** The line feed (named: one JSON object per line both ways). */
export const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);

export class LineSplitter {
  private rest = '';

  /** The complete lines in `chunk` (with what was held before), without their newline. */
  feed(chunk: string): string[] {
    const parts = (this.rest + chunk).split(NL);
    this.rest = parts.pop() ?? '';
    return parts.map((l) => (l.endsWith(CR) ? l.slice(0, -1) : l));
  }

  /** What is held without a newline yet (dropped at the core's exit). */
  get pending(): string {
    return this.rest;
  }
}

/** A request's id: this app's are numbers, from 0 (initialize) per run. */
export type RpcId = number;

/** What one line of the core is. */
export type CoreLine =
  | { readonly kind: 'event'; readonly ev: Record<string, unknown> }
  | { readonly kind: 'answer'; readonly id: RpcId | null; readonly result: unknown; readonly error: RpcErr | null };
/** A response's error: its code, words, and typed `data` (a send's `reason`: architect m_34889) as it came. */
export interface RpcErr {
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * One line of the core (JSON-RPC, bise_proto::app_rpc): a notification
 * `core/<tag>` or `hub/<tag>` as the event `{ev: tag, ...params}` the store
 * reads, or the answer to one of our requests; null: neither (the caller
 * logs it). An event's shape is checked by the store, not here.
 */
export function readLine(line: string): CoreLine | null {
  if (line.trim() === '') return null;
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isObj(v) || v['jsonrpc'] !== '2.0') return null;
  const method = v['method'];
  if (typeof method === 'string') {
    const slash = method.indexOf('/');
    const family = method.slice(0, slash);
    if (slash < 0 || (family !== 'core' && family !== 'hub') || 'id' in v) return null;
    const params = v['params'] ?? {};
    if (!isObj(params)) return null;
    return { kind: 'event', ev: { ...params, ev: method.slice(slash + 1) } };
  }
  if (!('result' in v) && !('error' in v)) return null;
  const id = typeof v['id'] === 'number' ? v['id'] : null;
  const e = v['error'];
  const error = isObj(e) ? { code: typeof e['code'] === 'number' ? e['code'] : 0, message: typeof e['message'] === 'string' ? e['message'] : '', ...(isObj(e['data']) ? { data: e['data'] } : {}) } : null;
  return { kind: 'answer', id, result: v['result'] ?? null, error };
}

/**
 * A command from the renderer as one request line for the core's stdin: an
 * object with a string `cmd`, else null (refused, never written). Its method
 * is `hub/<cmd>` for a project's hub's command with its project, else
 * `core/<cmd>` (app_rpc.rs method_of); its params, its other fields.
 */
export function requestOf(id: RpcId, cmd: unknown): { readonly line: string; readonly method: string } | null {
  if (!isObj(cmd)) return null;
  const { cmd: tag, ...params } = cmd;
  if (typeof tag !== 'string') return null;
  const project = params['project'] !== undefined && params['project'] !== null;
  const method = `${project && (HUB_CMDS as readonly string[]).includes(tag) ? 'hub' : 'core'}/${tag}`;
  return { line: JSON.stringify({ jsonrpc: '2.0', id, method, params }) + NL, method };
}

/** The first line of a run: who the app is; the core answers what it serves. */
export function initializeLine(version: string): string {
  return JSON.stringify({ jsonrpc: '2.0', id: 0, method: INITIALIZE, params: { proto: PROTO, client: { name: 'bise-desktop', version } } }) + NL;
}

/** After initialize's result: the core sends its events from here. */
export const INITIALIZED_LINE = JSON.stringify({ jsonrpc: '2.0', method: INITIALIZED }) + NL;

/** The log line of a refused request: its method and the core's words, a never-logged one's name only. */
export function refusedLog(method: string, error: { readonly code: number; readonly message: string }): string {
  if ((NO_LOG as readonly string[]).includes(method)) return `core: ${method} refused (${String(error.code)})`;
  return `core: ${method} refused (${String(error.code)}): ${error.message.slice(0, 200)}`;
}
