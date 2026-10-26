// src/composer/float · FloatHost: the floating composer on a page that is no thread (page
// native-mac §6, mockups 6-8; it replaced the dock, thread/Bottom.tsx). Mounted at the shell's root
// by App.tsx, position fixed, outside .app-main and .app-screen, so nothing clips its shadow (plan
// §2; ds/noclip.ts checks it), centred on the content's column (app/side3d/place.ts useSideLayout), 24 from
// the bottom; every page keeps --float-room free at its bottom. At rest a 560 × 44 pill
// ('+ ask bise  mic send'); focused 640 wide, its head (─ folds it, 'to bise ⌄' picks whom it
// writes to, the grip opens the mini thread) over a 48 field; open 640 × 560 (70% of the height at
// most): the addressee's thread scrolls above the field. Esc and ─ fold it, a press outside too;
// his draft stays (the composer keeps it per addressee). An inbox item opened here (^1-3, ⌘I, the
// inbox block's own keys) shows its card and answer buttons over the head, and his words answer it,
// as the dock did. It sends through the thread composer's one path (store.send, store.do answer);
// floatTarget only picks the default addressee, the route to a project stays the hub's. State:
// state.ts (pure). Owner: nm-composer.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon, PickerPop, PickerTrigger, Press, tipAttrs } from '@/ds';
import { InboxBlock, type Answering } from '@/inbox';
import { shownName } from '@/agents/model';
import { threadKey, useAgents, useProjects, useStore, useThreadOrder } from '@/store';
import { MAIN } from '@/app/route';
import { useRoute } from '@/app/router';
import { useSideLayout } from '@/app/side3d/place';
import { answerOf, HERE_BISE, ThreadComposer } from '@/thread/ThreadComposer';
import { usageLine } from '@/thread/head';
import { useTabPlace, useTabWords } from '@/thread/ComposerTab';
import { Rows } from '@/thread/ThreadRows';
import type { ThreadListHandle } from '@/thread/ThreadList';
import { composer } from '@/proto/words.gen';
import { floatTarget, type FloatTo } from './target';
import { floatNext, type FloatEvent, type FloatState } from './state';
import './float.css';

const NOOP = (): void => undefined;

/** The floating composer over the page's bottom, where the route has one. */
export function FloatHost() {
  const route = useRoute();
  const home = useProjects().find((p) => p.home)?.project;
  const to = floatTarget(route, home);
  if (to === null) return null;
  // kept across pages of the same addressee (no route key): his draft and state stay
  return <Float key={`${to.project}/${to.agent}`} to={to} />;
}

/** Who the floating composer writes to: by default the route's, else what he picked in 'to bise ⌄'. */
function useAddressee(def: FloatTo): [FloatTo, (to: FloatTo) => void] {
  const [picked, setPicked] = useState<FloatTo | null>(null);
  return [picked ?? def, setPicked];
}

