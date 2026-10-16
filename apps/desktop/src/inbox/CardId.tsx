// A notification's number, the hub's card id ('#567', what sb notify prints), so he can find the one
// main names (notif-id, designer m_27855): mono, text-3, 12 px, last on a meta line, never cut; the
// tip says what it is. Not on the macOS banner or the capsule's quick card (they show for seconds).
import { inbox } from '@/proto/words_inbox.gen';
import './inbox.css';

export function CardId({ id, lead = true, testId }: { id: number; lead?: boolean; testId?: string }) {
  // bise's own items (the notifications prompt, id -1) have no hub number
  if (id < 0) return null;
  return (
    <span className="card-id" title={inbox.card_id_tip({ id })} data-testid={testId}>
      {lead && ' · '}
      <span className="card-id-n">{inbox.card_id({ id })}</span>
    </span>
  );
}

