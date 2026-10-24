// The office's small UI parts over the scene (office.css): a bim's name label, its '?' / '✗' pill
// and the '⤢ fit' chip. Office.tsx places them; the ds gallery (src/ds/gallery) draws them in each
// state. No state of their own. Owner: bims-wire.
import type { ReactNode, Ref } from 'react';
import { Press, tipAttrs } from '@/ds';
import { bims } from '@/proto/words_bims.gen';
import type { Label } from './model';
import './office.css';

/** A bim's line over its head: its name (dim while it walks: 'name'), or its name · its words. */
export function NameLabel({ name, mode, children }: { name: string; mode: Label['mode']; children: ReactNode }) {
  return (
    <span className="bims-label" data-mode={mode} data-testid={`app.right.bims.label.${name}`}>
      {children}
    </span>
  );
}

/** The '?' / '✗' pill: its own colours, its tip, a click opens its agent. */
export function Pill({ name, pill, onOpen }: { name: string; pill: 'asks' | 'failed'; onOpen: (agent: string) => void }) {
  return (
    <span
      className={`bims-pill ${pill}`}
      role="button"
      data-pill={pill}
      data-testid={`app.right.bims.pill.${name}`}
      {...tipAttrs(pill === 'asks' ? bims.pill_asks_tip({ agent: name }) : bims.pill_failed_tip({ agent: name }))}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(name);
      }}
    >
      {pill === 'asks' ? '?' : '✗'}
    </span>
  );
}

/** '⤢ fit', bottom right while zoomed or following: back to the whole office. */
export function FitChip({ onFit, ref }: { onFit: () => void; ref?: Ref<HTMLButtonElement> }) {
  return (
    <Press
      ref={ref}
      look="bims-chip bims-fit"
      data-testid="app.right.bims.fit"
      {...tipAttrs(bims.fit_tip, 'esc')}
      onClick={(e) => {
        e.stopPropagation();
        onFit();
      }}
    >
      <span aria-hidden="true">⤢</span> {bims.fit}
    </Press>
  );
}
