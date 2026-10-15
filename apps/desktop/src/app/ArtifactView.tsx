// An artifact open in the window (designer's artifact-open page, ambient-lead m_20087 commit 3/3):
// three columns, the left bar, the maker's thread, then the artifact on ~55% of the window (50-70%,
// the panels' handle; the thread keeps 400 px at least). The screen's ONE composer is the maker's,
// about the artifact ('to perf · about “…”'; the project's main when the maker is archived); main's
// composer and inbox are not on it. Under 1200 px the left bar folds; under 1000 px the artifact takes
// the width with the maker's composer under the page, and '◧ <maker>' slides the thread over it from
// the left. ✕ or esc go back where he was. The route drives it (artifacts/<project>/<id>), so back
// and forward fit. The artifact itself is task-panel's ArtifactOpen. Owner: amb-win.
import { takeZoomKey } from '@/artifacts/zoomKeys';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/ds';
import { ArtifactOpen, useAboutWords, useAllArtifacts } from '@/artifacts';
import { useProjects } from '@/store';
import { ThreadScreen } from '@/thread/ThreadScreen';
import { keep } from './keep';
import { MAIN, type Route } from './route';
import { useRouter } from './router';
import { Over } from './Frame';
import { popupOpen } from './esc-up';
import { NARROW_PX } from './side';

/** Under this width the left bar folds while an artifact is open (designer: 'sous 1200 px'). */
export const ART_FOLD_PX = 1200;
/**
 * The thread's least width beside an artifact: 380, so designer's 1400 mock holds (240 + the
 * artifact's 770 leave the thread 390; the page's '400 at least' would take 10 px off the artifact).
 */
export const ART_THREAD_MIN = 380;
const PCT_KEY = 'frame.art.pct';

/** The artifact this route opens in the window, if any: a project's artifact by id. Pure. */
export function artOf(route: Route): { project: string; id: string } | undefined {
  return route.screen === 'artifacts' && route.project !== '' && route.id !== undefined ? { project: route.project, id: route.id } : undefined;
}

/** The artifact's share of the window, kept per window: 55% by default, 50-70%. Pure. */
export function artPct(kept: unknown): number {
  return typeof kept === 'number' && Number.isFinite(kept) ? Math.min(0.7, Math.max(0.5, kept)) : 0.55;
}

/** The artifact column's width: its share, leaving the thread 380 px beside the left bar. Pure. */
export function artWidth(win: number, side: number, pct: number): number {
  return Math.max(0, Math.min(Math.round(win * pct), win - side - ART_THREAD_MIN));
}

/** The window's width, live. */
export function useInnerWidth(): number {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('resize', cb);
      return () => {
        window.removeEventListener('resize', cb);
      };
    },
    () => window.innerWidth,
  );
}

/** The artifact's share, kept per window, and its setter (the handle). */
export function useArtPct(): readonly [number, (pct: number) => void] {
  const [pct, setPct] = useState(() => artPct(keep.view(PCT_KEY)));
  return [
    pct,
    (p: number) => {
      const v = artPct(p);
      keep.setView(PCT_KEY, v);
      setPct(v);
    },
  ];
}

/** ✕ and esc: back where he was; with nothing behind, the maker's thread. */
function useClose(project: string, maker: string | undefined): () => void {
  const router = useRouter();
  return () => {
    if (router.places('back', 1).length > 0) router.back();
    else router.go({ screen: 'thread', project, agent: maker ?? MAIN });
  };
}

/**
 * Esc while an artifact is open (his ask, main m_21531; designer m_21535): a menu, a popover, ⌘K or a
 * confirm closes first (their own esc); else esc closes the artifact, before the composer reads it, so
 * his words and the answering mode stay as they were. An esc inside the artifact's page reaches the
 * window as a message from its frame (main's guard.ts adds the forwarder), only when the page didn't
 * use it. `on`: false while the maker's thread is slid over (its own esc closes it first).
 */
export function useEscClosesArtifact(close: () => void, on: boolean): void {
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat || e.isComposing || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (popupOpen() || overOpen() || inFind(document.activeElement)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // a zoomed image goes back to fit first; the next esc closes (zoomKeys.ts)
      if (takeZoomKey(e)) return;
      close();
    };
    const onMessage = (e: MessageEvent) => {
      if (!fromArtifactFrame(e.source) || !isFrameEsc(e.data) || popupOpen()) return;
      close();
    };
    // capture, on the window: before the composer's field and every handler under it
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('message', onMessage);
    };
  }, [close, on]);
}

