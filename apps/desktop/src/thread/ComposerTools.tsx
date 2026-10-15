// The composer box's bottom row (designer's composer-strip A, m_23965 (4)): what he changes about
// where his words go. Left: '+' (attach files, macOS's panel through window.bise.pickFiles) and the
// approvals mode menu ('yolo ⌄' / 'approvals ⌄'); right, before send: the model and effort menu
// ('<b>opus 5.5</b> high ⌄'). The chips get the 6% hover; their pickers (ds Picker, designer m_24786)
// open 8 px above the box, the mode's on its chip's left edge, the model's on its right edge. Answering a card: '+'
// only (a model or a mode means nothing for an answer). Short: the effort label goes into its menu
// (css), the mode never drops. Owner: amb-win.
import { useCallback, useRef, useState } from 'react';
import { PickerPop, PickerSeg, PickerTrigger, Press } from '@/ds';
import type { Agent } from '@/proto';
import { useApprovals, useModels, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { modelOrSetup } from '@/settings';
import { effortsFor, modelGroups, modelOf, setEffort } from '@/agents/actions';
import { modeSentence, modeWords, modelWords } from './tools';

/** A chip's open state: `toggle` opens and closes it, `close` closes it. */
function useOpen(): { open: boolean; toggle: () => void; close: () => void } {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  return { open, toggle: () => { setOpen((o) => !o); }, close };
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
      data-tip="attach files"
      data-testid="composer.attach"
    >
      +
    </Press>
  );
}

/** The approvals mode: 'yolo ⌄' or 'approvals ⌄'; nothing until the hub said its mode. Its picker:
 *  'mode  ⇧⇥', then each mode with its sentence on a second line (designer m_24786). */
export function ModeTool({ project }: { project: string }) {
  const store = useStore();
  const approvals = useApprovals(project);
  const trigger = useRef<HTMLButtonElement>(null);
  const { open, toggle, close } = useOpen();
  if (approvals === null) return null;
  const now = approvals.mode === 'auto' ? 'auto' : 'yolo';
  const what = modeSentence;
  const set = (mode: string) => {
    close();
    if (mode !== now) store.command({ cmd: 'approvals', project, mode: mode === 'auto' ? 'auto' : 'yolo' });
  };
  return (
    <>
      <PickerTrigger ref={trigger} extra="cmp-menu" open={open} onClick={toggle} tip={`${modeWords(now)}: ${what(now)} · ⇧⇥ switches`} testId="composer.mode">
        {modeWords(approvals.mode)}
      </PickerTrigger>
      {open && (
        <PickerPop
          anchor={trigger}
          box=".box"
          side="above"
          align="start"
          title="mode"
          titleKeys="⇧⇥"
          groups={[{ id: 'modes', rows: (['yolo', 'auto'] as const).map((m) => ({ id: m, name: modeWords(m), secondary: what(m), current: now === m, testId: `composer.mode.${m}` })) }]}
          onPick={set}
          onClose={close}
          testId="composer.mode.menu"
        />
      )}
    </>
  );
}

/** The model and its effort: '<b>opus 5.5</b> high ⌄'. Its picker: the models under their provider's
 *  head, the name only, ✓ the current one; then 'effort' and its segmented row (designer m_24786). */
export function ModelTool({ project, a }: { project: string; a: Agent }) {
  const store = useStore();
  const router = useRouter();
  const models = useModels(project);
  const trigger = useRef<HTMLButtonElement>(null);
  const { open, toggle, close } = useOpen();
  const w = modelWords(models, a.model, a.effort);
  if (w.model === '') return null;
  const efforts = effortsFor(models, a.model);
  const cur = modelOf(models, a.model)?.id ?? a.model;
  const provider = modelOf(models, a.model)?.provider ?? '';
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
  const groups = modelGroups(models)
    .filter((g) => g.head !== 'aliases')
    .map((g) => ({
      id: g.head,
      head: g.head,
      rows: g.rows.map((m) => ({ id: m.id, name: m.label, current: m.id === cur, testId: `composer.model.pick.${m.id.replace(/[^a-z0-9-]/giu, '-').toLowerCase()}` })),
    }));
  return (
    <>
      <PickerTrigger ref={trigger} extra="cmp-menu" open={open} onClick={toggle}
        tip={[w.model, provider, w.effort === '' ? '' : `effort ${w.effort}`].filter((x) => x !== '').join(' · ')} testId="composer.model">
        <b>{w.model}</b>
        {w.effort !== '' && <span className="eff"> {w.effort}</span>}
      </PickerTrigger>
      {open && (
        <PickerPop
          anchor={trigger}
          box=".box"
          side="above"
          align="end"
          groups={groups}
          footer={efforts.length > 0 && (
            <PickerSeg head="effort" items={efforts} on={a.effort ?? null} onPick={(e) => { close(); if (e !== a.effort) setEffort(store, project, a.name, e); }} testId="composer.effort" />
          )}
          onPick={pick}
          onClose={close}
          testId="composer.model.menu"
        />
      )}
    </>
  );
}
