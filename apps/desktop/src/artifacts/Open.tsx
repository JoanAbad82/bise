// One artifact open (designer's artifact-open v2; amb-win's seam m_19613): ArtifactOpen fills the
// box the frame gives it, the right column at 55% beside its maker's thread (or the whole width
// under 1000 px, and the centre route artifacts/<p>/<id> until the frame wires the column). Its
// head (title, version menu, '↗ browser', ⋯, ✕), then the page from the pages server, 16 px in on
// a 3% backdrop. A link inside the page goes to his browser (the shell's guard). The composer's
// words come from maker.ts. Owner: amb-kit (the list, the model); task-panel (the open view).
import { ImageView } from './ImageView';
import { isImageSrc } from './zoom';
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { APP_FRAME_NAME } from './frameNote';
import { useFrameNote } from './useFrameNote';
import { Button, IconButton, Menu, MenuItem, Press } from '@/ds';
import type { ArtifactLive } from '@/proto';
import { useRouter } from '@/app/router';
import { useAgents, usePrefs, useStore } from '@/store';
import { themeOf } from '@/theme';
import { answerOf, ThreadComposer } from '@/thread/ThreadComposer';
import { useTabPlace } from '@/thread/ComposerTab';
import { usageLine } from '@/thread/head';
import { InboxBlock, type Answering } from '@/inbox';
import { useAllArtifacts } from './hooks';
import { kindOf, pathOf, versions } from './model';
import { putInDraft } from './put';
import { useAboutWords } from './maker';
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

// an inbox option that opens this artifact at a block (notif-open, bise-proto OptAct::Open's
// `at`): the next open of it scrolls its page there (one open, then it's spent)
let anchorFor: { key: string; at: string } | null = null;
/** The next open of this artifact ('project/id') shows it at block or item `at`. */
export function openAtAnchor(key: string, at: string): void {
  anchorFor = { key, at };
}
function takeAnchor(key: string): string | null {
  const at = anchorFor?.key === key ? anchorFor.at : null;
  anchorFor = null;
  return at;
}

