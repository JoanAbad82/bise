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
import type { SettingsPorts } from './Settings';
import { settings } from '@/proto/words.gen';
import { AddSheet } from './AddSheet';

/** The projects he orders (bise's home is not one of them), in their order. */
export function ordered(projects: readonly ProjectRow[]): ProjectRow[] {
  return projects.filter((p) => !p.home).sort((a, b) => a.order - b.order);
}

/**
 * A row's line under its name: its folder, and what's wrong with it in plain words (its folder
 * gone; its hub couldn't start: the core's `down`, architect m_18354), never a silent row. Pure.
 */
export function projectSub(p: ProjectRow): string {
  if (p.missing === true) return settings.project_gone({ path: p.path });
  if (p.down != null && p.down !== '') return settings.project_down({ path: p.path, why: p.down });
  return p.path;
}

export { addPaths, offers } from './add';

/** `found` stays in the props (pages.tsx passes it); the sheet reads the store's own. */
export function Projects({ projects, ports }: { projects: readonly ProjectRow[]; found?: readonly Found[]; ports: SettingsPorts }) {
  const ps = ordered(projects);
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
                  {settings.project_remove}
                </Act>
                <Act onClick={() => { setConfirm(null); }} testId={`settings.project.${p.project}.remove.no`}>
                  {settings.project_keep}
                </Act>
              </span>
            ) : (
              <span className="settings-row-acts">
                <IconButton size="row" label={settings.project_up} disabled={i === 0} onClick={() => { move(p, -1); }} testId={`settings.project.${p.project}.up`}>↑</IconButton>
                <IconButton size="row" label={settings.project_down_move} disabled={i === ps.length - 1} onClick={() => { move(p, 1); }} testId={`settings.project.${p.project}.down`}>↓</IconButton>
                <Act onClick={() => { setRenaming(p.project); }} testId={`settings.project.${p.project}.rename`}>{settings.project_rename}</Act>
                <Act tone="err" onClick={() => { setConfirm(p.project); }} testId={`settings.project.${p.project}.remove`}>{settings.project_remove}</Act>
              </span>
            ),
        }))}
        help={
          confirm !== null
            ? settings.project_remove_ask({ name: ps.find((p) => p.project === confirm)?.name ?? '' })
            : // a broken core says so in the window's top line (CoreLine), its one place (designer m_18973)
              undefined
        }
      />
      <Button
        kind="pri"
        onClick={() => {
          setSheet(true);
        }}
        testId="settings.project.add"
      >
        {settings.add_project}
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
