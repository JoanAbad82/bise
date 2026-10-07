#!/usr/bin/env node
// The scripted core (tests/harness/fakes/core-stub.mjs) that also says something on stderr first,
// as the real core logs its start: what main appends to userData/core.log, so setup/offline can
// check the window shows the core's last log line. Same env as the stub (FakeCore's).
process.stderr.write('bise core: listening on the fixture world (qa-native)\n');
await import('../../../harness/fakes/core-stub.mjs');
