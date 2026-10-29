// The welcome's pins over the bims' pills (designer m_38798: the lead's '?' hid its '1').
import { describe, expect, it } from 'vitest';
import { liftPins } from './pins';

describe('liftPins', () => {
  const pill = { left: 100, top: 40, w: 20, h: 20 };

  it('a pin on a pill lifts to stop 4 px above it (its 18 px disc: its middle 13 px over the top)', () => {
    expect(liftPins([{ x: 110, y: 50 }], [pill])).toEqual([{ x: 110, y: 27 }]);
  });

  it('a pin clear of every pill stays; a pin off view stays off', () => {
    const away = { x: 200, y: 50 };
    const [a, b] = liftPins([away, null], [pill]);
    expect(a).toBe(away);
    expect(b).toBeNull();
  });

  it('lifted onto a second pill above the first: over that one too', () => {
    const upper = { left: 104, top: 10, w: 20, h: 20 };
    expect(liftPins([{ x: 110, y: 50 }], [upper, pill])).toEqual([{ x: 110, y: -3 }]);
  });
});
