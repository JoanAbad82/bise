// settings · projects (bar S.4; designer m_41841): his projects in ⌘1 … ⌘9's order, one 32 px row
// each: the name, its folder short ('~/lab/…/harness', the whole path in the tip), its ⌘N key at
// the right, then a ⋯ (shown on hover and keyboard focus, its slot always kept) whose menu (also on
// a right-click on the row) renames it (its name in bise; the folder keeps its own), moves it
// (⌥⌘↑ ⌥⌘↓ too) or removes it (asked once: ⏎ remove, esc keep; the folder and its git history
// stay). A drag on the row moves it: the row lifts, a 2 px line marks where it lands, esc cancels.
// 'add a project…' opens the add sheet (AddSheet.tsx, the same one as the sidebar's). Every change
// is the core's (project_add, _remove, _move, _rename, found_scan: bise_home::projects is the
// registry's one writer). Owner: amb-home.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Found, ProjectRow } from '@/proto';
import { Act, Button, Field, Help, IconButton, Kbd, PickerPop, tipAttrs } from '@/ds';
import type { SettingsPorts } from './Settings';
import { settings } from '@/proto/words.gen';
import { AddSheet } from './AddSheet';
import { dropIndex, movedTo, shortPath } from './projectRows';

/** The projects he orders (bise's home is not one of them), in their order. */
export function ordered(projects: readonly ProjectRow[]): ProjectRow[] {
  return projects.filter((p) => !p.home).sort((a, b) => a.order - b.order);
}

/**
 * A row's words after its name: its folder, and what's wrong with it in plain words (its folder
 * gone; its hub couldn't start: the core's `down`, architect m_18354), never a silent row. Pure.
 */
export function projectSub(p: ProjectRow, home?: string): string {
  const path = shortPath(p.path, home);
  if (p.missing === true) return settings.project_gone({ path });
  if (p.down != null && p.down !== '') return settings.project_down({ path, why: p.down });
  return path;
}

export { addPaths, offers } from './add';

/** the pointer travel before a press on a row becomes a drag */
const DRAG_PX = 4;

type Drag = { readonly from: number; readonly y0: number; readonly dy: number; readonly to: number; readonly on: boolean };

