// One artifact open in the window (desktop-screens v6, designer m_11837; route
// artifacts/<p>/<id>): the head ('‹ artifacts', its title, 'page · by perf in storefront · 14:02';
// the version menu, 'open in browser ↗', '⋯'), then the page itself from the pages server, on
// paper, max 680 wide, centred on a lightly tinted backdrop. A link inside the page goes to his
// browser (the shell's guard). Owner: amb-kit.
import { useCallback, useMemo, useState } from 'react';
import { Button, Menu, MenuItem } from '@/ds';
import { useRouter } from '@/app/router';
import { useAgents, usePrefs, useStore } from '@/store';
import { themeOf } from '@/theme';
import { ThreadComposer } from '@/thread/ThreadScreen';
import { useAllArtifacts } from './hooks';
import { kindOf, pathOf, versions, whenWords } from './model';
import { putInDraft } from './put';
import './artifacts.css';

/** What the window's bridge offers here (each one absent in a plain browser or a test: its item hides). */
export interface ArtBridge {
  openExternal?: (u: string) => unknown;
  copy?: (t: string) => unknown;
  quickLook?: (path: string) => Promise<boolean>;
  showInFinder?: (path: string) => Promise<boolean>;
}
export const bridge = (): ArtBridge | undefined => (globalThis as { bise?: ArtBridge }).bise;

/** '@ put it in a message': the artifact as a chip in its agent's draft, then that thread. */
export function usePutInMessage(): (project: string, a: { id: string; title: string; url: string; agent: string }) => void {
  const router = useRouter();
  return useCallback(
    (project, a) => {
      putInDraft(window.localStorage, `${project}/${a.agent}`, a);
      router.go({ screen: 'thread', project, agent: a.agent });
    },
    [router],
  );
}

const noop = () => undefined;

// 'v' on a row: the artifact it opens shows its versions menu at once (one open, then it's spent)
let versionsFor: string | null = null;
/** The next open of this artifact ('project/id') shows its versions. */
export function openWithVersions(key: string): void {
  versionsFor = key;
}
function takeVersions(key: string): boolean {
  const on = versionsFor === key;
  versionsFor = null;
  return on;
}

/** ⌘C on a row: its link (the bridge's copy, else the clipboard). */
export function copyLink(url: string): void {
  const copy = bridge()?.copy;
  if (copy !== undefined) void copy(url);
  else void navigator.clipboard.writeText(url).catch(noop);
}

/** The page's url at a version: the current one as is, an older one at /v/<n>. Pure. */
export function versionUrl(url: string, current: number, v: number): string {
  if (v === current) return url;
  return `${url.replace(/\/+$/, '')}/v/${String(v)}`;
}

export function ArtifactOpen({ project, id }: { project: string; id: string }) {
  const router = useRouter();
  const it = useAllArtifacts(project).find((x) => x.a.id === id);
  // 'v' on a row of the list opens it with its versions shown
  const [menu, setMenu] = useState<'versions' | 'more' | null>(() => (takeVersions(`${project}/${id}`) ? 'versions' : null));
  const [v, setV] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const theme = themeOf(usePrefs());
  const bise = bridge();
  const store = useStore();
  const put = usePutInMessage();
  const agent = it?.a.agent ?? '';
  const busy = useAgents(project).find((x) => x.name === agent)?.status === 'working';
  const onStop = useCallback(() => {
    store.stop(project, agent);
  }, [store, project, agent]);
  const about = useMemo(() => (it === undefined ? undefined : { id: it.a.id, title: it.a.title, url: it.a.url }), [it]);
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
  const path = pathOf(a);
  const finder = path !== null && bise?.showInFinder !== undefined ? bise.showInFinder : undefined;
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
              {`v${String(shown)}`}
              <span className="art-wide">{` · ${shown === a.version ? 'the current one' : 'an older one'}`}</span>
              {' ⌄'}
            </Button>
            {menu === 'versions' && (
              <Menu testId="artifact.versions">
                {versions(a, now).map((x) => (
                  <MenuItem key={x.v} on={x.v === shown} onClick={() => { setV(x.v); setMenu(null); }} testId={`artifact.versions.v${String(x.v)}`}>
                    <span className="art-v">{`v${String(x.v)}`}</span>
                    <span className="art-v-words">{x.words}</span>
                    {x.when !== undefined && <span className="art-v-when">{x.when}</span>}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </span>
          <Button kind="ghost" onClick={() => { void bise?.openExternal?.(url); }} testId="artifact.browser" title="open in browser">
            <span className="art-wide">open in browser </span>↗
          </Button>
          <span className="art-drop">
            <Button kind="ghost" onClick={() => { setMenu(menu === 'more' ? null : 'more'); }} testId="artifact.more">⋯</Button>
            {menu === 'more' && (
              <Menu testId="artifact.more.menu">
                {finder !== undefined && path !== null && (
                  <MenuItem onClick={() => { void finder(path); setMenu(null); }} testId="artifact.finder">show in Finder</MenuItem>
                )}
                <MenuItem onClick={() => { void bise?.copy?.(url); setMenu(null); }} testId="artifact.copy">copy link</MenuItem>
                <MenuItem onClick={() => { setMenu(null); put(project, a); }} testId="artifact.put">put it in a message</MenuItem>
              </Menu>
            )}
          </span>
        </span>
      </div>
      <div className="art-open-body">
        {page ? (
          // the page follows his theme: the kit picks its dark paper by prefers-color-scheme, which
          // an iframe takes from its element's color-scheme ('light dark': the system's)
          <iframe className="art-paper" src={url} title={a.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ colorScheme: theme ?? 'light dark' }} data-testid="artifact.page" />
        ) : (
          <div className="art-empty">this kind opens in your browser: open in browser ↗</div>
        )}
      </div>
      {/* his words about it go to the agent that made it (the thread's composer, its own drafts) */}
      <div className="art-open-composer" data-testid="artifact.composer">
        <ThreadComposer
          project={project}
          agent={a.agent}
          busy={busy}
          to={`about “${a.title}” · to ${a.agent}`}
          placeholder={`ask ${a.agent} about it, then ⏎`}
          answer={null}
          onStop={onStop}
          quoting={false}
          onReady={noop}
          onSent={noop}
          {...(about === undefined ? {} : { about })}
        />
      </div>
    </section>
  );
}
