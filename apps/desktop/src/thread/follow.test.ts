import { describe, expect, it } from 'vitest';
import { followOpened } from './ThreadList';

// designer m_43996: a fold opened at the thread's end shows what it opened, the list still at its end
describe('followOpened', () => {
  it('all of it fits under the clicked row: down to the end, still stuck', () => {
    expect(followOpened(400, 120)).toEqual({ by: 120, stuck: true });
  });
  it('taller than the room above the row: the row at the top, the list no longer follows the end', () => {
    expect(followOpened(300, 900)).toEqual({ by: 300, stuck: false });
  });
  it('nothing below: nothing moves', () => {
    expect(followOpened(200, 0)).toEqual({ by: 0, stuck: true });
  });
  it('a row already above the view never pulls the list up', () => {
    expect(followOpened(-40, 200)).toEqual({ by: 0, stuck: false });
  });
});
