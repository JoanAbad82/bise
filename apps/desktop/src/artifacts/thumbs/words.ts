// The words on a picture: a file's size ('12.4 MB') and a video's or a sound's length ('0:04',
// '1:02:03'). Pure. Owner: art-thumbs.

/** A size as the no-preview tile says it: '812 B', '64 KB', '12.4 MB', '88 MB', '1.2 GB'. Pure. */
export function bytesWords(n: number): string {
  if (n < 1000) return `${String(n)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1000;
  let u = 0;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  const s = v < 100 ? String(Math.round(v * 10) / 10) : String(Math.round(v));
  return `${s} ${units[u] ?? 'TB'}`;
}

/** A length as the card's '▶ 0:04' says it: m:ss, or h:mm:ss from an hour (rounded, at least 0:01). Pure. */
export function secsWords(secs: number): string {
  const t = Math.max(1, Math.round(secs));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h > 0 ? `${String(h)}:${String(m).padStart(2, '0')}:${s}` : `${String(m)}:${s}`;
}
