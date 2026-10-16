// A notification's number typed in a search: '567' or '#567' (notif-id, designer m_27855). Pure.

/** '567' or '#567': that number, else null. */
export function idOf(q: string): number | null {
  const m = /^#?(\d+)$/u.exec(q.trim());
  return m === null ? null : Number(m[1]);
}
