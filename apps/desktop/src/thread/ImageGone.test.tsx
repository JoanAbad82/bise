import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { deletedWords, keepDays, PartImageChip } from './ImageGone';
import { storeImage, youView } from './parts';

describe('an image the store deleted (D14, designer m_23410)', () => {
  it('its store file sits beside its .b64', () => {
    expect(storeImage('/h/.bise/images/0123.b64', 'image/png')).toBe('/h/.bise/images/0123.png');
    expect(storeImage('/h/.bise/images/0123.b64', 'image/jpeg')).toBe('/h/.bise/images/0123.jpg');
    expect(storeImage('', 'image/png')).toBe('');
    expect(storeImage('/h/x.b64', 'text/plain')).toBe('');
  });
  it('a sent image part carries its store file', () => {
    const v = youView([{ kind: 'image', name: '[Image #1]', source: '/tmp/shot.png', mime: 'image/png', b64_file: '/s/ab.b64' }]);
    expect(v.images[0]?.store).toBe('/s/ab.png');
  });
  it('his setting: 7 when unset, his number else', () => {
    expect(keepDays(null)).toBe(7);
    expect(keepDays({})).toBe(7);
    expect(keepDays({ shots_keep_days: 30 })).toBe(30);
    expect(keepDays({ shots_keep_days: 0 })).toBe(7);
    expect(keepDays({ shots_keep_days: '30' })).toBe(7);
  });
  it('the words', () => {
    expect(deletedWords(7)).toBe('deleted · images are kept 7 days');
    expect(deletedWords(1)).toBe('deleted · images are kept 1 day');
  });
  it('a store image that does not load draws the no-file chip and its words, never a broken image', () => {
    const r = render(
      <PartImageChip path="/tmp/shot.png" store="/s/ab.png" lit={false} on={{}} testId="t.image.1">
        image 1
      </PartImageChip>,
    );
    const img = r.container.querySelector('img.thumb');
    expect(img).not.toBeNull();
    if (img !== null) fireEvent.error(img);
    expect(r.container.querySelector('img')).toBeNull();
    expect(r.getByTestId('t.image.1.deleted').textContent).toBe('deleted · images are kept 7 days');
    expect(r.getByTestId('t.image.1.settings').textContent).toBe('settings');
  });
});