function Float({ to: def }: { to: FloatTo }) {
  const store = useStore();
  const [to, setTo] = useAddressee(def);
  const { project, agent } = to;
  const rows = useProjects();
  const row = rows.find((p) => p.project === project);
  const isHome = row?.home === true;
  const agents = useAgents(project);
  const me = agents.find((a) => a.name === agent);
  const [state, setState] = useState<FloatState>('rest');
  const go = useCallback((ev: FloatEvent) => {
    setState((s) => floatNext(s, ev));
  }, []);
  const root = useRef<HTMLDivElement>(null);
  const [answering, setAnswering] = useState<Answering | null>(null);
  const onAnswer = useCallback((a: Answering | null) => {
    setAnswering(a);
    if (a !== null) go('item');
  }, [go]);
  const name = agent === MAIN && isHome ? 'bise' : shownName(agent);
  const place = useTabPlace(project, me, isHome);
  const tab = useTabWords(answering?.label ?? composer.float_to({ agent: name }), place, usageLine(me?.usage?.words), name);
  const stop = useCallback(() => {
    store.stop(project, agent);
  }, [store, project, agent]);
  // folding leaves the float: the focus goes back to the page, the draft stays in the field
  const fold = useCallback((ev: 'esc' | 'fold') => {
    go(ev);
    const a = document.activeElement;
    if (a instanceof HTMLElement && root.current?.contains(a) === true) a.blur();
  }, [go]);
  const onEscape = useCallback(() => {
    fold('esc');
    return true;
  }, [fold]);
  const onSent = useCallback(() => {
    go('sent');
  }, [go]);
  // a press outside folds it (a picker's or a tip's layer is its own: never outside)
  useEffect(() => {
    if (state === 'rest') return;
    const down = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t === null || root.current?.contains(t) === true || t.closest('.b-picker-pop') !== null) return;
      go('outside');
    };
    window.addEventListener('pointerdown', down, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
    };
  }, [state, go]);
  // esc while the focus is outside it (an item's card closed by its own esc, a click on the page):
  // the float folds, never the page behind (esc-up.ts); inside, its own onKeyDown does it, after
  // the field's lists; an open item takes its own esc first (the inbox block's)
  useEffect(() => {
    if (state === 'rest' || answering !== null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || root.current?.contains(e.target as Node) === true) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      fold('esc');
    };
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('keydown', key, true);
    };
  }, [state, answering, fold]);
  // the mini thread: the addressee's rows; none yet, one line and the float holds only it
  const tkey = threadKey(project, agent);
  const order = useThreadOrder(tkey);
  const empty = order.loaded && order.order.length === 0;
  // its first page on its way: the loading line only, the float as short as when empty (ui-review
  // m_42926: never a tall blank glass while it loads)
  const loading = !order.loaded && order.order.length === 0;
  // open, it holds the addressee's thread as a thread screen does (the store pages it in)
  const open = state === 'open';
  useEffect(() => {
    if (!open) return;
    store.subscribeThread(project, agent);
    return () => {
      store.unsubscribeThread(project, agent);
    };
  }, [open, store, project, agent]);
  // centred on the content's column, not the window (nm-side's one sideLayout, page native-mac §6)
  const col = useSideLayout();
  const listRef = useRef<ThreadListHandle | null>(null);
  return (
    // data-pick-anchor: the composer's / @ $ list floats from the whole glass, never over its head (ui-review m_44570)
    <div ref={root} className="cmp-float" data-pick-anchor data-state={state} data-empty={(state === 'open' && (empty || loading)) || undefined} data-testid="composer.float" data-project={project} data-agent={agent}
      role="region" aria-label={composer.float_name} style={{ left: col.colLeft + col.colW / 2 }}
      onFocus={() => {
        go('focus');
      }}
      // esc anywhere in it (the field, ─, the grip, the picker's trigger) folds it, never the page's
      // esc (esc-up.ts would leave the page); a list in the field takes its own esc first
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || e.defaultPrevented || state === 'rest') return;
        e.preventDefault();
        e.stopPropagation();
        fold('esc');
      }}>
      {state !== 'rest' && (
        <div className="hd" data-testid="composer.float.head">
          <Press look="cmp-tool" aria-label={composer.float_fold} {...tipAttrs(composer.float_fold, 'esc')} data-testid="composer.float.fold"
            onClick={() => {
              fold('fold');
            }}>
            <AppIcon name="fold" />
          </Press>
          {answering !== null ? (
            <span className={answering.answer === null ? 'cmp-float-ans' : 'cmp-float-ans acc'} data-testid="composer.float.to">{answering.label}</span>
          ) : (
            <ToPicker to={to} name={name} onPick={setTo} />
          )}
          <Press look="cmp-tool grip" aria-label={state === 'open' ? composer.float_close : composer.float_open}
            {...tipAttrs(state === 'open' ? composer.float_close : composer.float_open)} aria-expanded={state === 'open'} data-testid="composer.float.grip"
            onClick={() => {
              go('grip');
            }}>
            {/* a chevron, never a grip (⠿ says 'drag me', and nothing drags: designer m_43204): up while the thread is hidden, down while shown */}
            <AppIcon name="down" />
          </Press>
        </div>
      )}
      {/* an item opened here (^1-3, ⌘I): under the head, flat in the float, its answer buttons as the dock's (designer m_25639) */}
      <InboxBlock here={isHome && agent === MAIN ? HERE_BISE : { project, agent }} onAnswer={onAnswer} rest="open-only" />
      {state === 'open' &&
        (empty ? (
          <p className="body-empty" data-testid="composer.float.thread.empty">{composer.float_empty({ agent: name })}</p>
        ) : (
          <div className="body" data-testid="composer.float.thread">
            <Rows tkey={tkey} project={project} agent={agent} bise={isHome && agent === MAIN} listRef={listRef} />
          </div>
        ))}
      <ThreadComposer
        project={project}
        agent={agent}
        busy={me?.status === 'working'}
        tab={tab}
        tabEnd={answering?.end}
        me={me}
        placeholder={answering?.placeholder ?? composer.placeholder_to({ agent: name })}
        answer={answerOf(answering)}
        onStop={stop}
        onEscape={onEscape}
        onReady={NOOP}
        onSent={onSent}
        hubNotes
        floating
      />
    </div>
  );
}

/** 'to bise ⌄': whom his words go to: bise, the project's main, its live agents (the route's by default). */
function ToPicker({ to, name, onPick }: { to: FloatTo; name: string; onPick: (to: FloatTo) => void }) {
  const rows = useProjects();
  const home = rows.find((p) => p.home)?.project;
  const agents = useAgents(to.project);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const choices = useMemo(() => {
    const out: { id: string; to: FloatTo; name: string }[] = [];
    if (home !== undefined) out.push({ id: `${home}/${MAIN}`, to: { project: home, agent: MAIN }, name: 'bise' });
    const row = rows.find((p) => p.project === to.project);
    if (row !== undefined && !row.home) {
      // the hub's order (rows::Agent.rank), live agents only
      for (const a of agents) if (!a.archived) out.push({ id: `${to.project}/${a.name}`, to: { project: to.project, agent: a.name }, name: a.main ? row.name : shownName(a.name) });
    }
    return out;
  }, [home, rows, agents, to.project]);
  return (
    <>
      <PickerTrigger ref={trigger} extra="cmp-float-to" open={open} tip={composer.float_to_title} testId="composer.float.to"
        onClick={() => {
          setOpen((o) => !o);
        }}>
        {composer.float_to({ agent: name })}
      </PickerTrigger>
      {open && (
        <PickerPop anchor={trigger} side="above" align="start" title={composer.float_to_title}
          groups={[{ id: 'to', rows: choices.map((c) => ({ id: c.id, name: c.name, current: c.to.project === to.project && c.to.agent === to.agent, testId: `composer.float.to.${c.id}` })) }]}
          onPick={(id) => {
            setOpen(false);
            const c = choices.find((x) => x.id === id);
            if (c !== undefined) onPick(c.to);
          }}
          onClose={() => {
            setOpen(false);
          }}
          testId="composer.float.to.menu" />
      )}
    </>
  );
}
