// What a thinking row may draw. The runtime signs a thinking with a last
// 'BENDSIG::<signature>' line (bend/core/wire.bend think_sig) that the
// transcript keeps for replay; the hub's fold drops it
// (bise_proto thread::think::unsigned). This is the window's own guard
// for a hub that still sends it (ambient-lead m_20137): never draw a
// signature, wherever it sits.

/** The runtime's signature mark (bise_proto thread::think::SIG_MARK). */
export const SIG_MARK = 'BENDSIG::';

const SIG_RUN = /BENDSIG::\S*/g;

/** A thinking's words without any 'BENDSIG::…' run: its signature lines go whole, a run inside a line goes alone; the trailing blank lines go too. Pure. */
export function thinkingWords(body: string): string {
  if (!body.includes(SIG_MARK)) return body;
  return body
    .split('\n')
    .filter((l) => !l.trimStart().startsWith(SIG_MARK))
    .map((l) => l.replace(SIG_RUN, '').trimEnd())
    .join('\n')
    .trimEnd();
}
