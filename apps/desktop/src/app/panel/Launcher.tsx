// src/app/panel · New tab, the launcher (page native-mac mockup 3, §6 'lanceur'): padding 16, a search
// 28 r 8 (artifacts by name, or an address), 'Open' (Files ⌘P, Terminal ⌃`, Side thread ⌥⌘S,
// Changes ⌥⌘D, Browser ⌘L) in rows 40 r 8 (icon 16 + 12, kbd 20), 'Recent' in rows 48 with a 32
// tile (what he opened in a tab last, newest first). A pick opens in this tab's place, as a
// browser's new tab becomes the page. The rows act as their keys do (keys.ts doPanelKey).
// Owner: nm-panel.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppIcon, Input, KindIcon, Kbd, Press, iconKindOf, type AppIconName } from '@/ds';
import { panel } from '@/proto/words_panel.gen';
import { useAllArtifacts } from '@/artifacts';
import { useProjects } from '@/store';
import { useRoute } from '@/app/router';
import { entityKey, type Entity } from '@/shared/entity';
import { doPanelKey, LAUNCH_FOCUS, PANEL_KEYS, type PanelKey } from './keys';
import { openWhat, usePanelState } from './state';
import { useTabLooks } from './look';
import { tabOf } from './model';
import { launchMatches, looksLikeUrl } from './launch';

const OPEN: readonly { readonly k: PanelKey | 'terminal'; readonly icon: AppIconName; readonly label: string; readonly keys: string }[] = [
  { k: 'files', icon: 'file', label: panel.launch_files, keys: PANEL_KEYS.files },
  { k: 'terminal', icon: 'terminal', label: panel.launch_terminal, keys: PANEL_KEYS.terminal },
  { k: 'side', icon: 'side', label: panel.launch_side, keys: PANEL_KEYS.side },
  { k: 'changes', icon: 'changes', label: panel.launch_changes, keys: PANEL_KEYS.changes },
  { k: 'browser', icon: 'browser', label: panel.launch_browser, keys: PANEL_KEYS.browser },
];

/** A New tab: search, Open, Recent. `tabId`: its own tab, which a pick replaces. */
export function Launcher({ tabId, shown }: { tabId: string; shown: boolean }) {
  const route = useRoute();
  const projects = useProjects();
  const home = projects.find((p) => p.home)?.project;
  const recent = usePanelState().recent;
  const look = useTabLooks();
  const arts = useAllArtifacts();
  const [q, setQ] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const bise = (window as Partial<Window>).bise;
  const ctx = {
    route,
    home,
    openFolder: (p: string) => {
      const path = projects.find((x) => x.project === p)?.path;
      if (path !== undefined && path !== '') void bise?.openPath(path);
    },
  };
  // ⌘L (Browser) and a fresh New tab: the field takes the keys
  useEffect(() => {
    if (!shown) return;
    field.current?.focus();
    const on = () => {
      field.current?.focus();
    };
    window.addEventListener(LAUNCH_FOCUS, on);
    return () => {
      window.removeEventListener(LAUNCH_FOCUS, on);
    };
  }, [shown]);
  const found = useMemo(() => launchMatches(arts, q), [arts, q]);
  const pick = (e: Entity) => {
    openWhat({ kind: 'thing', e }, tabId);
  };
  const enter = () => {
    const first = found[0];
    if (first !== undefined) pick({ kind: 'artifact', project: first.project, id: first.a.id });
    else if (looksLikeUrl(q)) void bise?.openExternal(q.includes('://') ? q.trim() : `https://${q.trim()}`);
  };
  return (
    <div className="pn-launch" data-testid="app.panel.launcher">
      <label className="pn-search">
        <AppIcon name="search" size={14} />
        <Input
          ref={field}
          look="pn-search-in"
          value={q}
          placeholder={panel.launch_search}
          aria-label={panel.launch_search}
          onChange={(e) => {
            setQ(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              enter();
            }
          }}
          data-testid="app.panel.launcher.search"
        />
      </label>
      {q.trim() === '' ? (
        <>
          <h3 className="pn-lh">{panel.launch_open}</h3>
          {OPEN.map((o) => (
            <Press
              key={o.k}
              look="pn-li"
              onClick={() => {
                doPanelKey(o.k, ctx, tabId);
              }}
              data-testid={`app.panel.launcher.${o.k}`}
            >
              <AppIcon name={o.icon} size={16} />
              <span className="pn-li-t">{o.label}</span>
              <Kbd>{o.keys}</Kbd>
            </Press>
          ))}
          <h3 className="pn-lh">{panel.launch_recent}</h3>
          {recent.length === 0 ? (
            <p className="pn-none" data-testid="app.panel.launcher.none">
              {panel.launch_none}
            </p>
          ) : (
            recent.map((e) => {
              const l = look(tabOf({ kind: 'thing', e }));
              const sub = e.kind === 'artifact' ? arts.find((x) => x.project === e.project && x.a.id === e.id) : undefined;
              return (
                <Recent
                  key={entityKey(e)}
                  icon={l.icon}
                  title={l.title}
                  sub={sub === undefined ? '' : panel.launch_kind_by({ kind: sub.a.kind, who: sub.a.agent })}
                  onPick={() => {
                    pick(e);
                  }}
                  testId={`app.panel.launcher.recent.${entityKey(e)}`}
                />
              );
            })
          )}
        </>
      ) : found.length === 0 ? (
        <p className="pn-none" data-testid="app.panel.launcher.nomatch">
          {panel.launch_no_match}
        </p>
      ) : (
        found.map((x) => (
          <Recent
            key={`${x.project}/${x.a.id}`}
            icon={<KindIcon kind={iconKindOf(x.a)} size={16} />}
            title={x.a.title}
            sub={panel.launch_kind_by({ kind: x.a.kind, who: x.a.agent })}
            onPick={() => {
              pick({ kind: 'artifact', project: x.project, id: x.a.id });
            }}
            testId={`app.panel.launcher.found.${x.project}/${x.a.id}`}
          />
        ))
      )}
    </div>
  );
}

function Recent({ icon, title, sub, onPick, testId }: { icon: ReactNode; title: string; sub: string; onPick: () => void; testId: string }) {
  return (
    <Press look="pn-rec" onClick={onPick} data-testid={testId}>
      <span className="pn-tile">{icon}</span>
      <span className="pn-rec-w">
        <span className="pn-rec-t">{title}</span>
        {sub !== '' && <span className="pn-rec-s">{sub}</span>}
      </span>
    </Press>
  );
}
