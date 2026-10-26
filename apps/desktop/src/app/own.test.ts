// A window of its own: its kind from the URL, and where it keeps its route (never the main window's).
import { describe, expect, it } from 'vitest';
import { ownOf, routeKeyOf } from './own';

describe('own windows', () => {
  it('reads its kind from the query, nothing for the main window', () => {
    // settings is a route of the main window (r2-settings), never a window of its own
    expect(ownOf('?surface=window&own=settings')).toBeUndefined();
    expect(ownOf('?surface=window&own=agent')).toBe('agent');
    expect(ownOf('?surface=window')).toBeUndefined();
    expect(ownOf('?own=nope')).toBeUndefined();
  });

  it("keeps the main window's route, and none for the others", () => {
    expect(routeKeyOf(undefined)).toBe('route');
    expect(routeKeyOf('agent')).toBeNull();
    expect(routeKeyOf('artifact')).toBeNull();
  });
});
