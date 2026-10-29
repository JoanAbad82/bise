import { afterEach, describe, expect, it } from 'vitest';
import { onOpenInbox } from '@/inbox/Block';
import { inboxFromMenu } from './inboxAsk';
import type { Route } from './route';

// native/mac-keys on 2c9d55b56: Settings…, then Go › Inbox drew nothing. Since bise fait mac a
// screen like settings mounts no inbox block, and ⌘I only opened the block in place.
describe('Go › Inbox (⌘I) from the menu', () => {
  let off: (() => void) | null = null;
  afterEach(() => {
    off?.();
    off = null;
  });

  it('with no block on the screen, goes to the inbox place', () => {
    const went: Route[] = [];
    inboxFromMenu((to) => went.push(to));
    expect(went).toEqual([{ screen: 'inbox' }]);
  });

  it('with a block that opens an item, opens it in place and goes nowhere', () => {
    off = onOpenInbox(() => true);
    const went: Route[] = [];
    inboxFromMenu((to) => went.push(to));
    expect(went).toEqual([]);
  });
});
