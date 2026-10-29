// node --experimental-strip-types --test dev/plugins/ambient-qa/as-he-does/fx.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { fxDir, named, namesIn } from './fx.ts';

const WORLD = ['harness', 'ai-docs', 'folder-15'];
// try-gate-25e5's out dir: the two runs whose long reply went to harness
const AGENT_OUT = '/Users/g/.bise/hubs/harness-3abb2bd8/agents/try-gate-25e5/tmp/full';

test("an agent's tmp out dir names harness, as route.rs reads it", () => {
  assert.deepEqual(named(`${AGENT_OUT}/long-reply.md`, WORLD), ['harness']);
  assert.equal(namesIn('see harness_x', 'harness'), false);
  assert.equal(namesIn('the harnesses', 'harness'), false);
  assert.equal(namesIn('go to Harness.', 'harness'), true);
});

test('the files the words carry go under AS_HE_DOES_FX, which names no world project', () => {
  const fx = fxDir(AGENT_OUT, { AS_HE_DOES_FX: '/Users/g/.bise/gate/real-shape/fx' });
  assert.equal(fx, '/Users/g/.bise/gate/real-shape/fx');
  assert.deepEqual(named(`${fx}/long-reply.md`, WORLD), []);
  // unset: <out>, as before
  assert.equal(fxDir(AGENT_OUT, {}), AGENT_OUT);
});
