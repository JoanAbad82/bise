import { describe, expect, it } from 'vitest';
import { fallingLook } from './falling';

const dry = { haze: 0, air: '#ffffff' };
const hull = [{ x: 40, y: 20 }, { x: 120, y: 30 }, { x: 100, y: 90 }, { x: 30, y: 70 }];

describe('what falls over the office', () => {
  it('nothing on a dry sky or before a size', () => {
    expect(fallingLook(null, 320, 200).kind).toBeNull();
    expect(fallingLook({ rain: 0, snow: 0, hull, ...dry }, 320, 200).kind).toBeNull();
    expect(fallingLook({ rain: 1, snow: 0, hull, ...dry }, 0, 200).kind).toBeNull();
  });

  it('fog: a haze of the air at its edges, none on a clear sky', () => {
    expect(fallingLook({ rain: 0, snow: 0, hull, haze: 0.8, air: '#e2e2de' }, 320, 200)).toMatchObject({ kind: null, haze: 0.6, air: '#e2e2de' });
    expect(fallingLook({ rain: 0, snow: 0, hull, ...dry }, 320, 200).haze).toBe(0);
  });

  it('rain or snow at its density, the building cut out of the clip (never in the room)', () => {
    const l = fallingLook({ rain: 0.5, snow: 0, hull, ...dry }, 320, 200);
    expect(l.kind).toBe('rain');
    expect(l.opacity).toBe(0.5);
    expect(l.clip).toBe("path(evenodd, 'M0 0H320V200H0ZM40 20L120 30L100 90L30 70Z')");
    expect(fallingLook({ rain: 0, snow: 1, hull, ...dry }, 320, 200).kind).toBe('snow');
  });
});
