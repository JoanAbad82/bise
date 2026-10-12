// @vitest-environment happy-dom
// ambient-lead m_20137: an open thinking never draws the runtime's 'BENDSIG::' signature.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Store, StoreProvider, threadKey } from '@/store';
import { EntryRow, type RowCtx } from './rows';
import { thinkingWords } from './thinking';

afterEach(cleanup);

const P = 'acme-1a2b3c4d';
const SIG = 'BENDSIG::CAQSowkKEAgSGAI4AUIldGhpbmtpbmcSDDXROutQ2MlI2uHu3BoM9ssVsC9oAZMQCiAuljBVb9d8NYYiP+/=';

describe('a thinking never draws its signature', () => {
  it('the signature lines go whole, a run inside a line alone, the words stay as written', () => {
    expect(thinkingWords(`I think asking makes sense.\n\n${SIG}`)).toBe('I think asking makes sense.');
    expect(thinkingWords(`a\n  ${SIG}\nb`)).toBe('a\nb');
    expect(thinkingWords(`weigh ${SIG} it`)).toBe('weigh  it');
    expect(thinkingWords(SIG)).toBe('');
    expect(thinkingWords('the cold run\n\nis the slow one')).toBe('the cold run\n\nis the slow one');
  });

  it('an open thinking entry and a reply carrying one show their words, never BENDSIG::', () => {
    const store = new Store(null);
    const ctx: RowCtx = { tkey: threadKey(P, 'epargne-offre'), project: P, agent: 'epargne-offre', bise: false, onLink: () => undefined };
    store.apply({ ev: 'entry', project: P, agent: 'epargne-offre', entry: { pos: 31, at_ms: 1, kind: 'thinking', text: 'thought for 12s', thinking: { ms: 12_000, text: `framed tactfully.\n\n${SIG}` } } });
    store.apply({ ev: 'entry', project: P, agent: 'epargne-offre', entry: { pos: 32, at_ms: 2, kind: 'agent', text: 'Oui, demande-la.', thinking: { ms: 12_000, text: `protects me.\n${SIG}` } } });
    for (const [pos, words] of [
      [31, 'framed tactfully.'],
      [32, 'protects me.'],
    ] as const) {
      const v = render(
        <StoreProvider store={store}>
          <EntryRow ctx={ctx} pos={pos} />
        </StoreProvider>,
      );
      fireEvent.click(v.getByTestId(`thread.think.${String(pos)}.head`));
      const shown = v.getByTestId(`thread.think.${String(pos)}`).textContent;
      expect(shown).toContain(words);
      expect(shown).not.toContain('BENDSIG');
      expect(shown).not.toContain('CAQSowk');
      cleanup();
    }
  });
});
