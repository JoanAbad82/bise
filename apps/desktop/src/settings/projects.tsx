// settings · projects (bar S.4): his projects in ⌘1 … ⌘9's order, each
// one moved, renamed (its name in bise; the folder keeps its own) or
// removed (asked once: ⏎ remove, esc keep; the folder and its git history
// stay); 'add a project' opens the add sheet (AddSheet.tsx, the same one
// as the sidebar's). Every change is the core's (project_add, _remove,
// _move, _rename, found_scan: bise_home::projects is the registry's one
// writer). Owner: amb-home.
import { useState } from 'react';
import type { Found, ProjectRow } from '@/proto';
import { Act, Button, Field, Group, IconButton, Kbd } from '@/ds';
import { useBroken } from '@/store';
import type { SettingsPorts } from './Settings';
import { AddSheet } from './AddSheet';
import { brokenLine } from './add';

/** The projects he orders (bise's home is not one of them), in their order. */
export function ordered(projects: readonly ProjectRow[]): ProjectRow[] {
  return projects.filter((p) => !p.home).sort((a, b) => a.order - b.order);
}

/**
 * A row's line under its name: its folder, and what's wrong with it in plain words (its folder
 * gone; its hub couldn't start: the core's `down`, architect m_18354), never a silent row. Pure.
 */
export function projectSub(p: ProjectRow): string {
  if (p.missing === true) return `${p.path} · its folder is gone`;
  if (p.down != null && p.down !== '') return `${p.path} · ${p.down}`;
  return p.path;
}

export { addPaths, offers } from './add';

/** `found` stays in the props (pages.tsx passes it); the sheet reads the store's own. */
export function Projects({ projects, ports }: { projects: readonly ProjectRow[]; found?: readonly Found[]; ports: SettingsPorts }) {
  const ps = ordered(projects);
  const broken = useBroken();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const move = (p: ProjectRow, by: number) => {
    ports.send({ cmd: 'project_move', project: p.project, order: Math.max(1, ps.indexOf(p) + 1 + by) });
  };
  return (
    <>
      <Group
        testId="settings.projects"
        items={ps.map((p, i) => ({
          id: p.project,
          label:
            renaming === p.project ? (
              <Field
                autoFocus
                defaultValue={p.name}
                placeholder="its name in bise, then ⏎"
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
            ) : (
              <>
                {i < 9 && <Kbd>{`⌘${String(i + 1)}`}</Kbd>} {p.name}
              </>
            ),
          sub: projectSub(p),
          control:
            confirm === p.project ? (
              <span className="settings-row-acts" data-testid={`settings.project.${p.project}.confirm`}>
                {/* designer m_18736: nothing ghost in rows; remove is an Act in the error tone, asked once */}
                <Act tone="err" onClick={() => { ports.send({ cmd: 'project_remove', project: p.project }); setConfirm(null); }} testId={`settings.project.${p.project}.remove.yes`}>
                  remove
                </Act>
                <Act onClick={() => { setConfirm(null); }} testId={`settings.project.${p.project}.remove.no`}>
                  keep
                </Act>
              </span>
            ) : (
              <span className="settings-row-acts">
                <IconButton size="row" label="move up" disabled={i === 0} onClick={() => { move(p, -1); }} testId={`settings.project.${p.project}.up`}>↑</IconButton>
                <IconButton size="row" label="move down" disabled={i === ps.length - 1} onClick={() => { move(p, 1); }} testId={`settings.project.${p.project}.down`}>↓</IconButton>
                <Act onClick={() => { setRenaming(p.project); }} testId={`settings.project.${p.project}.rename`}>rename</Act>
                <Act tone="err" onClick={() => { setConfirm(p.project); }} testId={`settings.project.${p.project}.remove`}>remove</Act>
              </span>
            ),
        }))}
        help={
          confirm !== null
            ? `remove ${ps.find((p) => p.project === confirm)?.name ?? ''} from bise? its folder and its git history stay.`
            : broken !== null
              ? brokenLine(broken)
              : undefined
        }
      />
      <Button
        kind="pri"
        onClick={() => {
          setSheet(true);
        }}
        testId="settings.project.add"
      >
        add a project
      </Button>
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
