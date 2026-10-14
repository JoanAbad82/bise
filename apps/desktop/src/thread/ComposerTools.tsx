// The composer box's bottom row (designer's composer-strip A, m_23965 (4)): what he changes about
// where his words go. Left: '+' (attach files, macOS's panel through window.bise.pickFiles) and the
// approvals mode menu ('yolo ⌄' / 'approvals ⌄'); right, before send: the model and effort menu
// ('<b>opus 5.5</b> high ⌄'). The chips get the 6% hover; their pickers (ds Picker, designer m_24786)
// open 8 px above the box, the mode's on its chip's left edge, the model's on its right edge. Answering a card: '+'
// only (a model or a mode means nothing for an answer). Short: the effort label goes into its menu
// (css), the mode never drops. Owner: amb-win.
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Picker, PickerSeg, Press, pickerPlace, tipAttrs } from '@/ds';
import type { Agent } from '@/proto';
import { useApprovals, useModels, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { modelOrSetup } from '@/settings';
import { effortsFor, modelGroups, modelOf, setEffort } from '@/agents/actions';
import { modeSentence, modeWords, modelWords } from './tools';

/** Where a trigger's picker goes: above the composer's box, on the trigger's edge (pickerPlace). */
function placeFor(t: HTMLElement, align: 'start' | 'end'): PickerPlace {
  const box = (t.closest('.box') ?? t).getBoundingClientRect();
  return pickerPlace(box, t.getBoundingClientRect(), align, { width: window.innerWidth, height: window.innerHeight });
}

/** A chip's picker: `toggle` opens it in its place (again on a resize); a press outside it and its
 *  trigger, or esc, closes it and gives the focus back to the trigger. */
function usePicked(trigger: RefObject<HTMLButtonElement | null>, menu: RefObject<HTMLDivElement | null>, align: 'start' | 'end'): { place: PickerPlace | null; toggle: () => void; close: () => void } {
  const [place, setPlace] = useState<PickerPlace | null>(null);
  const open = place !== null;
  const close = useCallback(() => {
    setPlace(null);
  }, []);
  const toggle = () => {
    const t = trigger.current;
    setPlace(open || t === null ? null : placeFor(t, align));
  };
  useEffect(() => {
    if (!open) return;
    const resize = () => {
      const t = trigger.current;
      if (t !== null) setPlace(placeFor(t, align));
    };
    const down = (e: PointerEvent) => {
      const at = e.target as Node;
      if (trigger.current?.contains(at) === true || menu.current?.contains(at) === true) return;
      close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      close();
      trigger.current?.focus();
    };
    window.addEventListener('resize', resize);
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open, trigger, menu, align, close]);
  return { place, toggle, close };
}
type PickerPlace = ReturnType<typeof pickerPlace>;

/** The chips' caret: an 8x5 chevron, stroke 1.5, text-3, on the words' line (designer m_24786). */
function Caret() {
  return (
    <svg className="v" width="8" height="5" viewBox="0 0 8 5" aria-hidden="true">
      <path d="M.75.75 4 4.25 7.25.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

/** The approvals mode: 'yolo ⌄' or 'approvals ⌄'; nothing until the hub said its mode. Its picker:
 *  'mode  ⇧⇥', then each mode with its sentence on a second line (designer m_24786). */
export function ModeTool({ project }: { project: string }) {
  const store = useStore();
  const approvals = useApprovals(project);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const { place, toggle, close } = usePicked(trigger, menu, 'start');
  const open = place !== null;
  if (approvals === null) return null;
  const now = approvals.mode === 'auto' ? 'auto' : 'yolo';
  const what = modeSentence;
  const set = (mode: string) => {
    close();
    trigger.current?.focus();
    if (mode !== now) store.command({ cmd: 'approvals', project, mode: mode === 'auto' ? 'auto' : 'yolo' });
  };
  return (
    <>
      <Press ref={trigger} look="cmp-tool cmp-menu" aria-haspopup="menu" aria-expanded={open} onClick={toggle}
        {...tipAttrs(`${modeWords(now)}: ${what(now)} · ⇧⇥ switches`)} data-testid="composer.mode">
        <span className="w">{modeWords(approvals.mode)}</span>
        <Caret />
      </Press>
      {place !== null && createPortal(
        <div ref={menu}>
          <Picker
            title="mode"
            titleKeys="⇧⇥"
            groups={[{ id: 'modes', rows: (['yolo', 'auto'] as const).map((m) => ({ id: m, name: modeWords(m), secondary: what(m), current: now === m, testId: `composer.mode.${m}` })) }]}
            ownKeys
            onPick={set}
            onClose={() => { close(); trigger.current?.focus(); }}
            style={place.style}
            maxHeight={place.maxHeight}
            testId="composer.mode.menu"
          />
        </div>,
        document.body,
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
  const menu = useRef<HTMLDivElement>(null);
  const { place, toggle, close } = usePicked(trigger, menu, 'end');
  const open = place !== null;
  const w = modelWords(models, a.model, a.effort);
  if (w.model === '') return null;
  const efforts = effortsFor(models, a.model);
  const cur = modelOf(models, a.model)?.id ?? a.model;
  const provider = modelOf(models, a.model)?.provider ?? '';
  const pick = (model: string) => {
    close();
    trigger.current?.focus();
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
      <Press ref={trigger} look="cmp-tool cmp-menu" aria-haspopup="menu" aria-expanded={open} onClick={toggle}
        {...tipAttrs([w.model, provider, w.effort === '' ? '' : `effort ${w.effort}`].filter((x) => x !== '').join(' · '))} data-testid="composer.model">
        <span className="w">
          <b>{w.model}</b>
          {w.effort !== '' && <span className="eff"> {w.effort}</span>}
        </span>
        <Caret />
      </Press>
      {place !== null && createPortal(
        <div ref={menu}>
          <Picker
            groups={groups}
            footer={efforts.length > 0 && (
              <PickerSeg head="effort" items={efforts} on={a.effort ?? null} onPick={(e) => { close(); trigger.current?.focus(); if (e !== a.effort) setEffort(store, project, a.name, e); }} testId="composer.effort" />
            )}
            ownKeys
            onPick={pick}
            onClose={() => { close(); trigger.current?.focus(); }}
            style={place.style}
            maxHeight={place.maxHeight}
            testId="composer.model.menu"
          />
        </div>,
        document.body,
      )}
    </>
  );
}
