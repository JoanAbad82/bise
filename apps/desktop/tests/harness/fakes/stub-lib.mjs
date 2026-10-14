// The line relay both stubs share (helper-stub.mjs, core-stub.mjs): a child process of the app that
// speaks JSON lines like the real one and is scripted by a test.
//   start lines  written to stdout at once (the hello, a fixture world)
//   socket       every line a test writes to the unix socket goes to stdout (an event each)
//   stdin        every line the app writes (a command) is appended to the log file, so the test
//                reads what the app asked for: an effect outside the app
//   exit         on a line whose cmd is `quitCmd`, or when stdin closes
//   rpc          (the core stub) JSON-RPC like `ambient-core` (bise_proto::app_rpc): initialize
//                answered, the start lines and every event held until `initialized`, then each as its
//                notification; a request answered {} and logged as the command it carries
//                ({cmd, ...params}), so a test reads the same log either way
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
 * The JSON-RPC side of the core stub: `hubEvs`, the HubEv tags (hub/<tag>; every other event is
 * core/<tag>). Returns the event writer and the stdin reader.
 */
function rpcSide(write, hubEvs) {
  let ready = false;
  const held = [];
  // FakeCore.refuse: the next request for that command (and card) gets this error, as the real
  // core answers a hub's refusal to that very request (architect m_23524)
  const refusals = [];
  const note = (line) => {
    let ev;
    try { ev = JSON.parse(line); } catch { return write(line); /* a test's raw line, as is */ }
    if (typeof ev?.ev !== 'string') return write(line);
    const { ev: tag, ...params } = ev;
    write(JSON.stringify({ jsonrpc: '2.0', method: `${hubEvs.includes(tag) ? 'hub' : 'core'}/${tag}`, params }));
  };
  return {
    out: (line) => (ready ? note(line) : held.push(line)),
    refuse: (r) => refusals.push(r),
    // a stdin message -> the command it carries (null: none), after answering it
    take(m) {
      if (m.method === 'initialize') { write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { proto: 1, methods: [], notifications: [] } })); return null; }
      if (m.method === 'initialized') { ready = true; for (const l of held.splice(0)) note(l); return null; }
      if (typeof m.method !== 'string' || m.id === undefined) return null;
      const cmd = { cmd: m.method.slice(m.method.indexOf('/') + 1), ...(m.params ?? {}) };
      const i = refusals.findIndex((r) => r.cmd === cmd.cmd && (r.card === undefined || r.card === cmd.card));
      if (i >= 0) {
        const [r] = refusals.splice(i, 1);
        write(JSON.stringify({ jsonrpc: '2.0', id: m.id, error: { code: -32001, message: r.message } }));
      } else write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: r0(cmd) }));
      return cmd;
    },
  };
}

/** A request's result: card/answer's AnswerResult when a test set one (FakeCore.answers), else {}. */
let answersBy = [];
const r0 = (cmd) => answersBy.find((a) => a.cmd === cmd.cmd && a.card === cmd.card)?.result ?? {};

/**
 * answer(cmd): the lines to write back for a command the app sent (a fake core answering a
 * subscribe). rpc: { hubEvs } to speak JSON-RPC (the core stub).
 */
export function runStub({ start = [], sock, log, quitCmd, answer, rpc }) {
  const write = (line) => process.stdout.write(line + NL);
  const side = rpc ? rpcSide(write, rpc.hubEvs) : null;
  const out = side ? side.out : write;
  for (const l of start) out(typeof l === 'string' ? l : JSON.stringify(l));
  // a test's {"harness":"exit","code":n} line ends this process with that code (a core that
  // stops: the app restarts it, amb-win's app/keep); any other line goes out as is
  const relay = (line) => {
    if (line.startsWith('{"harness":"refuse"') || line.startsWith('{"harness":"result"')) {
      try {
        const r = JSON.parse(line);
        if (r.harness === 'refuse') side?.refuse(r);
        else answersBy = [...answersBy, r];
      } catch { /* a broken line: nothing */ }
      return;
    }
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
    let cmd;
    try { cmd = JSON.parse(line); } catch { if (log) appendFileSync(log, line + NL); return; /* not JSON: logged as is */ }
    if (side) cmd = side.take(cmd);
    if (cmd === null) return;
    if (log) appendFileSync(log, (side ? JSON.stringify(cmd) : line) + NL);
    if (quitCmd && cmd.cmd === quitCmd) quit();
    if (answer) for (const l of answer(cmd)) out(typeof l === 'string' ? l : JSON.stringify(l));
  });
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => s.push(d));
  process.stdin.on('end', () => { s.end(); quit(); });
}
