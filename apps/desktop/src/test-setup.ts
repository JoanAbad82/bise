// Every unit test starts with an empty keep (src/app/keep.ts): the window's keep is one per
// renderer, so without this a panel one test opened (or a field it typed in) would open the next
// test's too. Owner: amb-win.
// And no test keeps the event loop busy more than 20 s without a macrotask (src/test-busy.ts,
// gate-reds): one that does fails by its name instead of a whole run's 'Timeout calling
// onTaskUpdate' on a loaded machine.
import { afterEach, beforeEach } from 'vitest';
import { keep } from '@/app/keep';
import { busyFault, busyWatch } from '@/test-busy';

const busy = busyWatch();

beforeEach(() => {
  busy.reset();
});

afterEach((ctx) => {
  keep.clear();
  const f = busyFault(ctx.task.name, busy.worst());
  if (f !== null) throw new Error(f);
});
