// The last crash report, opened in the window (bise fait mac, page native-mac §9; designer's
// voice-window part 2: 'show the report' opens it here; amb-mac 92b01565: window.bise.core.report()
// -> {path, text} | null, the markdown bise wrote under ~/.bise/reports, never sent anywhere). Its
// banner (ds PageBanner: 'Crash report', its sentence, its file, the signed vignette), its actions
// in the row under it ('Copy', then 'Copied'; 'Show in Finder'), then the report as markdown in the
// page's column. No report: one ds Empty. log 'restart' (route report/restart, settings › general's
// 'show the log', designer's app-swap v2): the last update's restart.log the same way
// (window.bise.app.restartLog()), as plain lines. The floating composer's room at the foot
// (--float-room). Owner: nm-pages-b (amb-win's before).
import { useEffect, useState } from 'react';
import type { BiseApi, CrashReport } from '@/shared/api';
import { Button, Empty, PageBanner } from '@/ds';
import { hero } from '@/proto/words_hero.gen';
import { pages } from '@/proto/words_pages.gen';
import { PageVignette, useBannerGutter } from '@/artifacts/hero/vignettes';
import { Markdown } from '@/thread/Markdown';
import './report.css';

const bise = (): BiseApi | undefined => (window as { bise?: BiseApi }).bise;

/** The report's file, home folded to '~'. Pure. */
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
  const gutter = useBannerGutter();
  const home = bise()?.home;
  return (
    <section className="app-report" data-testid="app.report">
      <div className="app-report-scroll" data-testid="app.report.scroll">
        <PageBanner
          title={restart ? hero.update_log_title : hero.crash_title}
          sentence={restart ? hero.update_log_say : hero.crash_say}
          {...(r != null ? { facts: <span data-testid="app.report.where">{reportWhere(r.path, home)}</span> } : {})}
          visual={<PageVignette page="crash" />}
          icon="file"
          gutter={gutter}
          testId="app.report.lead"
        />
        <div className="app-report-col">
          {r != null && (
            <div className="app-report-acts">
              <Button kind="ghost" testId="app.report.copy"
                onClick={() => {
                  void bise()
                    ?.copy(r.text)
                    .then(() => {
                      setCopied(true);
                    });
                }}>
                {copied ? pages.copied : pages.copy}
              </Button>
              <Button kind="ghost" testId="app.report.finder"
                onClick={() => {
                  void bise()?.showInFinder(r.path);
                }}>
                {pages.show_in_finder}
              </Button>
            </div>
          )}
          {r === undefined ? null : r === null ? (
            <Empty testId="app.report.none" title={restart ? pages.no_update_log : pages.no_crash} />
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
      </div>
    </section>
  );
}
