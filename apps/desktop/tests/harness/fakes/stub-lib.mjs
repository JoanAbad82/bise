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

/** answer(cmd): the lines to write back for a command the app sent (a fake core answering a subscribe). */
export function runStub({ start = [], sock, log, quitCmd, answer }) {
  const out = (line) => process.stdout.write(line + NL);
  for (const l of start) out(typeof l === 'string' ? l : JSON.stringify(l));
  // a test's {"harness":"exit","code":n} line ends this process with that code (a core that
  // stops: the app restarts it, amb-win's app/keep); any other line goes out as is
  const relay = (line) => {
    if (line.startsWith('{"harness":"exit"')) {
      let code = 1;
      try { code = Number(JSON.parse(line).code ?? 1); } catch { /* the default */ }
      quit(code);
      return;
    }
    out(line);
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
  function quit(code = 0) {
    server?.close();
    if (sock) rmSync(sock, { force: true });
    process.exit(code);
  }
  const s = lines((line) => {
    if (log) appendFileSync(log, line + NL);
    let cmd;
    try { cmd = JSON.parse(line); } catch { return; /* not JSON: logged as is */ }
    if (quitCmd && cmd.cmd === quitCmd) quit();
    if (answer) for (const l of answer(cmd)) out(typeof l === 'string' ? l : JSON.stringify(l));
  });
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => s.push(d));
  process.stdin.on('end', () => { s.end(); quit(); });
}
