// Does an artifact's page server answer (page-unreach, Benjamin's blank panel)? The page server
// lives in its project's hub: a hub that is stopped (idle-exit), starting or gone leaves the
// panel's frame on Chromium's 'refused' page, which the window can't read (another origin). So
// before framing a pages-server url, and before '↗ browser' opens one, main tries a TCP connect
// to its port. Only http://127.0.0.1:<port> is asked; any other url is not ours to judge: 'up'.
// Owner: page-unreach (the artifact view's reach, artifacts/reach.ts, reads it).
import { connect } from 'node:net';
import { isPagesFrame } from './framelink';

/** How long a connect may take before the server counts as not answering. */
export const PROBE_MS = 800;

export type Reach = 'up' | 'down';

/** Pure: the port of a pages-server url, else null (not ours to probe). */
export function probePort(raw: unknown): number | null {
  if (typeof raw !== 'string' || !isPagesFrame(raw)) return null;
  const u = new URL(raw);
  const port = Number(u.port === '' ? '80' : u.port);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : null;
}

/** A connect to 127.0.0.1:<port>: 'up' when it opens in `ms`, else 'down' (refused, timed out). */
export function connectProbe(port: number, ms = PROBE_MS): Promise<Reach> {
  return new Promise((resolve) => {
    const s = connect({ host: '127.0.0.1', port });
    let done = false;
    const end = (r: Reach) => {
      if (done) return;
      done = true;
      clearTimeout(t);
      s.destroy();
      resolve(r);
    };
    const t = setTimeout(() => {
      end('down');
    }, ms);
    s.once('connect', () => {
      end('up');
    });
    s.once('error', () => {
      end('down');
    });
  });
}

/** The IPC's answer for `raw`: a pages-server url is probed, anything else is 'up'. */
export function probePage(raw: unknown, probe: (port: number) => Promise<Reach> = connectProbe): Promise<Reach> {
  const port = probePort(raw);
  return port === null ? Promise.resolve('up') : probe(port);
}
