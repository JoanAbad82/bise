// A demo tip (bar L25 / S37): the tour's words in one dim line, its keys drawn as keys. Where it
// sits (at the first demo agent, at the top of its thread, above the inbox card) is the screen's.
// Pure. Owner: amb-kit (src/setup).
import { Kbd } from '@/ds';
import { tipText, type Snap, type Tip as TipKind } from './tour';

export function Tip({ tip, snap }: { tip: TipKind; snap: Snap }) {
  return (
    <div className="setup-tip" role="note" data-testid={`setup.tip.${tip}`}>
      {tipText(tip, snap).map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : <Kbd key={i}>{p.key}</Kbd>))}
    </div>
  );
}
