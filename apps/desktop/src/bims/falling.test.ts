import { describe, expect, it } from 'vitest';
import { fallingLook } from './falling';

const hull = [{ x: 40, y: 20 }, { x: 120, y: 30 }, { x: 100, y: 90 }, { x: 30, y: 70 }];

describe('what falls over the office', () => {
  it('nothing on a dry sky, under reduced motion, or before a size', () => {
    expect(fallingLook(null, 320, 200, false).kind).toBeNull();
    expect(fallingLook({ rain: 0, snow: 0, hull }, 320, 200, false).kind).toBeNull();
    expect(fallingLook({ rain: 1, snow: 0, hull }, 320, 200, true).kind).toBeNull();
    expect(fallingLook({ rain: 1, snow: 0, hull }, 0, 200, false).kind).toBeNull();
  });

  it('rain or snow at its density, the building cut out of the clip (never in the room)', () => {
    const l = fallingLook({ rain: 0.5, snow: 0, hull }, 320, 200, false);
    expect(l.kind).toBe('rain');
    expect(l.opacity).toBe(0.5);
    expect(l.clip).toBe("path(evenodd, 'M0 0H320V200H0ZM40 20L120 30L100 90L30 70Z')");
    expect(fallingLook({ rain: 0, snow: 1, hull }, 320, 200, false).kind).toBe('snow');
  });
});
