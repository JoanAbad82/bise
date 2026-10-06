// His clipboard is never written by a check (amb-mac's fence, 2aa0294d): the general pasteboard's
// changeCount, read before and after a run, must not move. Read only (pasteboard.swift).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SOURCE = path.join(__dirname, 'pasteboard.swift');
const BINARY = path.resolve(__dirname, '../../../.harness-cache/qa-pasteboard-count');

export function pasteboardCount(): number {
  if (!existsSync(BINARY) || statSync(BINARY).mtimeMs < statSync(SOURCE).mtimeMs) {
    mkdirSync(path.dirname(BINARY), { recursive: true });
    execFileSync('/usr/bin/swiftc', ['-O', SOURCE, '-o', BINARY], { stdio: 'ignore' });
  }
  return Number(execFileSync(BINARY, { encoding: 'utf8' }).trim());
}
