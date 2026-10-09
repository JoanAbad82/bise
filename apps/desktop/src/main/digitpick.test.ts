import { describe, expect, it } from 'vitest';
import { emptyField } from './digitpick';

const editable = (text: string, chip = false) => ({ isContentEditable: true, tagName: 'DIV', textContent: text, querySelector: () => (chip ? {} : null) });

describe('emptyField (a digit picks in a pushed card only when he is not writing: lead m_14146)', () => {
  it('nothing focused, or a button / the body: a digit picks', () => {
    expect(emptyField(null)).toBe(true);
    expect(emptyField({ tagName: 'BUTTON' })).toBe(true);
    expect(emptyField({ tagName: 'BODY', isContentEditable: false })).toBe(true);
  });
  it('an empty composer (contenteditable, its empty paragraph) or empty input: a digit picks', () => {
    expect(emptyField(editable('  \n'))).toBe(true);
    expect(emptyField({ tagName: 'INPUT', value: '' })).toBe(true);
    expect(emptyField({ tagName: 'TEXTAREA', value: ' ' })).toBe(true);
  });
  it('words, or only a chip, in the composer: the digit types', () => {
    expect(emptyField(editable('je veux'))).toBe(false);
    expect(emptyField(editable('', true))).toBe(false);
    expect(emptyField({ tagName: 'INPUT', value: 'abc' })).toBe(false);
  });
});
