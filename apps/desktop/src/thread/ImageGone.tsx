// An image of his old message that bise's image store deleted (D14, docs/images.md "Retention",
// designer m_23410, m_32899, m_32911): its chip keeps the no-file look (1 px --c-line, r 9, the
// faint no-file glyph in place of the 16 px thumb), then 'image 1 · deleted · kept 7 days' in
// text-3 and ' · settings', a link (text-2, underlined on hover, pointer, its tip 'settings ›
// context and privacy') that opens settings › privacy (the kept row). Never a broken image or an empty box of the old size. The check is the store file's load
// (its thumbnail): a store image that doesn't load is deleted. The words state today's rule, never
// the one it went by (no record per image, architect m_31909): his setting now
// (bise_home::prefs::keep_days, 7 when unset, what settings › privacy shows).
import { useCallback, useContext, useState, type ReactNode } from 'react';
import { Chip, Press } from '@/ds';
import { RouterContext } from '@/app/router';
import { settings, thread } from '@/proto/words.gen';
import { usePrefs } from '@/store';
import { AttachChip } from './AttachChip';
import { Thumb } from './rows-cards';

/** His setting (prefs shots_keep_days), 7 when unset or not a number of at least 1. Pure. */
export function keepDays(prefs: unknown): number {
  const v = prefs !== null && typeof prefs === 'object' ? (prefs as Record<string, unknown>)['shots_keep_days'] : undefined;
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 ? v : 7;
}

/** 'deleted · kept 7 days' (bise-proto's words). Pure. */
export function deletedWords(days: number): string {
  return thread.image_deleted({ days: settings.days({ n: days }) });
}

/**
 * One image of his sent bubble: the attachment chip (a click previews, a right-click shows it in
 * Finder) drawn from its store file when it has one, else from where he took it; deleted from the
 * store, the no-file chip and its words.
 */
export function PartImageChip({ path, store, lit, on, testId, children }: { path: string; store: string; lit: boolean; on: { onHover?: (over: boolean) => void }; testId: string; children: ReactNode }) {
  const [deleted, setDeleted] = useState(false);
  const gone = useCallback(() => {
    if (store !== '') setDeleted(true);
  }, [store]);
  const days = keepDays(usePrefs());
  const router = useContext(RouterContext);
  if (deleted) {
    return (
      <Chip kind="part" of="image" thumb={<Thumb />} testId={testId}>
        {children}
        <span className="th-attach-sep"> · </span>
        <span className="th-image-deleted" data-testid={`${testId}.deleted`}>
          {deletedWords(days)}
        </span>
        <span className="th-attach-sep"> · </span>
        <Press
          look="th-image-settings"
          title={`${thread.image_deleted_settings} › ${settings.page_privacy}`}
          onClick={() => {
            router?.go({ screen: 'settings', page: 'privacy' });
          }}
          data-testid={`${testId}.settings`}
        >
          {thread.image_deleted_settings}
        </Press>
      </Chip>
    );
  }
  const shown = store !== '' ? store : path;
  return (
    <AttachChip of="image" path={shown} missing={false} thumb={<Thumb path={shown} onGone={gone} />} lit={lit} {...on} testId={testId}>
      {children}
    </AttachChip>
  );
}