/** `found` stays in the props (pages.tsx passes it); the sheet reads the store's own. */
export function Projects({ projects, ports, home }: { projects: readonly ProjectRow[]; found?: readonly Found[]; ports: SettingsPorts; home?: string }) {
  const ps = ordered(projects);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [sheet, setSheet] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement | null>(null);
  const move = (p: ProjectRow, order: number) => {
    ports.send({ cmd: 'project_move', project: p.project, order });
  };
  const step = (i: number, by: number) => {
    const p = ps[i];
    if (p !== undefined && i + by >= 0 && i + by < ps.length) move(p, i + 1 + by);
  };

  // esc while dragging puts the row back
  useEffect(() => {
    if (drag === null) return undefined;
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setDrag(null);
      }
    };
    window.addEventListener('keydown', esc, true);
    return () => {
      window.removeEventListener('keydown', esc, true);
    };
  }, [drag]);

  const middles = (): number[] =>
    [...(list.current?.querySelectorAll<HTMLElement>('.sp-row') ?? [])].map((r) => {
      const b = r.getBoundingClientRect();
      return b.top + b.height / 2;
    });
  const down = (i: number) => (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || renaming !== null || confirm !== null) return;
    // a press on the ⋯ or a field is theirs
    if ((e.target as HTMLElement).closest('button, input') !== null) return;
    // a press never focuses the row: its ring and its ⋯ are the keyboard's only (designer m_41911)
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ from: i, y0: e.clientY, dy: 0, to: i, on: false });
  };
  const moving = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    const dy = e.clientY - drag.y0;
    const on = drag.on || Math.abs(dy) > DRAG_PX;
    setDrag({ ...drag, dy, on, to: on ? dropIndex(middles(), e.clientY) : drag.from });
  };
  const up = () => {
    if (drag === null) return;
    const p = ps[drag.from];
    const at = drag.on ? movedTo(drag.from, drag.to) : null;
    setDrag(null);
    if (p !== undefined && at !== null) move(p, at);
  };
  const key = (i: number, p: ProjectRow) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.metaKey && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      step(i, e.key === 'ArrowUp' ? -1 : 1);
    } else if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
      e.preventDefault();
      setMenu(p.project);
    }
  };
  const asked = ps.find((p) => p.project === confirm);
  return (
    <>
      <div ref={list} className="sp-list" role="list" data-testid="settings.projects" data-drag={drag?.on === true || undefined}>
        {ps.map((p, i) => {
          const lifted = drag?.on === true && drag.from === i;
          const dropHere = drag?.on === true && drag.to === i && movedTo(drag.from, i) !== null;
          const dropEnd = drag?.on === true && i === ps.length - 1 && drag.to === ps.length && movedTo(drag.from, ps.length) !== null;
          return (
            <div
              key={p.project}
              role="listitem"
              tabIndex={0}
              className="sp-row"
              data-testid={`settings.projects.${p.project}`}
              data-lifted={lifted || undefined}
              data-drop={dropHere ? 'before' : dropEnd ? 'after' : undefined}
              data-menu={menu === p.project || undefined}
              style={lifted ? { transform: `translateY(${String(drag.dy)}px)` } : undefined}
              onPointerDown={down(i)}
              onPointerMove={moving}
              onPointerUp={up}
              onPointerCancel={() => {
                setDrag(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu(p.project);
              }}
              onKeyDown={key(i, p)}
            >
              {renaming === p.project ? (
                <span className="sp-name">
                  <Field
                    autoFocus
                    defaultValue={p.name}
                    placeholder={settings.project_name_field}
                    testId={`settings.project.${p.project}.name`}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setRenaming(null);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const name = e.currentTarget.value.trim();
                        if (name !== '' && name !== p.name) ports.send({ cmd: 'project_rename', project: p.project, name });
                        setRenaming(null);
                      }
                    }}
                  />
                </span>
              ) : (
                <span className="sp-name">
                  <span className="sp-n">{p.name}</span>
                  {/* its tip: the whole folder, never cut (designer m_41911) */}
                  <span className={p.missing === true || (p.down != null && p.down !== '') ? 'sp-path err' : 'sp-path'} data-testid={`settings.project.${p.project}.path`}
                    {...tipAttrs(drag === null ? p.path : undefined)}>
                    {projectSub(p, home)}
                  </span>
                </span>
              )}
              {confirm === p.project ? (
                <span className="settings-row-acts" data-testid={`settings.project.${p.project}.confirm`}>
                  {/* designer m_18736: remove is an Act in the error tone, asked once */}
                  <Act tone="err" onClick={() => { ports.send({ cmd: 'project_remove', project: p.project }); setConfirm(null); }} testId={`settings.project.${p.project}.remove.yes`}>
                    {settings.project_remove}
                  </Act>
                  <Act onClick={() => { setConfirm(null); }} testId={`settings.project.${p.project}.remove.no`}>
                    {settings.project_keep}
                  </Act>
                </span>
              ) : (
                <span className="sp-end">
                  {/* the ⋯'s kept slot sits before the keycap: the keycap ends 12 inside the box like every right-side control (designer m_43941) */}
                  <span className="sp-more">
                    <IconButton
                      size="bar"
                      label={settings.project_menu({ name: p.name })}
                      ref={menu === p.project ? more : undefined}
                      onClick={() => {
                        setMenu(menu === p.project ? null : p.project);
                      }}
                      testId={`settings.project.${p.project}.more`}
                    >
                      ⋯
                    </IconButton>
                  </span>
                  {i < 9 && <Kbd>{`⌘${String(i + 1)}`}</Kbd>}
                </span>
              )}
              {menu === p.project && (
                <PickerPop
                  anchor={more}
                  align="end"
                  groups={[
                    {
                      id: 'edit',
                      rows: [
                        { id: 'rename', name: settings.project_rename, testId: `settings.project.${p.project}.rename` },
                        { id: 'up', name: settings.project_up, trailing: '⌥⌘↑', disabled: i === 0, testId: `settings.project.${p.project}.up` },
                        { id: 'down', name: settings.project_down_move, trailing: '⌥⌘↓', disabled: i === ps.length - 1, testId: `settings.project.${p.project}.down` },
                      ],
                    },
                    {
                      id: 'remove',
                      look: 'sp-menu-err',
                      rows: [{ id: 'remove', name: settings.project_remove, testId: `settings.project.${p.project}.remove` }],
                    },
                  ]}
                  onPick={(id) => {
                    setMenu(null);
                    if (id === 'rename') setRenaming(p.project);
                    else if (id === 'up') step(i, -1);
                    else if (id === 'down') step(i, 1);
                    else if (id === 'remove') setConfirm(p.project);
                  }}
                  onClose={() => {
                    setMenu(null);
                  }}
                  testId={`settings.project.${p.project}.menu`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* a broken core says so in the window's top line (CoreLine), its one place (designer m_18973) */}
      {asked !== undefined && <Help testId="settings.projects.ask">{settings.project_remove_ask({ name: asked.name })}</Help>}
      <span className="sp-add">
        {/* a 28 button under the box, like Add a key (designer m_43851) */}
        <Button
          size="sm"
          onClick={() => {
            setSheet(true);
          }}
          testId="settings.project.add"
        >
          {settings.add_project_more}
        </Button>
      </span>
      <AddSheet
        open={sheet}
        onClose={() => {
          setSheet(false);
        }}
        send={ports.send}
        pickFolder={ports.pickFolder}
      />
    </>
  );
}
