// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clipKey, installClipFence, type ClipFence, type WinLike } from './clipfence';

// happy-dom's globals, typed only as far as these tests use them (src/main
// type-checks without the DOM library)
interface Ev {
  readonly defaultPrevented: boolean;
  readonly clipboardData?: { setData(t: string, v: string): void; getData(t: string): string } | null;
  preventDefault(): void;
}
interface El {
  focus(): void;
  dispatchEvent(e: Ev): boolean;
  addEventListener(type: string, l: (e: Ev) => void): void;
  setSelectionRange?(a: number, b: number): void;
}
interface Dom {
  readonly document: { body: { innerHTML: string }; getElementById(id: string): El };
  readonly KeyboardEvent: new (type: string, init: object) => Ev;
}
const dom = globalThis as unknown as Dom;
const win = globalThis as unknown as WinLike;

const key = (k: string, mods: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }> = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe('clipKey', () => {
  it('⌘C ⌘X ⌘V and ⌘⇧V on mac, Ctrl elsewhere', () => {
    expect(clipKey(key('c', { metaKey: true }), true)).toBe('copy');
    expect(clipKey(key('x', { metaKey: true }), true)).toBe('cut');
    expect(clipKey(key('v', { metaKey: true }), true)).toBe('paste');
    expect(clipKey(key('V', { metaKey: true, shiftKey: true }), true)).toBe('paste');
    expect(clipKey(key('c', { ctrlKey: true }), false)).toBe('copy');
  });

  it('leaves every other key alone', () => {
    expect(clipKey(key('c'), true)).toBeNull();
    expect(clipKey(key('c', { ctrlKey: true }), true)).toBeNull();
    expect(clipKey(key('c', { metaKey: true }), false)).toBeNull();
    expect(clipKey(key('c', { metaKey: true, altKey: true }), true)).toBeNull();
    expect(clipKey(key('C', { metaKey: true, shiftKey: true }), true)).toBeNull();
    expect(clipKey(key('a', { metaKey: true }), true)).toBeNull();
    expect(clipKey(key('z', { metaKey: true }), true)).toBeNull();
  });
});

describe('the fence', () => {
  let fence: ClipFence;
  let field: El;
  let seen: string[];

  beforeEach(() => {
    dom.document.body.innerHTML = '<div id="f" tabindex="0" contenteditable="true"></div>';
    field = dom.document.getElementById('f');
    field.focus();
    seen = [];
    fence = installClipFence(win, true);
  });

  afterEach(() => {
    fence.remove();
  });

  const press = (k: string): Ev => {
    const e = new dom.KeyboardEvent('keydown', { key: k, metaKey: true, bubbles: true, cancelable: true });
    field.dispatchEvent(e);
    return e;
  };

  it("⌘C is taken before anyone else sees the keydown, and the editor's copy fills the buffer", () => {
    field.addEventListener('keydown', () => seen.push('page keydown'));
    field.addEventListener('copy', (e) => {
      e.clipboardData?.setData('text/plain', 'p99 412 ms');
      e.clipboardData?.setData('text/html', '<b>p99</b> 412 ms');
      e.preventDefault();
      seen.push('copy');
    });
    const e = press('c');
    expect(e.defaultPrevented).toBe(true);
    expect(seen).toEqual(['copy']);
    expect(fence.formats().get('text/plain')).toBe('p99 412 ms');
    expect(fence.formats().get('text/html')).toBe('<b>p99</b> 412 ms');
  });

  it('⌘V hands the buffer to the editor as a paste event', () => {
    fence.put('bonjour «ça va»');
    let got: string | undefined;
    field.addEventListener('paste', (e) => {
      got = e.clipboardData?.getData('text/plain');
      e.preventDefault();
    });
    expect(press('v').defaultPrevented).toBe(true);
    expect(got).toBe('bonjour «ça va»');
  });

  it('⌘X goes to the editor as a cut event', () => {
    field.addEventListener('cut', (e) => {
      e.clipboardData?.setData('text/plain', 'cut me');
      e.preventDefault();
      seen.push('cut');
    });
    press('x');
    expect(seen).toEqual(['cut']);
    expect(fence.formats().get('text/plain')).toBe('cut me');
  });

  it('a copy nobody handles keeps the selected text of a plain field', () => {
    dom.document.body.innerHTML = '<textarea id="t">hello world</textarea>';
    const t = dom.document.getElementById('t');
    t.focus();
    t.setSelectionRange?.(6, 11);
    t.dispatchEvent(new dom.KeyboardEvent('keydown', { key: 'c', metaKey: true, bubbles: true, cancelable: true }));
    expect(fence.formats().get('text/plain')).toBe('world');
  });

  it('an empty copy keeps the last buffer', () => {
    fence.put('kept');
    press('c');
    expect(fence.formats().get('text/plain')).toBe('kept');
  });

  it('a seeded text and image paste with ⌘V alone (qa-type 2.4, 2.7)', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `line ${i + 1}`).join('\n');
    fence.seed({ text: lines, files: [{ name: 'shot.png', type: 'image/png', bytes: new Uint8Array([137, 80, 78, 71]) }] });
    let text: string | undefined;
    let file: { name: string; type: string; size: number } | undefined;
    field.addEventListener('paste', (e) => {
      const d = e.clipboardData as unknown as { getData(t: string): string; files: ArrayLike<{ name: string; type: string; size: number }> };
      text = d.getData('text/plain');
      file = d.files[0];
      e.preventDefault();
    });
    press('v');
    expect(text?.split('\n')).toHaveLength(200);
    expect(file).toMatchObject({ name: 'shot.png', type: 'image/png', size: 4 });
  });

  it('a copy replaces the seeded files', () => {
    fence.seed({ files: [{ name: 'a.png', type: 'image/png', bytes: new Uint8Array([1]) }] });
    fence.put('just text');
    let count = -1;
    field.addEventListener('paste', (e) => {
      count = (e.clipboardData as unknown as { files: ArrayLike<unknown> }).files.length;
      e.preventDefault();
    });
    press('v');
    expect(count).toBe(0);
  });

  it('other keys pass untouched', () => {
    field.addEventListener('keydown', () => seen.push('page keydown'));
    const e = new dom.KeyboardEvent('keydown', { key: 'a', metaKey: true, bubbles: true, cancelable: true });
    field.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(seen).toEqual(['page keydown']);
  });
});
