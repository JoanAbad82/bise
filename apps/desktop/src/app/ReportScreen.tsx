// The last crash report, opened in the window (designer's voice-window part 2: 'show the report'
// opens it here, with copy and show in Finder; amb-mac 92b01565: window.bise.core.report() ->
// {path, text} | null, the markdown bise wrote under ~/.bise/reports, never sent anywhere). Its
// head: 'crash report' and its file; the report as markdown; 'copy' (the whole text, then 'copied')
// and 'show in Finder'. No report: one dim line. log 'restart' (route report/restart, settings ›
// general's 'show the log', designer's app-swap v2): the last update's restart.log the same way
// (window.bise.app.restartLog()), as plain lines. Owner: amb-win.
import { useEffect, useState } from 'react';
import type { BiseApi, CrashReport } from '@/shared/api';
import { Act, Empty, PageHero } from '@/ds';
import { hero } from '@/proto/words_hero.gen';
import { Markdown } from '@/thread/Markdown';
import { panel } from '@/proto/words_panel.gen';

const bise = (): BiseApi | undefined => (window as { bise?: BiseApi }).bise;

/** The head's second part: the report's file, home folded to '~'. Pure. */
export function reportWhere(path: string, home: string | undefined): string {
  return home !== undefined && home !== '' && path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

function reader(log: 'restart' | undefined): (() => Promise<CrashReport | null>) | undefined {
  const b = bise();
  if (log === 'restart') return typeof b?.app.restartLog === 'function' ? b.app.restartLog : undefined;
  return b?.core.report;
}

function useReport(log: 'restart' | undefined): CrashReport | null | undefined {
  // undefined: asking; null: none
  // no report API (an older shell): none, at once
  const [r, setR] = useState<CrashReport | null | undefined>(() => (reader(log) === undefined ? null : undefined));
  useEffect(() => {
    let live = true;
    const ask = reader(log);
    if (ask === undefined) return undefined;
    void ask().then((x) => {
      if (live) setR(x);
    });
    return () => {
      live = false;
    };
  }, [log]);
  return r;
}

export function ReportScreen({ log }: { log?: 'restart' | undefined } = {}) {
  const r = useReport(log);
  const restart = log === 'restart';
  const [copied, setCopied] = useState(false);
  const home = bise()?.home;
  return (
    <section className="app-report" data-testid="app.report">
      <div className="app-report-body">
        {/* the page hero (ui-review-app #2): the file and its acts on the facts line */}
        <PageHero
          name={restart ? panel.crumb_update_log : panel.crumb_crash}
          sentence={restart ? hero.update_log_say : hero.crash_say}
          {...(r != null
            ? {
                facts: (
                  <>
                    {reportWhere(r.path, home)}
                    {' · '}
                    <Act
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
                    </Act>
                    {' · '}
                    <Act
                      testId="app.report.finder"
                      onClick={() => {
                        void bise()?.showInFinder(r.path);
                      }}
                    >
                      show in Finder
                    </Act>
                  </>
                ),
              }
            : {})}
          testId="app.report.hero"
        />
        {r === undefined ? null : r === null ? (
          <Empty testId="app.report.none" title={restart ? 'no update log: this app never updated itself.' : "no crash report: bise hasn't crashed."} />
        ) : restart ? (
          <pre className="app-report-text app-report-log" data-testid="app.report.text">
            {r.text}
          </pre>
        ) : (
          <div className="app-report-text" data-testid="app.report.text">
            <Markdown text={r.text} onLink={() => undefined} />
          </div>
        )}
      </div>
    </section>
  );
}
