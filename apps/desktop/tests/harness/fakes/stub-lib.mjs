// The line relay both stubs share (helper-stub.mjs, core-stub.mjs): a child process of the app that
// speaks JSON lines like the real one and is scripted by a test.
//   start lines  written to stdout at once (the hello, a fixture world)
//   socket       every line a test writes to the unix socket goes to stdout (an event each)
//   stdin        every line the app writes (a command) is appended to the log file, so the test
//                reads what the app asked for: an effect outside the app
//   exit         on a line whose cmd is `quitCmd`, or when stdin closes
import { appendFileSync, rmSync } from 'node:fs';
import net from 'node:net';

const NL = String.fromCharCode(10);

/** Splits a stream of chunks into lines, calling `on` for each non-empty one. */
function lines(on) {
  let buf = '';
  return {
    push(chunk) {
      buf += chunk;
      let i;
      while ((i = buf.indexOf(NL)) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) on(line);
      }
    },
    end() { if (buf.trim()) on(buf.trim()); buf = ''; },
  };
}

/**
 * hold: keep the start lines until the test asks for them with the control line
 * {"harness":"start"} on the socket (FakeCore does, once the main window has loaded: the app's
 * main forwards core events to the windows open at that moment and keeps none for later, so a
 * world sent at spawn was lost when the window loaded after it, amb-win m_9694).
 */
export function runStub({ start = [], sock, log, quitCmd, hold = false }) {
  const out = (line) => process.stdout.write(line + NL);
  const emitStart = () => { for (const l of start) out(typeof l === 'string' ? l : JSON.stringify(l)); };
  if (!hold) emitStart();
  const relay = (line) => {
    if (line === '{"harness":"start"}') emitStart();
    else out(line);
  };
  let server;
  if (sock) {
    rmSync(sock, { force: true });
    server = net.createServer((c) => {
      c.setEncoding('utf8');
      const s = lines(relay);
      c.on('data', (d) => s.push(d));
      c.on('end', () => s.end());
    });
    server.listen(sock);
  }
  const quit = () => {
    server?.close();
    if (sock) rmSync(sock, { force: true });
    process.exit(0);
  };
  const s = lines((line) => {
    if (log) appendFileSync(log, line + NL);
    try { if (quitCmd && JSON.parse(line).cmd === quitCmd) quit(); } catch { /* not JSON: logged as is */ }
  });
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => s.push(d));
  process.stdin.on('end', () => { s.end(); quit(); });
}
