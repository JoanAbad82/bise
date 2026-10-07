// Every unit test starts with an empty keep (src/app/keep.ts): the window's keep is one per
// renderer, so without this a panel one test opened (or a field it typed in) would open the next
// test's too. Owner: amb-win.
import { afterEach } from 'vitest';
import { keep } from '@/app/keep';

afterEach(() => {
  keep.clear();
});
