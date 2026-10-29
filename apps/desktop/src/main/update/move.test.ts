import { describe, expect, it } from 'vitest';
import { asksMove, declinedText, movable, readDeclined, testAnswer } from './move';

describe("'Move to Applications' (apple-signing ag-move)", () => {
  it('moving fixes a disk image, a translocated copy, a read-only folder outside Applications', () => {
    expect(movable('disk_image', '/Volumes/bise/bise.app', '/Users/g')).toBe(true);
    expect(movable('translocated', '/private/var/folders/x/AppTranslocation/1/d/bise.app', '/Users/g')).toBe(true);
    expect(movable('read_only', '/Users/g/Downloads/ro/bise.app', '/Users/g')).toBe(true);
    expect(movable('read_only', '/Applications/bise.app', '/Users/g')).toBe(false);
    expect(movable('read_only', '/Users/g/Applications/bise.app', '/Users/g/')).toBe(false);
    expect(movable(null, '/Users/g/Downloads/bise.app', '/Users/g')).toBe(false);
  });

  it("asks once per build: 'Not now' is kept for that build, a new build asks again", () => {
    expect(asksMove(true, 'd25', null)).toBe(true);
    expect(asksMove(true, 'd25', 'd25')).toBe(false);
    expect(asksMove(true, 'd26', 'd25')).toBe(true);
    expect(asksMove(false, 'd25', null)).toBe(false);
    expect(asksMove(true, null, null)).toBe(false);
  });

  it("move.json: the build he said 'Not now' to; junk is none", () => {
    expect(readDeclined(declinedText('d25'))).toBe('d25');
    expect(readDeclined('{')).toBeNull();
    expect(readDeclined('{"declined":""}')).toBeNull();
    expect(readDeclined('{"declined":3}')).toBeNull();
  });

  it("a test run answers 'move' only when it says so", () => {
    expect(testAnswer('move')).toBe('move');
    expect(testAnswer(undefined)).toBe('not_now');
    expect(testAnswer('yes')).toBe('not_now');
  });
});
