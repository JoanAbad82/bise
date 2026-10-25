// A window of its own: its kind from the URL, and where it keeps its route (never the main window's).
import { describe, expect, it } from 'vitest';
import { ownOf, routeKeyOf } from './own';

describe('own windows', () => {
  it('reads its kind from the query, nothing for the main window', () => {
    expect(ownOf('?surface=window&own=settings')).toBe('settings');
    expect(ownOf('?surface=window&own=agent')).toBe('agent');
    expect(ownOf('?surface=window')).toBeUndefined();
    expect(ownOf('?own=nope')).toBeUndefined();
  });

  it("keeps the main window's route, settings' own, and none for the others", () => {
    expect(routeKeyOf(undefined)).toBe('route');
    expect(routeKeyOf('settings')).toBe('route.settings');
    expect(routeKeyOf('artifact')).toBeNull();
  });
});
