// The last crash report, opened in the window (designer's voice-window part 2: 'show the report'
// opens it here, with copy and show in Finder; amb-mac 92b01565: window.bise.core.report() ->
// {path, text} | null, the markdown bise wrote under ~/.bise/reports, never sent anywhere). Its
// head: 'crash report' and its file; the report as markdown; 'copy' (the whole text, then 'copied')
// and 'show in Finder'. No report: one dim line. Owner: amb-win.
import { useEffect, useState } from 'react';
import type { BiseApi, CrashReport } from '@/shared/api';
import { Button, Head } from '@/ds';
import { Markdown } from '@/thread/Markdown';

const bise = (): BiseApi | undefined => (window as { bise?: BiseApi }).bise;

/** The head's second part: the report's file, home folded to '~'. Pure. */
export function reportWhere(path: string, home: string | undefined): string {
  return home !== undefined && home !== '' && path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

function useReport(): CrashReport | null | undefined {
  // undefined: asking; null: none
  // no report API (an older shell): none, at once
  const [r, setR] = useState<CrashReport | null | undefined>(() => (bise()?.core.report === undefined ? null : undefined));
  useEffect(() => {
    let live = true;
    const ask = bise()?.core.report;
    if (ask === undefined) return undefined;
    void ask().then((x) => {
      if (live) setR(x);
    });
    return () => {
      live = false;
    };
  }, []);
  return r;
}

export function ReportScreen() {
  const r = useReport();
  const [copied, setCopied] = useState(false);
  const home = bise()?.home;
  return (
    <section className="app-report" data-testid="app.report">
      <Head
        title="crash report"
        sub={r != null ? reportWhere(r.path, home) : undefined}
        end={
          r != null ? (
            <>
              <Button
                testId="app.report.copy"
                onClick={() => {
                  void bise()
                    ?.copy(r.text)
                    .then(() => {
                      setCopied(true);
                    });
                }}
              >
                {copied ? 'copied' : 'copy'}
              </Button>
              <Button
                testId="app.report.finder"
                onClick={() => {
                  void bise()?.showInFinder(r.path);
                }}
              >
                show in Finder
              </Button>
            </>
          ) : undefined
        }
      />
      <div className="app-report-body">
        {r === undefined ? null : r === null ? (
          <p className="app-dim" data-testid="app.report.none">
            no crash report: bise hasn't crashed.
          </p>
        ) : (
          <div className="app-report-text" data-testid="app.report.text">
            <Markdown text={r.text} onLink={() => undefined} />
          </div>
        )}
      </div>
    </section>
  );
}
