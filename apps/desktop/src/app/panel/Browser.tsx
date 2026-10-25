// src/app/panel · an artifact in a tab, the browser (page native-mac mockup 4, native-mac-qa §7): the
// panel at 640 (model.ts widthOf 'page'), an address bar (← → ↻, the address 28 r 8, ↗ his
// browser, '…' the artifact's menu) over the page (artifacts' ArtifactOpen). ← and → walk the
// artifacts this tab showed (a link in the page names another: it opens here, as a browser's tab
// follows a link); ↻ loads the page again. 'open in a window' (the bar's button, openWindow kind
// artifact) gives it a window of its own. The artifact no longer replaces the thread in the centre
// (ArtifactView's centre and column modes are gone, rule 7): the centre keeps the thread, the
// maker's composer is the centre's. Owner: nm-panel.
import { useEffect, useRef, useState } from 'react';
import { AppIcon, IconButton, KindIcon, MoreButton, iconKindOf, tipAttrs } from '@/ds';
import { panel } from '@/proto/words_panel.gen';
import { ArtifactOpen, ArtifactVersions, useAllArtifacts } from '@/artifacts';
import { useEntityMenu } from '@/app/menus/use';
import { formatRoute } from '@/app/route';
import { closeTabId } from './state';
import { isFrameEsc } from '@/app/ArtifactView';

/** An artifact's tab: its address bar and its page. */
export function Browser({ project, id, tabId }: { project: string; id: string; tabId: string }) {
  const a = useAllArtifacts(project).find((x) => x.a.id === id)?.a;
  const menu = useEntityMenu({ kind: 'artifact', project, id });
  // ↻: the page mounts again (its frame loads it again)
  const [load, setLoad] = useState(0);
  // the address is the version picker (the head's 'page · v2 ⌄' it replaces)
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const [now] = useState(() => Date.now());
  const pill = useRef<HTMLButtonElement>(null);
  const bise = (window as Partial<Window>).bise;
  const shown = version ?? a?.version ?? 0;
  // an esc the page didn't use (its frame forwards it, guard.ts ESC_FORWARD): the tab closes, as ✕
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (!isFrameEsc(e.data)) return;
      const mine = document.querySelector<HTMLIFrameElement>(`[data-testid="app.panel.browser"][data-artifact="${CSS.escape(id)}"] iframe.art-paper`);
      if (mine !== null && mine.contentWindow === e.source) closeTabId(tabId);
    };
    window.addEventListener('message', on);
    return () => {
      window.removeEventListener('message', on);
    };
  }, [id, tabId]);
  const address = a === undefined ? id : `${a.kind} · ${a.title} v${String(shown)}`;
  return (
    <div className="pn-browser" data-testid="app.panel.browser" data-artifact={id}>
      <div className="pn-addr" data-testid="app.panel.addr">
        <IconButton label={panel.addr_back} size="bar" disabled testId="app.panel.addr.back">
          <AppIcon name="back" size={16} />
        </IconButton>
        <IconButton label={panel.addr_forward} size="bar" disabled testId="app.panel.addr.forward">
          <AppIcon name="forward" size={16} />
        </IconButton>
        <IconButton
          label={panel.addr_reload}
          size="bar"
          onClick={() => {
            setLoad((n) => n + 1);
          }}
          testId="app.panel.addr.reload"
        >
          <AppIcon name="refresh" size={16} />
        </IconButton>
        <button
          ref={pill}
          type="button"
          className="pn-url"
          aria-haspopup="menu"
          aria-label={address}
          {...tipAttrs(a?.url ?? address)}
          disabled={a === undefined}
          onClick={() => {
            setPicking((x) => !x);
          }}
          data-testid="app.panel.addr.url"
        >
          {a === undefined ? <AppIcon name="file" size={14} /> : <KindIcon kind={iconKindOf(a)} size={14} />}
          <span className="pn-url-t">{address}</span>
          <AppIcon name="down" size={14} />
        </button>
        {picking && a !== undefined && (
          <ArtifactVersions
            a={a}
            shown={shown}
            now={now}
            anchor={pill}
            onClose={() => {
              setPicking(false);
            }}
            onPick={(n) => {
              setVersion(n === a.version ? undefined : n);
              setPicking(false);
            }}
          />
        )}
        <IconButton
          label={panel.addr_out}
          size="bar"
          disabled={a === undefined || a.url === ''}
          onClick={() => {
            if (a !== undefined) void bise?.openExternal(a.url);
          }}
          testId="app.panel.addr.out"
        >
          <AppIcon name="open" size={16} />
        </IconButton>
        <IconButton
          label={panel.addr_window}
          size="bar"
          onClick={() => {
            bise?.openWindow({ kind: 'artifact', route: formatRoute({ screen: 'artifacts', project, id }) });
          }}
          testId="app.panel.addr.window"
        >
          <AppIcon name="window" size={16} />
        </IconButton>
        <MoreButton menu={menu} testId="app.panel.addr.more" />
      </div>
      <div className="pn-page">
        <ArtifactOpen
          key={load}
          project={project}
          id={id}
          bare
          {...(version === undefined ? {} : { version })}
          composer={false}
          onClose={() => {
            closeTabId(tabId);
          }}
        />
      </div>
    </div>
  );
}
