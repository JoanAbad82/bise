// The window an office or the town draws in (page town-live p6): whether it is away (hidden, or
// not in front outside the test harness; a check can say it lost focus with window.__biseBlur),
// whether it is night (the app's theme, else the system's), and the test mode. One rule for the
// minimap and the town: both stop drawing at once. Reads the DOM, decides nothing (loop.ts away). Owner: bims-wire.
import { away } from './loop';

export const testMode = (): boolean => (window as { bise?: { test?: boolean } }).bise?.test === true;

/** a check says the window lost focus (window.__biseBlur): the harness's window never has it, so focus only counts then */
const blurred = (): boolean => (window as { __biseBlur?: boolean }).__biseBlur === true;

export const awayNow = (): boolean => away({ hidden: document.hidden, focused: document.hasFocus() && !blurred(), test: testMode() && !blurred() });

export const nightNow = (): boolean => {
  const set = document.documentElement.dataset.theme;
  if (set !== undefined) return set === 'dark';
  return !(typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);
};
