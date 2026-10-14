// The composer box's bottom row (designer's composer-strip A, m_23965 (4)): what he changes about
// where his words go. Left: '+' (attach files, macOS's panel through window.bise.pickFiles) and the
// approvals mode menu ('yolo ⌄' / 'approvals ⌄'); right, before send: the model and effort menu
// ('<b>opus 5.5</b> high ⌄'). Menus get the 6% hover and open above the box. Answering a card: '+'
// only (a model or a mode means nothing for an answer). Short: the effort label goes into its menu
// (css), the mode never drops. Owner: amb-win.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu, MenuItem, MenuSep, Press } from '@/ds';
import type { Agent } from '@/proto';
import { useApprovals, useModels, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { modelOrSetup } from '@/settings';
import { effortsFor, modelGroups, setEffort } from '@/agents/actions';
import { flashWords } from '@/composer';
import { modeWords, modelWords } from './tools';

type Open = 'mode' | 'model' | null;

/** A menu's place: its button, and the menu above the box while open; a press outside or esc closes it. */
function Drop({ open, onClose, button, children }: { open: boolean; onClose: () => void; button: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open, onClose]);
  return (
    <span className="cmp-drop" ref={ref}>
      {button}
      {open && <span className="cmp-up">{children}</span>}
    </span>
  );
}

/** '+': his files, by macOS's panel, as chips in the field. */
export function AttachTool({ onPick }: { onPick: (paths: readonly string[]) => void }) {
  return (
    <Press
      look="cmp-tool cmp-plus"
      onMouseDown={(e) => {
        e.preventDefault(); // the field keeps the caret
      }}
      onClick={() => {
        const pick = window.bise.pickFiles;
        void pick().then((paths) => {
          onPick(paths);
        });
      }}
      aria-label="attach files"
      title="attach files"
      data-testid="composer.attach"
    >
      +
    </Press>
  );
}

/** The approvals mode: 'yolo ⌄' or 'approvals ⌄'; nothing until the hub said its mode. */
export function ModeTool({ project }: { project: string }) {
  const store = useStore();
  const approvals = useApprovals(project);
  const [open, setOpen] = useState<Open>(null);
  if (approvals === null) return null;
  const close = () => {
    setOpen(null);
  };
  const set = (mode: 'yolo' | 'auto') => {
    close();
    if (mode !== (approvals.mode === 'auto' ? 'auto' : 'yolo')) store.command({ cmd: 'approvals', project, mode });
  };
  const now = approvals.mode === 'auto' ? 'auto' : 'yolo';
  return (
    <Drop
      open={open === 'mode'}
      onClose={close}
      button={
        <Press look="cmp-tool cmp-menu" aria-haspopup="menu" aria-expanded={open === 'mode'} onClick={() => { setOpen(open === 'mode' ? null : 'mode'); }} title="approvals mode · ⇧⇥" data-testid="composer.mode">
          {modeWords(approvals.mode)} <span className="v">⌄</span>
        </Press>
      }
    >
      <Menu testId="composer.mode.menu">
        {(['yolo', 'auto'] as const).map((m) => (
          <MenuItem key={m} on={now === m} hotkey={flashWords(m, approvals.checker, false).rest.replace(/^ · /u, '')} onClick={() => { set(m); }} testId={`composer.mode.${m}`}>
            {modeWords(m)}
          </MenuItem>
        ))}
      </Menu>
    </Drop>
  );
}

/** The model and its effort: '<b>opus 5.5</b> high ⌄'; the menu lists the models, then the efforts. */
export function ModelTool({ project, a }: { project: string; a: Agent }) {
  const store = useStore();
  const router = useRouter();
  const models = useModels(project);
  const [open, setOpen] = useState<Open>(null);
  const w = modelWords(models, a.model, a.effort);
  if (w.model === '') return null;
  const close = () => {
    setOpen(null);
  };
  const efforts = effortsFor(models, a.model);
  const pick = (model: string) => {
    close();
    if (model === a.model) return;
    modelOrSetup(model, models, { cmd: 'model', project, agent: a.name, model }, {
      send: (c) => {
        store.command(c);
      },
      setup: () => {
        router.go({ screen: 'settings', page: 'models' });
      },
    });
  };
  return (
    <Drop
      open={open === 'model'}
      onClose={close}
      button={
        <Press look="cmp-tool cmp-menu" aria-haspopup="menu" aria-expanded={open === 'model'} onClick={() => { setOpen(open === 'model' ? null : 'model'); }} title="model, reasoning" data-testid="composer.model">
          <b>{w.model}</b>
          {w.effort !== '' && <span className="eff"> {w.effort}</span>} <span className="v">⌄</span>
        </Press>
      }
    >
      <Menu testId="composer.model.menu">
        {modelGroups(models)
          .filter((g) => g.head !== 'aliases')
          .flatMap((g) => g.rows)
          .map((m) => (
            <MenuItem key={m.id} on={m.id === a.model} hotkey={m.provider} onClick={() => { pick(m.id); }} testId={`composer.model.pick.${m.id.replace(/[^a-z0-9-]/giu, '-').toLowerCase()}`}>
              {m.label}
            </MenuItem>
          ))}
        {efforts.length > 0 && <MenuSep />}
        {efforts.map((e) => (
          <MenuItem key={e} on={e === a.effort} onClick={() => { close(); if (e !== a.effort) setEffort(store, project, a.name, e); }} testId={`composer.effort.${e}`}>
            {e}
          </MenuItem>
        ))}
      </Menu>
    </Drop>
  );
}
