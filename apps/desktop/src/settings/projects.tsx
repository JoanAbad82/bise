// settings · projects (bar S.4): his projects in ⌘1 … ⌘9's order, each
// one moved, renamed (its name in bise; the folder keeps its own) or
// removed (asked once: ⏎ remove, esc keep; the folder and its git history
// stay); and the add sheet: a folder he picks or types, or repos found in
// his folders, with "main may land on main" (the repo's flow mode; absent:
// its flow decides). Every change is the core's (project_add, _remove,
// _move, _rename, found_scan: bise_home::projects is the registry's one
// writer). Owner: amb-home.
import { useState } from 'react';
import type { Found, ProjectRow } from '@/proto';
import { Button, Check, Field, Group, Help, Kbd, Toggle } from '@/ds';
import type { SettingsPorts } from './Settings';

/** The projects he orders (bise's home is not one of them), in their order. */
export function ordered(projects: readonly ProjectRow[]): ProjectRow[] {
  return projects.filter((p) => !p.home).sort((a, b) => a.order - b.order);
}

/** What "add" adds: the ticked paths, plus the one typed (once). */
export function addPaths(ticked: readonly string[], typed: string): string[] {
  const t = typed.trim();
  return t !== '' && !ticked.includes(t) ? [...ticked, t] : [...ticked];
}

/** The found repos the sheet offers: not his yet, the most recent first, 8 at most. */
export function offers(found: readonly Found[], projects: readonly ProjectRow[]): Found[] {
  const known = new Set(projects.map((p) => p.path));
  return found.filter((f) => !f.known && !known.has(f.path)).sort((a, b) => b.last_ms - a.last_ms).slice(0, 8);
}

export function Projects({ projects, found, ports }: { projects: readonly ProjectRow[]; found: { dir: string; items: readonly Found[] } | null; ports: SettingsPorts }) {
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
          sub: p.missing === true ? `${p.path} · its folder is gone` : p.path,
          control:
            confirm === p.project ? (
              <span className="settings-row-acts" data-testid={`settings.project.${p.project}.confirm`}>
                <Button kind="danger" onClick={() => { ports.send({ cmd: 'project_remove', project: p.project }); setConfirm(null); }} testId={`settings.project.${p.project}.remove.yes`}>
                  remove
                </Button>
                <Button kind="ghost" onClick={() => { setConfirm(null); }} testId={`settings.project.${p.project}.remove.no`}>
                  keep
                </Button>
              </span>
            ) : (
              <span className="settings-row-acts">
                <Button kind="ghost" disabled={i === 0} onClick={() => { move(p, -1); }} title="up" testId={`settings.project.${p.project}.up`}>↑</Button>
                <Button kind="ghost" disabled={i === ps.length - 1} onClick={() => { move(p, 1); }} title="down" testId={`settings.project.${p.project}.down`}>↓</Button>
                <Button kind="ghost" onClick={() => { setRenaming(p.project); }} testId={`settings.project.${p.project}.rename`}>rename</Button>
                <Button kind="ghost" onClick={() => { setConfirm(p.project); }} testId={`settings.project.${p.project}.remove`}>remove</Button>
              </span>
            ),
        }))}
        help={confirm !== null ? `remove ${ps.find((p) => p.project === confirm)?.name ?? ''} from bise? its folder and its git history stay.` : undefined}
      />
      {sheet ? (
        <AddSheet
          found={found}
          projects={projects}
          ports={ports}
          onDone={() => {
            setSheet(false);
          }}
        />
      ) : (
        <Button
          kind="pri"
          onClick={() => {
            if (found === null) ports.send({ cmd: 'found_scan' });
            setSheet(true);
          }}
          testId="settings.project.add"
        >
          add a project
        </Button>
      )}
    </>
  );
}

function AddSheet({ found, projects, ports, onDone }: { found: { dir: string; items: readonly Found[] } | null; projects: readonly ProjectRow[]; ports: SettingsPorts; onDone: () => void }) {
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [typed, setTyped] = useState('');
  const [land, setLand] = useState(false);
  const list = offers(found?.items ?? [], projects);
  const all = addPaths(ticked, typed);
  const go = () => {
    if (all.length === 0) return;
    for (const path of all) ports.send(land ? { cmd: 'project_add', path, land: true } : { cmd: 'project_add', path });
    onDone();
  };
  const pick = ports.pickFolder;
  return (
    <div
      className="settings-sheet"
      data-testid="settings.add"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onDone();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          go();
        }
      }}
    >
      <div className="settings-sheet-h">add a project</div>
      <Help>a folder, a git repo. its main starts right away.</Help>
      <div className="settings-row-acts">
        <Field
          autoFocus
          placeholder="a folder's path"
          value={typed}
          onChange={(e) => {
            setTyped(e.currentTarget.value);
          }}
          testId="settings.add.path"
        />
        {pick && (
          <Button
            onClick={() => {
              void pick().then((p) => {
                if (p !== null) setTicked((t) => (t.includes(p) ? t : [...t, p]));
              });
            }}
            testId="settings.add.choose"
          >
            choose…
          </Button>
        )}
      </div>
      <Group
        title={found === null ? 'looking in your folders…' : 'found in your folders'}
        testId="settings.add.found"
        items={list.map((f) => ({
          id: f.path,
          label: f.name,
          sub: f.path,
          check: (
            <Check
              on={ticked.includes(f.path)}
              label={f.name}
              onChange={(on) => {
                setTicked((t) => (on ? [...t, f.path] : t.filter((x) => x !== f.path)));
              }}
              testId={`settings.add.found.${f.name}`}
            />
          ),
        }))}
      />
      <Group
        testId="settings.add.opts"
        items={[
          {
            id: 'land',
            label: 'main may land on main',
            sub: land ? 'sb land after the tests, without asking you' : "otherwise your repo's flow decides: a pull request or an approval",
            control: <Toggle on={land} label="main may land on main" onChange={setLand} testId="settings.add.land" />,
          },
        ]}
      />
      <div className="settings-row-acts settings-sheet-acts">
        <Button kind="ghost" onClick={onDone} testId="settings.add.cancel">
          cancel
        </Button>
        <Button kind="pri" disabled={all.length === 0} onClick={go} testId="settings.add.go">
          {all.length === 0 ? 'add' : all.length === 1 ? `add ${base(all[0] ?? '')}` : `add ${String(all.length)} projects`}
        </Button>
      </div>
    </div>
  );
}

function base(p: string): string {
  return p.replace(/\/+$/, '').split('/').pop() ?? p;
}
