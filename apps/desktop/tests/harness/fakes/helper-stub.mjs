#!/usr/bin/env node
// The scripted stand-in for bise-mac-helper in a test run (src/main/helper/run.ts spawns whatever
// BISE_DESKTOP_HELPER names; without it a test run has no helper). It never taps keys, reads a
// front app or opens the mic: it speaks the frozen lines of rust/proto/src/helper.rs and nothing else.
//   stdout  hello first, then every line a test sends to the control socket (an HelperEv each)
//   stdin   the app's commands (HelperCmd), appended as JSON lines to the log file, so a test reads
//           what the app asked for (an effect outside the app); {"cmd":"quit"} or stdin closed = exit
// env: BISE_HARNESS_HELPER_SOCK  the unix socket a test writes events to (one JSON line each)
//      BISE_HARNESS_HELPER_LOG   the file the commands go to
import { appendFileSync, rmSync } from 'node:fs';
import net from 'node:net';

const sock = process.env.BISE_HARNESS_HELPER_SOCK;
const log = process.env.BISE_HARNESS_HELPER_LOG;
const out = (line) => process.stdout.write(`${line}\n`);

out(JSON.stringify({ ev: 'hello', proto: 1, version: '0.0.0-harness-stub', pid: process.pid }));

let server;
if (sock) {
  rmSync(sock, { force: true });
  server = net.createServer((c) => {
    let buf = '';
    c.setEncoding('utf8');
    c.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) out(line);
      }
    });
    c.on('end', () => { if (buf.trim()) out(buf.trim()); buf = ''; });
  });
  server.listen(sock);
}

const quit = () => {
  server?.close();
  if (sock) rmSync(sock, { force: true });
  process.exit(0);
};

let inBuf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => {
  inBuf += d;
  let i;
  while ((i = inBuf.indexOf('\n')) >= 0) {
    const line = inBuf.slice(0, i).trim();
    inBuf = inBuf.slice(i + 1);
    if (!line) continue;
    if (log) appendFileSync(log, `${line}\n`);
    try { if (JSON.parse(line).cmd === 'quit') quit(); } catch { /* not JSON: logged as is */ }
  }
});
process.stdin.on('end', quit);
