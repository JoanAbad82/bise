#!/usr/bin/env node
// The scripted core (tests/harness/fakes/core-stub.mjs) that panics once, as the Rust core does: its
// first run writes a Rust panic on stderr 1.5 s after it starts and exits 101; the run main starts
// after it (a marker file next to the stub's log says it already panicked) stays up. Same env as
// the stub (FakeCore's). For app/core-line.
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const marker = path.join(path.dirname(process.env.BISE_HARNESS_CORE_LOG ?? '.'), 'panicked');
const first = !existsSync(marker);
await import('../../../harness/fakes/core-stub.mjs');
if (first) {
  writeFileSync(marker, '1');
  setTimeout(() => {
    process.stderr.write("thread 'main' panicked at rust/core/src/hub.rs:212:9:\nno hub for acme: the workspace moved\nnote: run with `RUST_BACKTRACE=1` environment variable to display a backtrace\n");
    process.exit(101);
  }, 1500);
}
