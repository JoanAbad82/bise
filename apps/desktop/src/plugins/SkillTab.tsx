// A skill in a tab of the right panel (page skill-panel, Gabriel's pick A; designer m_43059): a
// skill's row on the plugins page or a plugin's page opens it like an artifact, one scroll. Its head:
// its name in mono, its whole description as the lead, a facts line (its plugin · where it comes
// from · on / off / always on · when the agents use it), 'Open in editor' and its '…' (Show in
// Finder, Copy path, Turn off when it can be). Then its frontmatter as key rows (a long value folds
// ▸; none: no block; broken: '▲ the frontmatter can't be read: line N' and the raw text), SKILL.md
// through the markdown reader ('source' shows the raw file), then its folder's other files: a .md
// opens here in its place, any other file in his editor. The path is cut in the middle, whole in its
// tip. The file comes through main (window.bise.readSkill, main/skillfile.ts: fenced to the rows'
// skill paths). Owner: nm-pages-b.
import { useEffect, useState } from 'react';
import { AppIcon, Button, Empty, GroupLabel, IconButton, Press, tipAttrs } from '@/ds';
import { ds } from '@/proto/words_ds.gen';
import { pages } from '@/proto/words_pages.gen';
import type { Plugin, PluginPart } from '@/proto';
import type { BiseApi, PopupItem, SkillRead } from '@/shared/api';
import { usePlugins, useStore } from '@/store';
import { Markdown } from '@/thread/Markdown';
import { folds, readFront, type Front } from './frontmatter';
import { tagsOf, titleOf } from './model';
import './plugins.css';

const bise = (): Partial<BiseApi> | undefined => (window as { bise?: Partial<BiseApi> }).bise;

/** A path cut in its middle to `n` characters ('~/.agents/…/docs/SKILL.md'), home folded. Pure. */
export function midCut(path: string, home: string | undefined, n = 48): string {
  const p = home !== undefined && home !== '' && path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
  if (p.length <= n) return p;
  const head = Math.ceil((n - 1) / 2);
  return `${p.slice(0, head)}…${p.slice(p.length - (n - 1 - head))}`;
}

/** The skill `name` of plugin `plugin` in the rows, with its plugin row. Pure. */
export function skillOf(rows: readonly Plugin[] | null, plugin: string, name: string): { p: Plugin; s: PluginPart } | undefined {
  const p = (rows ?? []).find((r) => (r.id === '' ? r.name : r.id) === plugin);
  const s = p?.parts?.find((x) => x.kind === 'skill' && x.name === name);
  return p !== undefined && s !== undefined ? { p, s } : undefined;
}

/** A skill tab's body. */
export function SkillTab({ plugin, name }: { plugin: string; name: string }) {
  const rows = usePlugins();
  const store = useStore();
  const found = skillOf(rows, plugin, name);
  if (found === undefined) return <div className="plg-skill" data-testid="plugins.skill"><Empty testId="plugins.skill.none" title={pages.skill_gone} /></div>;
  return (
    <SkillView p={found.p} s={found.s} read={bise()?.readSkill}
      ports={{
        setOn: (on) => {
          store.command({ cmd: 'plugin_set', name: found.s.id, on });
        },
      }} />
  );
}

export interface SkillPorts {
  /** turn the skill on or off (plugin_set on its part id) */
  setOn: (on: boolean) => void;
}