/** A frame's src at block or item `at` (the kit scrolls to its hash); none: as is. Pure. */
export function anchoredSrc(src: string | null, at: string | null): string | null {
  if (src === null || at === null || at === '') return src;
  return `${src.split('#', 1)[0] ?? ''}#${encodeURIComponent(at)}`;
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

/** The page's url with his theme as a hint the kit reads (?theme=light|dark); none: as is. Pure. */
export function themedUrl(url: string, theme: 'light' | 'dark' | null): string {
  if (theme === null) return url;
  const [base = '', hash] = url.split('#', 2);
  const q = `${base}${base.includes('?') ? '&' : '?'}theme=${theme}`;
  return hash === undefined ? q : `${q}#${hash}`;
}

/**
 * What the open view frames at version `shown`, or null (no frame: the 'opens in your browser'
 * line, never a white box). Pure. The hub's frame_url first: a local file's copy on the pages
 * server (amb-feed c5caeffd, architect m_19561), the one origin the shell's guard lets a subframe
 * show; it names the current version only. Else a page's http(s) url (an older version at /v/<n>).
 * A bare local path from an older hub frames nothing: the guard blocks file:// (ambient-lead m_19544).
 */
export function frameSrc(
  a: { kind: string; url: string; version: number; frame_url?: string | null; versions?: readonly { v: number; frame_url?: string | null }[] },
  shown: number,
  theme: 'light' | 'dark' | null,
): string | null {
  const local = a.frame_url ?? '';
  // the newest version of an xlsx, pptx or docx: bise's viewer at /a/<id>/view, the src the frame
  // keeps while new versions land (pages::site::frame_href); never built here (architect m_23970)
  if (shown === a.version && local !== '') return themedUrl(local, theme);
  // an older version: the hub's own url for it (ArtifactVersion.frame_url, art-live 929ead94f)
  const older = shown === a.version ? '' : (a.versions?.find((x) => x.v === shown)?.frame_url ?? '');
  if (older !== '') return themedUrl(older, theme);
  if (kindOf(a.kind) !== 'page' || !/^https?:\/\//i.test(a.url)) return null;
  return themedUrl(versionUrl(a.url, a.version, shown), theme);
}

/**
 * The hub's live words under the head (art-live, designer m_23868, the 28 px strip): '∿ deck is
 * updating · slide 2' while the maker's turn runs, then 'v3 · 2 slides changed' with '← v2' 16 px
 * after it, which opens that version. Drawn as they come; the one thing decided here: the line goes
 * once he moved to another version (`gone` is that line).
 */
export function LiveStrip({ live, gone, onBack }: { live: ArtifactLive | null; gone: string | null; onBack: (v: number, line: string) => void }) {
  if (live === null) return null;
  if (live.strip !== undefined && live.strip !== '') {
    return (
      <div className="art-live" data-testid="artifact.live" data-state="strip">
        {live.strip}
      </div>
    );
  }
  const line = live.line;
  if (line === undefined || line === '' || line === gone) return null;
  const back = live.back;
  return (
    <div className="art-live" data-testid="artifact.live" data-state="line">
      <span>{line}</span>
      {back !== undefined && (
        <Press look="art-live-back" onClick={() => { onBack(back.v, line); }} data-testid="artifact.live.back">
          {back.text}
        </Press>
      )}
    </div>
  );
}

export interface ArtifactOpenProps {
  project: string;
  id: string;
  /** ✕ and esc: the frame's way back (the right bar as it was); none: the artifacts list */
  onClose?: () => void;
  /** the maker's composer under the page: on when the frame has no thread beside it (under 1000 px, or the centre route) */
  composer?: boolean;
  /** before the title in its head: under 1000 px the frame's '◧ <maker>' that slides the maker's thread over (amb-win) */
  lead?: ReactNode;
}

/**
 * One artifact open (designer's artifact-open v2, amb-win's seam m_19613): it fills the box the
 * frame gives it (the right column at 55%, or the whole width under 1000 px) and reads no route.
 * Its head, 44 high: the title, 'page · v2 ⌄', '↗ browser', ⋯ (Finder, copy link, put it in a
 * message), ✕; esc closes a menu first, then the artifact, unless a field inside has his caret.
 * The page sits 16 px in on a 3% backdrop, r 12. The screen's ONE composer is the maker's
 * (maker.ts: the project's main when the maker is archived); the frame draws it under the
 * maker's thread, so here only with `composer`.
 */
export function ArtifactOpen({ project, id, onClose, composer = true, lead }: ArtifactOpenProps) {
  const router = useRouter();
  const it = useAllArtifacts(project).find((x) => x.a.id === id);
  // 'v' on a row of the list opens it with its versions shown
  const [menu, setMenu] = useState<'versions' | 'more' | null>(() => (takeVersions(`${project}/${id}`) ? 'versions' : null));
  const [at] = useState(() => takeAnchor(`${project}/${id}`));
  const [v, setV] = useState<number | null>(null);
  // the live line he moved away from (another version picked): it goes; a new line shows again
  const [goneLine, setGoneLine] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const theme = themeOf(usePrefs());
  const bise = bridge();
  const store = useStore();
  const put = usePutInMessage();
  const words = useAboutWords(project, id);
  const [answering, setAnswering] = useState<Answering | null>(null);
  const agent = words?.agent ?? '';
  const agents = useAgents(project);
  const busy = agents.find((x) => x.name === agent)?.status === 'working';
  // the maker its composer writes to: its place, context and model in the tab and the box's row
  const maker = words === undefined ? undefined : agents.find((x) => x.name === words.agent);
  const makerPlace = useTabPlace(project, maker, false);
  const onStop = useCallback(() => {
    store.stop(project, agent);
  }, [store, project, agent]);
  const about = useMemo(() => (it === undefined ? undefined : { id: it.a.id, title: it.a.title, url: it.a.url }), [it]);
  // the frame's src, from the hub's row (hooks before the early return), at the block an inbox
  // option opened it at, on its current version only
  const src = it === undefined ? null : anchoredSrc(frameSrc(it.a, v ?? it.a.version, theme), (v ?? it.a.version) === it.a.version ? at : null);
  const frame = useRef<HTMLIFrameElement>(null);
  useFrameNote(frame, src, project, id, it?.a.title ?? '');
  const close = () => {
    // ✕ and esc as ‹: back to the place before (designer's desktop-history); opened straight (a link) the list
    if (onClose !== undefined) onClose();
    else if (router.canBack()) router.back();
    else router.go({ screen: 'artifacts', project: '' });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (menu !== null) {
      e.preventDefault();
      setMenu(null);
      return;
    }
    // his caret in a field inside (the composer): the field's esc, never a close
    const t = e.target;
    if (t instanceof HTMLElement && t.closest('input, textarea, [contenteditable="true"]') !== null) return;
    e.preventDefault();
    close();
  };
  const x = (
    <IconButton label="close" keys="esc" size="bar" onClick={close} testId="artifact.close">
      ✕
    </IconButton>
  );
  if (it === undefined) {
    return (
      <section className="art-open" data-testid="artifact.open" onKeyDown={onKeyDown}>
        <div className="art-open-head">
          <span className="art-open-title" />
          <span className="art-open-end">{x}</span>
        </div>
        <div className="art-empty" data-testid="artifact.missing">this artifact isn't in the list any more.</div>
      </section>
    );
  }
  const a = it.a;
  const shown = v ?? a.version;
  const url = versionUrl(a.url, a.version, shown);
  const path = pathOf(a);
  const finder = path !== null && bise?.showInFinder !== undefined ? bise.showInFinder : undefined;
  return (
    <section className="art-open" data-testid="artifact.open" data-agent={a.agent} onKeyDown={onKeyDown}>
      <div className="art-open-head" data-testid="artifact.head">
        {lead}
        <span className="art-open-title" data-testid="artifact.title" title={a.title}>{a.title}</span>
        <span className="art-open-end">
          <span className="art-drop">
            <Button kind="ghost" size="sm" onClick={() => { setMenu(menu === 'versions' ? null : 'versions'); }} testId="artifact.version" title={shown === a.version ? 'the current version' : 'an older version'}>
              {`${kindOf(a.kind)} · v${String(shown)} ⌄`}
            </Button>
            {menu === 'versions' && (
              <Menu testId="artifact.versions">
                {versions(a, now).map((r) => (
                  <MenuItem key={r.v} on={r.v === shown} onClick={() => { setV(r.v); setMenu(null); setGoneLine(a.live?.line ?? null); }} testId={`artifact.versions.v${String(r.v)}`}>
                    <span className="art-v">{`v${String(r.v)}`}</span>
                    <span className="art-v-words">{r.words}</span>
                    {r.when !== undefined && <span className="art-v-when">{r.when}</span>}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </span>
          <Button kind="ghost" size="sm" onClick={() => { void bise?.openExternal?.(url); }} testId="artifact.browser" title="open in browser">
            ↗ browser
          </Button>
          <span className="art-drop">
            <IconButton label="more" size="bar" pressed={menu === 'more'} onClick={() => { setMenu(menu === 'more' ? null : 'more'); }} testId="artifact.more">⋯</IconButton>
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
          {x}
        </span>
      </div>
      <LiveStrip live={a.live ?? null} gone={goneLine} onBack={(back, line) => { setV(back); setGoneLine(line); }} />
      <div className="art-open-body">
        {/* the page follows his theme: opened with ?theme=<his pref>, the kit wears it (kit.js puts
            it on <html data-theme>); with no pref, the system's. A browser-only kind never gets
            here from a list (leave.ts opens his browser): no 'opens in your browser' panel (designer m_21714) */}
        {/* one image file: drawn here, zoomable (a pinch, two fingers, a double-click; his m_22822) */}
        {src !== null && isImageSrc(src) && <ImageView src={src} alt={a.title} />}
        {/* the src stays /a/<id>/view while new versions land: the viewer swaps in place, never a
            reload (plan §6). Its name tells the viewer it sits in the app: a selection comes here
            (useFrameNote) for the maker's composer, not the frame's own note */}
        {src !== null && !isImageSrc(src) && (
          <iframe ref={frame} name={APP_FRAME_NAME} className="art-paper" src={src} title={a.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            data-testid="artifact.page" />
        )}

      </div>
      {/* the screen's one composer, the maker's (maker.ts), when no thread sits beside the page; the
          maker's own question docks over it (designer m_20452: only the maker's, as in its thread) */}
      {composer && words !== undefined && (
        <div className="art-open-composer th-screen" data-testid="artifact.composer" data-answering={answering !== null}>
          <InboxBlock here={{ project, agent: a.agent }} only={(c) => c.project === project && c.agent === a.agent} onAnswer={setAnswering} />
          <ThreadComposer
            project={project}
            agent={words.agent}
            busy={busy}
            // the crumb names the project here: the tab says who and where (designer's composer-strip A)
            tab={{ label: answering?.label ?? words.to, place: makerPlace, context: usageLine(maker?.usage?.words) }}
            tabEnd={answering?.end}
            me={maker}
            placeholder={answering?.answer != null ? 'your answer, then ⏎' : words.placeholder}
            answer={answerOf(answering)}
            onStop={onStop}
            quoting={false}
            onReady={noop}
            onSent={noop}
            {...(about === undefined ? {} : { about })}
          />
        </div>
      )}
    </section>
  );
}
