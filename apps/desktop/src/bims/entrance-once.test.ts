import { expect, it } from 'vitest';
import { entered, toEnter } from './entrance-once';

it('a banner enters the first time its page opens in a run, never again; each banner on its own', () => {
  expect(toEnter('inbox')).toBe(true);
  entered('inbox');
  expect(toEnter('inbox')).toBe(false);
  expect(toEnter('plugins')).toBe(true);
});
