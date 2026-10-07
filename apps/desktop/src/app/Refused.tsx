// A project whose hub refused this core (amb-core 44d64919, CoreEv hub_refused): the hub's own
// words and a 'retry' (AppCmd hub_retry), on the project's sidebar line and in its thread,
// instead of an endless 'connecting…' (lead m_11347). The project's welcome clears it in the
// store. The words are the hub's; only the lead-in and the retry are ours. Owner: amb-win.
import { useEffect, useState } from 'react';
import { useHubRefused, useStore } from '@/store';

/** How long 'retrying…' shows after his click before retry is offered again, if no answer came. */
export const RETRY_MS = 4000;

/** The line's lead-in: whose hub said no. Pure. */
export function refusedLead(name: string): string {
  return `${name}'s hub refused bise`;
}

/**
 * The refusal line: '<name>'s hub refused bise · <its words>  retry'. Nothing when the hub took
 * this core. `testId` names the line; its button is `<testId>.retry`.
 */
export function RefusedLine({ project, name, testId, className }: { project: string; name: string; testId: string; className: string }) {
  const store = useStore();
  const words = useHubRefused(project);
  // the words he retried: new words (a new refusal) or none (welcomed) give him the retry back
  const [retried, setRetried] = useState<string | null>(null);
  const retrying = retried !== null && retried === words;
  useEffect(() => {
    if (retried === null) return;
    const t = window.setTimeout(() => {
      setRetried(null);
    }, RETRY_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [retried]);
  if (words === null) return null;
  return (
    <div className={className} role="status" data-testid={testId}>
      <span className="app-refused-mark" aria-label="refused">
        ✗
      </span>
      <span className="app-refused-text">
        {refusedLead(name)}
        {words.trim() === '' ? '' : ` · ${words.trim()}`}
      </span>
      <button
        type="button"
        className="app-refused-retry"
        disabled={retrying}
        onClick={(e) => {
          e.stopPropagation();
          setRetried(words);
          store.hubRetry(project);
        }}
        data-testid={`${testId}.retry`}
      >
        {retrying ? 'retrying…' : 'retry'}
      </button>
    </div>
  );
}