/** The forwarder's message (main's guard.ts ESC_FORWARD). Pure. */
export function isFrameEsc(data: unknown): boolean {
  return typeof data === 'object' && data !== null && (data as { bise?: unknown }).bise === 'esc';
}

function fromArtifactFrame(source: MessageEventSource | null): boolean {
  if (source === null) return false;
  return [...document.querySelectorAll('iframe.art-paper')].some((f) => f instanceof HTMLIFrameElement && f.contentWindow === source);
}

/** A bar slid over the window (the left bar under 1200 px, the maker's thread under 1000): its esc first. */
function overOpen(): boolean {
  return document.querySelector('[data-testid^="app.over."]') !== null;
}

/** The thread's find bar (⌘F) with the focus: its esc closes it first. */
function inFind(el: Element | null): boolean {
  return el instanceof HTMLElement && el.closest('[data-testid="thread.find"]') !== null;
}

/** The centre beside an open artifact: the maker's thread, its one composer about the artifact. */
export function ArtifactThread({ project, id }: { project: string; id: string }) {
  const it = useAllArtifacts(project).find((x) => x.a.id === id);
  const words = useAboutWords(project, id);
  // the project's name in a head, never its workspace id (designer m_20453)
  const name = useProjects().find((p) => p.project === project)?.name;
  if (it === undefined || words === undefined) return <div className="app-art-wait" data-testid="artifact.thread.wait" />;
  // the maker's own thread, archived or not (dim then, '↺ restore' in its head); only the composer
  // goes to the project's main when the maker is archived (words.agent)
  const maker = it.a.agent;
  return (
    <ThreadScreen
      key={`${project}/${maker}/${id}`}
      project={project}
      agent={maker}
      {...(name === undefined ? {} : { projectName: name })}
      artifact={{ id, title: it.a.title, url: it.a.url, to: words.to, placeholder: words.placeholder, agent: words.agent, ...(words.pink === undefined ? {} : { pink: words.pink.tip }), ...(words.end === undefined ? {} : { end: words.end }) }}
    />
  );
}

/** The right column: the artifact, at its share of the window. */
export function ArtifactColumn({ project, id }: { project: string; id: string }) {
  const maker = useAllArtifacts(project).find((x) => x.a.id === id)?.a.agent;
  const close = useClose(project, maker);
  useEscClosesArtifact(close, true);
  return (
    <aside className="app-panel app-art" data-testid="app.art" aria-label="the artifact">
      <ArtifactOpen project={project} id={id} onClose={close} composer={false} />
    </aside>
  );
}

/** Under 1000 px: the artifact takes the width, the maker's composer under it, '◧ <maker>' slides the thread over. */
export function ArtifactNarrow({ project, id }: { project: string; id: string }) {
  const maker = useAllArtifacts(project).find((x) => x.a.id === id)?.a.agent;
  const close = useClose(project, maker);
  const [over, setOver] = useState(false);
  useEscClosesArtifact(close, !over);
  // the maker's name, archived or not: the button opens its own thread (designer m_20453)
  const who = maker ?? MAIN;
  return (
    <div className="app-art-narrow" data-testid="app.art">
      <ArtifactOpen
        project={project}
        id={id}
        onClose={close}
        composer
        lead={
          <Button
            kind="ghost"
            size="sm"
            title={`${who}'s thread`}
            onClick={() => {
              setOver(true);
            }}
            testId="app.art.maker"
          >
            ◧ {who}
          </Button>
        }
      />
      {over && (
        <Over
          side="left"
          thread
          onClose={() => {
            setOver(false);
          }}
        >
          <ArtifactThread project={project} id={id} />
        </Over>
      )}
    </div>
  );
}

/** The centre of an artifact's route: the maker's thread beside the column, or the artifact alone under 1000 px. */
export function ArtifactCentre({ project, id }: { project: string; id: string }) {
  return useInnerWidth() < NARROW_PX ? <ArtifactNarrow project={project} id={id} /> : <ArtifactThread project={project} id={id} />;
}
