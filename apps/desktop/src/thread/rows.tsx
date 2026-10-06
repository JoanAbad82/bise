// A thread's rows: one entry, one send not confirmed yet. Owner: amb-win.
//
// Each row reads its own data with the store's per-key hooks (useEntry,
// usePending), so a new or replaced entry re-renders that row alone; the
// list above it only holds keys. Memo'd on their props (strings, numbers).
import { memo, useState } from 'react';
import { Answered, Art, Button, Fold, Marker, Msg, Opts, Tool } from '@/ds';
import type { Entry } from '@/proto';
import { useEntry, usePending, useStore } from '@/store';
import { Markdown } from './Markdown';
import { clock, whoOf } from './entry';
import { useIsCurrent } from './findmark';

/** What a row needs of its thread. */
export interface RowCtx {
  readonly tkey: string;
  readonly project: string;
  readonly agent: string;
  /** bise's own main (the pearl, 'bise') */
  readonly bise: boolean;
  readonly onLink: (url: string) => void;
}

export const EntryRow = memo(function EntryRow({ ctx, pos }: { ctx: RowCtx; pos: number }) {
  const e = useEntry(ctx.tkey, pos);
  const hit = useIsCurrent(pos);
  if (e === undefined) return null;
  return (
    <div className={hit ? 'th-row th-hit' : 'th-row'} data-testid={`thread.entry.${pos}`} data-kind={e.kind}>
      <EntryBody e={e} ctx={ctx} />
    </div>
  );
});

function EntryBody({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  switch (e.kind) {
    case 'tools':
      return <ToolsRow e={e} />;
    case 'card':
      return <CardRow e={e} ctx={ctx} />;
    case 'page':
      return e.page ? (
        <Art
          title={`↗ ${e.page.title}`}
          meta={[e.page.v == null ? '' : `v${e.page.v}`, clock(e.at_ms)].filter(Boolean).join(' · ')}
          onClick={() => {
            if (e.page) ctx.onLink(e.page.url);
          }}
          testId={`thread.page.${e.pos}`}
        />
      ) : (
        <Marker>{e.text}</Marker>
      );
    case 'report':
      return <Marker>{e.report ? `${e.report.kind} · ${e.text}` : e.text}</Marker>;
    default: {
      const who = whoOf(e, ctx);
      return (
        <Msg from={who.from} name={who.name} indent={who.indent} time={clock(e.at_ms)} av={who.from === 'you' ? 'y' : undefined}>
          <Markdown text={e.text} onLink={ctx.onLink} />
        </Msg>
      );
    }
  }
}

/** Its tool calls in a row: one counted line, open to the steps. */
function ToolsRow({ e }: { e: Entry }) {
  const [open, setOpen] = useState(false);
  const items = e.tools?.items ?? [];
  return (
    <Tool
      state={open ? 'open' : undefined}
      onToggle={() => {
        setOpen((o) => !o);
      }}
      out={
        <ul className="th-steps">
          {items.map((t) => (
            <li key={t.pos}>{t.text}</li>
          ))}
        </ul>
      }
      testId={`thread.tools.${e.pos}`}
    >
      {e.tools?.summary ?? e.text}
    </Tool>
  );
}

/** A card it asked: open, its options answer it; answered, a line. */
function CardRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const store = useStore();
  const c = e.card;
  if (!c) return <Marker>{e.text}</Marker>;
  if (c.answered) return <Answered testId={`thread.card.${c.id}`}>✓ answered: {c.question}</Answered>;
  return (
    <Msg from={ctx.bise && ctx.agent === 'main' ? 'bise' : 'agent'} name={ctx.agent} time={clock(e.at_ms)}>
      <Markdown text={c.question} onLink={ctx.onLink} />
      <Opts
        items={c.options.map((o) => ({ n: o.n, text: o.label }))}
        onPick={(n) => {
          store.answer(ctx.project, c.id, String(n));
        }}
        testId={`thread.card.${c.id}.opt`}
      />
    </Msg>
  );
}

/**
 * His send before its entry lands: shown at once (bar ⛔3), dimmed while
 * sending; failed, one line with retry and dismiss (never a send with no
 * trace). His words stay here and in the composer's history.
 */
export const PendingRow = memo(function PendingRow({ ctx, cid }: { ctx: RowCtx; cid: number }) {
  const store = useStore();
  const p = usePending(ctx.tkey).find((x) => x.cid === cid);
  if (p === undefined) return null;
  const failed = p.state === 'failed';
  return (
    <div className={failed ? 'th-row th-pending th-failed' : 'th-row th-pending'} data-testid={`thread.pending.${cid}`} data-state={p.state}>
      <Msg from="you" name="you" av="y" time={failed ? `not sent${p.why !== undefined && p.why !== 'not sent' ? ` · ${p.why}` : ''}` : 'sending…'} state={failed ? 'error' : undefined}>
        <Markdown text={p.text} onLink={ctx.onLink} />
      </Msg>
      {failed && (
        <div className="th-failed-acts">
          <Button
            kind="ghost"
            onClick={() => {
              store.retry(ctx.tkey, cid);
            }}
            testId={`thread.retry.${cid}`}
          >
            retry
          </Button>
          <Button
            kind="ghost"
            onClick={() => {
              store.dismiss(ctx.tkey, cid);
            }}
            testId={`thread.dismiss.${cid}`}
          >
            dismiss
          </Button>
        </div>
      )}
    </div>
  );
});

/** The line under the newest row while a turn runs: its current step. */
export function TypingLine({ text }: { text: string }) {
  if (text === '') return null;
  return (
    <div className="th-typing" data-testid="thread.typing" aria-live="polite">
      <Fold>{text}</Fold>
    </div>
  );
}