/** A skill tab from its rows and a reader (tests give a fake one). */
export function SkillView({ p, s, read, ports, home = bise()?.home }: { p: Plugin; s: PluginPart; read: ((path: string, file?: string) => Promise<SkillRead>) | undefined; ports: SkillPorts; home?: string | undefined }) {
  const path = s.path ?? undefined;
  // the file shown: SKILL.md (null) or a .md of its folder
  const [file, setFile] = useState<string | null>(null);
  const [got, setGot] = useState<{ key: string; r: SkillRead } | null>(null);
  const [source, setSource] = useState(false);
  const key = `${path ?? ''}#${file ?? ''}`;
  useEffect(() => {
    if (path === undefined || read === undefined) return undefined;
    let live = true;
    void read(path, file ?? undefined).then((r) => {
      if (live) setGot({ key, r });
    });
    return () => {
      live = false;
    };
  }, [path, file, read, key]);
  const r = got?.key === key ? got.r : null;
  const tid = 'plugins.skill';
  const locked = p.locked === true;
  const openEditor = (at: string) => {
    void bise()?.openPath?.(at);
  };
  const folder = r !== null && 'folder' in r ? r.folder : undefined;
  // the file's own name ('SKILL.md'): a name on disk, not a word
  const own = path?.split('/').at(-1) ?? '';
  const more = () => {
    if (path === undefined) return;
    const items: PopupItem[] = [
      { id: 'finder', label: pages.skill_show_finder },
      { id: 'copy', label: pages.skill_copy_path },
      ...(!locked && s.on ? [{ type: 'separator' as const }, { id: 'off', label: pages.skill_turn_off }] : []),
    ];
    void bise()?.popupMenu?.(items).then((id) => {
      if (id === 'finder') void bise()?.showInFinder?.(path);
      else if (id === 'copy') void bise()?.copy?.(path);
      else if (id === 'off') ports.setOn(false);
    });
  };
  // the whole description: the row's, else the frontmatter's once the file came
  const front = r !== null && 'text' in r && file === null ? readFront(r.text) : null;
  const say = s.what ?? (front?.kind === 'ok' ? (front.keys.find((k) => k.key === 'description')?.value ?? '') : '');
  const facts = [titleOf(p), tagsOf(p)[0] ?? p.scope, locked ? pages.skill_always_on : s.on ? pages.skill_on : pages.skill_off, pages.skill_used_when];
  return (
    <div className="plg-skill" data-testid={tid}>
      <header className="plg-skill-head">
        <h1 className="plg-skill-name" data-testid={`${tid}.name`}>{s.name}</h1>
        {say !== '' && <p className="plg-skill-say" data-testid={`${tid}.say`}>{say}</p>}
        <p className="plg-skill-facts" data-testid={`${tid}.facts`}>{facts.join(' · ')}</p>
        {path !== undefined && (
          <div className="plg-skill-acts">
            <Button kind="ghost" onClick={() => { openEditor(file === null || folder === undefined ? path : `${folder}/${file}`); }} testId={`${tid}.editor`}>{pages.skill_open_editor}</Button>
            <IconButton label={ds.more_actions} onClick={more} testId={`${tid}.more`}><AppIcon name="more" size={16} /></IconButton>
            <span className="plg-skill-path" {...tipAttrs(path)} data-testid={`${tid}.path`}>{midCut(path, home)}</span>
          </div>
        )}
      </header>
      {path === undefined || read === undefined ? (
        <Empty testId={`${tid}.nopath`} title={pages.skill_no_file} />
      ) : r === null ? (
        <p className="plg-dim" data-testid={`${tid}.loading`}>{pages.skill_reading}</p>
      ) : 'error' in r ? (
        <Empty testId={`${tid}.error`} title={r.error === 'gone' ? pages.skill_gone : pages.skill_not_allowed} />
      ) : (
        <>
          {file !== null && (
            <Press look="plg-skill-back" onClick={() => { setFile(null); }} data-testid={`${tid}.back`}><AppIcon name="back" size={14} />{own}</Press>
          )}
          {file === null && <Frontmatter front={readFront(r.text)} testId={`${tid}.front`} />}
          <section className="plg-skill-md" aria-label={file ?? own}>
            <GroupLabel testId={`${tid}.md.label`}>
              {file ?? own}
              <span className="plg-skill-src">
                <Press look="plg-skill-toggle" aria-pressed={source} onClick={() => { setSource((x) => !x); }} data-testid={`${tid}.source`}>{source ? pages.skill_rendered : pages.skill_source}</Press>
              </span>
            </GroupLabel>
            {source ? (
              <pre className="plg-skill-raw" data-testid={`${tid}.raw`}>{r.text}</pre>
            ) : (
              <div className="plg-skill-body b-md" data-testid={`${tid}.body`}>
                <Markdown text={file === null ? bodyOf(readFront(r.text), r.text) : r.text} onLink={() => undefined} />
              </div>
            )}
            {r.cut && <p className="plg-dim" data-testid={`${tid}.cut`}>{pages.skill_cut}</p>}
          </section>
          {r.files.length > 0 && (
            <section className="plg-skill-files" aria-label={pages.skill_files}>
              <GroupLabel count={r.files.length + r.more} testId={`${tid}.files.label`}>{pages.skill_files}</GroupLabel>
              {r.files.map((f) => {
                const md = !f.dir && f.name.toLowerCase().endsWith('.md');
                return (
                  <Press key={f.name} look="plg-skill-file" {...tipAttrs(`${r.folder}/${f.name}`)} data-testid={`${tid}.file.${f.name}`}
                    onClick={() => {
                      // a .md opens here; anything else in his editor (never read through the fence)
                      if (md) setFile(f.name);
                      else openEditor(`${r.folder}/${f.name}`);
                    }}>
                    <AppIcon name={f.dir ? 'folder' : 'file'} size={14} />
                    <span className="plg-mono">{f.name}</span>
                    {!md && <AppIcon name="open" size={14} />}
                  </Press>
                );
              })}
              {r.more > 0 && <p className="plg-dim">{pages.skill_more_files({ n: r.more })}</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** The markdown under the frontmatter (the whole file when it has none or it is broken). Pure. */
function bodyOf(f: Front, text: string): string {
  return f.kind === 'ok' ? f.body : f.kind === 'broken' ? f.body : text;
}

/** The frontmatter's key rows (a long one folds ▸), or the line it can't read and its raw text; none: nothing. */
function Frontmatter({ front, testId }: { front: Front; testId: string }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  if (front.kind === 'none') return null;
  return (
    <section className="plg-skill-front" aria-label={pages.skill_frontmatter} data-testid={testId}>
      <GroupLabel>{pages.skill_frontmatter}</GroupLabel>
      {front.kind === 'broken' ? (
        <>
          <p className="plg-skill-broken" role="alert" data-testid={`${testId}.broken`}><AppIcon name="close" size={14} />{pages.skill_front_broken({ line: front.line })}</p>
          <pre className="plg-skill-raw">{front.raw}</pre>
        </>
      ) : (
        <dl className="plg-kv">
          {front.keys.map((k) => {
            const long = folds(k.value);
            const shown = !long || open.has(k.key);
            return (
              <div key={k.key} className="plg-kv-row" data-testid={`${testId}.${k.key}`}>
                <dt className="plg-mono">{k.key}</dt>
                <dd>
                  {long && (
                    <Press look="plg-kv-fold" aria-expanded={shown} onClick={() => { setOpen((s) => { const n = new Set(s); if (n.has(k.key)) n.delete(k.key); else n.add(k.key); return n; }); }} data-testid={`${testId}.${k.key}.fold`}>
                      <AppIcon name={shown ? 'down' : 'right'} size={14} />
                    </Press>
                  )}
                  <span className={shown ? 'plg-kv-v' : 'plg-kv-v cut'}>{k.value}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
