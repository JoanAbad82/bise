// bise's pearl in the window (ambient's thread spec f, designer m_12127): pink and alive only
// while bise waits on him (something waits in any project); at rest the ink pearl, still, like the
// projects' pearls. Owner: amb-win.
import { Pearl, type PearlSize } from '@/ds';
import { useProjects } from '@/store';

/** What waits on him across every project. */
function useWaits(): number {
  return useProjects().reduce((n, p) => n + p.waits, 0);
}

export function BisePearl({ size }: { size: PearlSize }) {
  const waits = useWaits();
  if (waits > 0) return <Pearl size={size} mood="need" />;
  return (
    <Pearl size={size}>
      <i className="app-pearl" data-testid="bise.pearl.rest" />
    </Pearl>
  );
}
