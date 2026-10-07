// One artifact open in the window (desktop-screens v6, designer m_11837; route
// artifacts/<p>/<id>): the head ('‹ artifacts', its title, 'page · by perf in storefront · 14:02';
// the version menu, 'open in browser ↗', '⋯'), then the page itself from the pages server, on
// paper, max 680 wide, centred on a lightly tinted backdrop. A link inside the page goes to his
// browser (the shell's guard). Owner: amb-kit.
import { useState } from 'react';
import { Button, Menu, MenuItem } from '@/ds';
import { useRouter } from '@/app/router';
import { useAllArtifacts } from './hooks';
import { kindOf, versions, whenWords } from './model';
import './artifacts.css';

/** The page's url at a version: the current one as is, an older one at /v/<n>. Pure. */
export function versionUrl(url: string, current: number, v: number): string {
  if (v === current) return url;
  return `${url.replace(/\/+$/, '')}/v/${String(v)}`;
}

export function ArtifactOpen({ project, id }: { project: string; id: string }) {
  const router = useRouter();
  const it = useAllArtifacts(project).find((x) => x.a.id === id);
  const [menu, setMenu] = useState<'versions' | 'more' | null>(null);
  const [v, setV] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const bise = (globalThis as { bise?: { openExternal?: (u: string) => unknown; copy?: (t: string) => unknown } }).bise;
  const back = () => {
    router.go({ screen: 'artifacts', project: '' });
  };
  if (it === undefined) {
    return (
      <section className="art-open" data-testid="artifact.open">
        <div className="art-open-head">
          <Button kind="ghost" onClick={back} testId="artifact.back">‹ artifacts</Button>
        </div>
        <div className="art-empty" data-testid="artifact.missing">this artifact isn't in the list any more.</div>
      </section>
    );
  }
  const a = it.a;
  const shown = v ?? a.version;
  const url = versionUrl(a.url, a.version, shown);
  const page = kindOf(a.kind) === 'page';
  return (
    <section className="art-open" data-testid="artifact.open"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && menu !== null) {
          e.preventDefault();
          setMenu(null);
        }
      }}>
      <div className="art-open-head">
        <Button kind="ghost" onClick={back} testId="artifact.back">‹ artifacts</Button>
        <span className="art-open-t">
          <span className="art-open-title" data-testid="artifact.title">{a.title}</span>
          <span className="art-open-sub">{`${kindOf(a.kind)} · by ${a.agent} in ${it.projectName} · ${whenWords(a.at_ms, now)}`}</span>
        </span>
        <span className="art-open-end">
          <span className="art-drop">
            <Button kind="ghost" onClick={() => { setMenu(menu === 'versions' ? null : 'versions'); }} testId="artifact.version">
              {`v${String(shown)} · ${shown === a.version ? 'the current one' : 'an older one'} ⌄`}
            </Button>
            {menu === 'versions' && (
              <Menu testId="artifact.versions">
                {versions(a).map((x) => (
                  <MenuItem key={x.v} on={x.v === shown} onClick={() => { setV(x.v); setMenu(null); }} testId={`artifact.versions.v${String(x.v)}`}>
                    <span className="art-v">{`v${String(x.v)}`}</span> {x.words}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </span>
          <Button kind="ghost" onClick={() => { void bise?.openExternal?.(url); }} testId="artifact.browser">open in browser ↗</Button>
          <span className="art-drop">
            <Button kind="ghost" onClick={() => { setMenu(menu === 'more' ? null : 'more'); }} testId="artifact.more">⋯</Button>
            {menu === 'more' && (
              <Menu testId="artifact.more.menu">
                <MenuItem onClick={() => { void bise?.copy?.(url); setMenu(null); }} testId="artifact.copy">copy link</MenuItem>
              </Menu>
            )}
          </span>
        </span>
      </div>
      <div className="art-open-body">
        {page ? (
          <iframe className="art-paper" src={url} title={a.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" data-testid="artifact.page" />
        ) : (
          <div className="art-empty">this kind opens in your browser: open in browser ↗</div>
        )}
      </div>
    </section>
  );
}
