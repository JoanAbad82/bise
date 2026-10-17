// His message inside his bubble, one body for both of its lives (bubble-parts, his m_29158): while
// it goes (rows-messages PendingRow, from the store's pending parts) and once it landed (YouRow, from
// the entry's parts). The quotes first, his words with each chip at its place, the fold of a long
// message, then what rides with them (pastes, images, files). A chip in his words is the composer's
// own (composer/pm/schema.ts chipDom: same DOM, same look in chip.css, same numbers); the mouse on
// it lights the quote line or the part chip with its number and back, a click does what its row
// does (an image or a file: Quick Look; a paste: its text; a quote: its words). Owner: amb-win.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Chip as DsChip, Fold, Press } from '@/ds';
import type { Part } from '@/proto';
import { thread } from '@/proto/words.gen';
import { chipDom } from '@/composer/pm/schema';
import { chipLabel, lineCount, quoteAbout, type Chip } from '@/composer/message';
import { segmentsOfParts } from '@/composer/partsback';
import { shownName } from '@/agents/model';
import { useArtifacts } from '@/store';
import { useFold } from './folds';
import { useFoldHint } from './foldHint';
import { Markdown, slotMark, slotText } from './Markdown';
import { AttachChip, FileThumb } from './AttachChip';
import { fileUrl, Thumb } from './rows-cards';
import { anchorMeta, chipName, pageWords, youView, type YouView } from './parts';
import type { RowCtx } from './rows';

/** A message of his longer than this folds to its first lines (tui-parity B11, the TUI's You(_, _, open)). */
export const LONG_LINES = 12;
export const LONG_CHARS = 1200;
const SHOWN_LINES = 6;

/** The folded words of a long message, or none when it shows whole. Pure. */
export function foldOf(text: string): { head: string; lines: number } | undefined {
  const lines = text.split('\n');
  if (lines.length <= LONG_LINES && text.length <= LONG_CHARS) return undefined;
  const head = lines.slice(0, SHOWN_LINES).join('\n');
  // a cut never splits a chip's slot mark (Markdown.slotMark)
  return { head: head.length > LONG_CHARS ? `${head.slice(0, LONG_CHARS).replace(/\uE000\d*$/u, '')}…` : head, lines: lines.length };
}

/** His words as markdown, each chip's place a slot mark, and the composer's chip for each slot. */
export interface BubbleWords {
  readonly md: string;
  readonly chips: readonly Chip[];
}

/**
 * His words with their chips where he put them (composer/partsback segmentsOfParts, the composer's
 * own numbers). What was never in his words stays out: a quote with no number (an older client's,
 * in front), a file of an older files list, the hub's hint; a page's notes are words. Pure.
 */
export function bubbleWords(parts: readonly Part[]): BubbleWords {
  const inline = parts.flatMap((p): Part[] => {
    if (p.kind === 'hint') return [];
    if ((p.kind === 'quote' || p.kind === 'anchor') && p.n == null) return [];
    if (p.kind === 'file' && (p.name ?? '') === '') return [];
    if (p.kind === 'page') return [{ kind: 'text', text: pageWords(p) }];
    return [p];
  });
  const chips: Chip[] = [];
  let md = '';
  for (const s of segmentsOfParts(inline)) {
    if (s.kind === 'text') md += slotText(s.text);
    else {
      md += slotMark(chips.length);
      chips.push(s.chip);
    }
  }
  // youView's spacing: no double space, no space before a line's end
  return { md: md.replace(/[ \t]{2,}/gu, ' ').replace(/[ \t]+\n/gu, '\n').trim(), chips };
}

/** What a quote line says after its words: '· main · 1 line', or a diff quote's place. Pure. */
export function quoteMeta(source: string, about: string, text: string): string {
  if (about !== '') return about;
  const n = text.split('\n').length;
  return [source === '' ? '' : shownName(source), `${String(n)} line${n === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
}

/** The chips lit together and what is open: one number names one chip in his words and its row. */
interface Linked {
  readonly lit: number | null;
  readonly hover: (n: number | null) => void;
  readonly open: number | null;
  readonly toggle: (n: number) => void;
}

/**
 * His message's body in his bubble: `parts` when it came typed (drawnParts), else `plain` drawn as
 * written. `id` names its test ids ('thread.you.12', 'thread.sending.3': never under the row's own 'thread.pending.3', which checks count); `foldPos` keeps a landed
 * message's fold open across a scroll; `extra` rides last (the fn context's chip).
 */
export function YouBody({ parts, plain, ctx, id, foldPos, extra }: { parts: readonly Part[] | null; plain: string; ctx: RowCtx; id: string; foldPos?: number; extra?: ReactNode }) {
  const [opened, setOpened] = useFold(false, foldPos);
  const hint = useFoldHint();
  const [lit, setLit] = useState<number | null>(null);
  // the quote line or the paste open by its number (each toggles from its own row or its chip)
  const [open, setOpen] = useState<number | null>(null);
  const link: Linked = {
    lit,
    hover: setLit,
    open,
    toggle: (n) => {
      setOpen((o) => (o === n ? null : n));
    },
  };
  const view = parts !== null ? youView(parts) : null;
  const words = parts !== null ? bubbleWords(parts) : { md: plain, chips: [] };
  // a part of an artifact says the artifact's name, as his composer's row did (designer m_24208)
  const arts = useArtifacts(ctx.project);
  const titles = new Map(arts.map((a) => [a.id, a.title]));
  const quotes = view !== null ? view.quotes.map((q) => ({ source: q.from, text: q.text, n: q.n, about: q.anchor !== undefined ? anchorMeta(q.anchor, titles.get(q.anchor.artifact)) : q.file !== '' ? quoteAbout(q.from, q.text, q) : '' })) : [];
  const fold = foldOf(words.md);
  const chips = words.chips;
  const slot = (i: number): ReactNode => {
    const c = chips[i];
    return c === undefined ? null : <InlineChip chip={c} link={link} testId={`${id}.chip.${String(c.n)}`} />;
  };
  const slotLabel = (i: number): string => {
    const c = chips[i];
    return c === undefined ? '' : chipLabel(c);
  };
  return (
    <>
      {quotes.map((q, i) => (
        <QuoteLine key={i} source={q.source} about={q.about} text={q.text} n={q.n} link={link} testId={`${id}.quote.${String(i + 1)}`} />
      ))}
      {words.md !== '' && <Markdown text={fold === undefined || opened ? words.md : fold.head} onLink={ctx.onLink} onArtifact={ctx.onArtifact} onPath={ctx.onPath} breaks slot={slot} slotLabel={slotLabel} />}
      {fold !== undefined && (
        <Fold
          open={opened}
          onToggle={() => {
            setOpened((o) => !o);
          }}
          hint={hint}
          testId={id.startsWith('thread.you.') ? `thread.fold.${id.slice('thread.you.'.length)}` : `${id}.fold`}
        >
          {opened ? thread.fold_it : thread.show_all({ n: fold.lines })}
        </Fold>
      )}
      {view !== null && <PartChips view={view} ctx={ctx} id={id} link={link} />}
      {extra}
    </>
  );
}

/** A file's 16 px system icon, kept: his landed bubble draws it at once where his sending one had it. */
const icons = new Map<string, string | null>();

/**
 * One chip in his words: the composer's chipDom, mounted as is (one DOM, never a copy). An image's
 * thumbnail is its file; a file's, its system icon when the system gives one.
 */
function InlineChip({ chip, link, testId }: { chip: Chip; link: Linked; testId: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const path = chip.kind === 'file' ? chip.path : '';
  const [icon, setIcon] = useState<string | null>(() => icons.get(path) ?? null);
  useLayoutEffect(() => {
    if (path === '' || icons.has(path)) return;
    let live = true;
    void (window as Partial<Window>).bise
      ?.fileIcon(path)
      .then((u) => {
        icons.set(path, u);
        if (live) setIcon(u);
      });
    return () => {
      live = false;
    };
  }, [path]);
  const key = JSON.stringify(chip);
  useLayoutEffect(() => {
    const el = host.current;
    if (el === null) return;
    const c: Chip = chip.kind === 'image' ? { ...chip, thumb: fileUrl(chip.path) } : chip.kind === 'file' && icon !== null ? { ...chip, icon } : chip;
    el.replaceChildren(chipDom(c, testId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the chip by its value
  }, [key, icon, testId]);
  const n = chip.n;
  useLayoutEffect(() => {
    host.current?.firstElementChild?.classList.toggle('lit', link.lit === n);
  });
  return (
    <span
      ref={host}
      className="th-inchip"
      onMouseEnter={() => {
        link.hover(n);
      }}
      onMouseLeave={() => {
        link.hover(null);
      }}
      onClick={() => {
        if (chip.kind === 'image' || chip.kind === 'file') void (window as Partial<Window>).bise?.quickLook(chip.path);
        else if (chip.kind === 'paste' || chip.kind === 'quote' || chip.kind === 'anchor') link.toggle(n);
      }}
    />
  );
}

/**
 * A quote in his bubble (tui-parity H7, designer m_19832): one line at the bubble's top, '❝ Agreed on
 * the api… · main · 1 line' in text-2, its words cut with …; a click (or its chip's) opens it in place.
 */
function QuoteLine({ source, about, text, n, link, testId }: { source: string; about: string; text: string; n: number | undefined; link: Linked; testId: string }) {
  const [own, setOwn] = useState(false);
  const open = n === undefined ? own : link.open === n;
  const meta = quoteMeta(source, about, text);
  return (
    <Press
      look="th-you-quote"
      data-open={open || undefined}
      data-lit={(n !== undefined && link.lit === n) || undefined}
      aria-expanded={open}
      onClick={() => {
        if (n === undefined) setOwn((o) => !o);
        else link.toggle(n);
      }}
      onMouseEnter={() => {
        if (n !== undefined) link.hover(n);
      }}
      onMouseLeave={() => {
        if (n !== undefined) link.hover(null);
      }}
      data-testid={testId}
    >
      <span className="th-you-quote-line">
        {/* a quote he put in his words: its number, the one his words show at its place (his m_22231) */}
        <span className="th-you-quote-text">
          ❝ {n === undefined ? '' : `${String(n)} `}
          {open ? meta : (text.split('\n')[0] ?? '')}
        </span>
        {/* a flex item drops its leading space: a no-break one keeps '30%. · bise' apart (designer m_21404 (2)) */}
        {!open && <span className="th-you-quote-src">{`\u00a0· ${meta}`}</span>}
      </span>
      {open && <span className="th-you-quote-whole">{text}</span>}
    </Press>
  );
}

/**
 * What rides with his words when his message came as parts (msg-parts): one row of chips, wrapping
 * only when the bubble is full (designer m_17969): his long pastes ('▤ 1 · 240 lines', a click shows
 * the paste), his other files (open in his editor), his images (the thumbnail, else the no-file
 * glyph slot, and 'image 1' or its file name in ink). The artifact chip's look: 1 px line, r 9,
 * 6 px apart; never the accent (pink is for what waits on him). Never a tag. `link`: his bubble's
 * (the chip in his words with the same number lights with it); none, each paste opens alone.
 */
export function PartChips({ view, ctx, id, named = false, link }: { view: YouView; ctx: RowCtx; id: string; named?: boolean; link?: Linked }) {
  const [own, setOwn] = useState<number | null>(null);
  const shown = link === undefined ? own : link.open;
  const toggle = (n: number): void => {
    if (link === undefined) setOwn((s) => (s === n ? null : n));
    else link.toggle(n);
  };
  const paste = view.pastes.find((p) => p.n === shown);
  if (view.pastes.length === 0 && view.images.length === 0 && view.files.length === 0) return null;
  const lit = (n: number | null): boolean => link !== undefined && n !== null && link.lit === n;
  const hover = (n: number | null) => (n === null || link === undefined ? undefined : (over: boolean) => {
    link.hover(over ? n : null);
  });
  const on = (n: number | null) => {
    const h = hover(n);
    return h === undefined ? {} : { onHover: h };
  };
  return (
    <>
      <div className="th-parts" data-testid={`${id}.parts`}>
        {view.pastes.map((p) => (
          <DsChip
            key={`p${String(p.n)}`}
            kind="part"
            of="paste"
            expanded={shown === p.n}
            {...(lit(p.n) ? { state: 'hover' as const } : {})}
            {...on(p.n)}
            onClick={() => {
              toggle(p.n);
            }}
            testId={`${id}.paste.${String(p.n)}`}
          >
            ▤ {p.n} · {lineCount(p.text)} lines
          </DsChip>
        ))}
        {/* his images and files (file-chips): a click previews, a right-click shows it in Finder */}
        {view.images.map((img, i) => (
          <AttachChip key={`${img.path}#${String(i)}`} of="image" path={img.path} missing={false} thumb={<Thumb path={img.path} />} lit={lit(img.n)} {...on(img.n)} testId={`${id}.image.${String(i + 1)}`}>
            {named ? chipName(img.path.split('/').at(-1) ?? img.path) : partImageWords(img.name, img.n ?? i + 1)}
          </AttachChip>
        ))}
        {view.files.map((f, i) =>
          f.name === '' ? (
            // a file of an older files list: in his editor, as before
            <DsChip
              key={`${f.path}#${String(i)}`}
              kind="part"
              of="file"
              title={f.path}
              onClick={() => {
                if (ctx.onPath !== undefined) ctx.onPath(f.path);
                else void (window as Partial<Window>).bise?.openPath(f.path, {});
              }}
              testId={`${id}.file`}
            >
              {f.path.split('/').at(-1) ?? f.path}
            </DsChip>
          ) : (
            <AttachChip key={`${f.path}#${String(i)}`} of="file" path={f.path} missing={f.missing} thumb={<FileThumb path={f.path} />} lit={lit(f.n)} {...on(f.n)} testId={`${id}.file.${String(i + 1)}`}>
              {named ? chipName(f.path.split('/').at(-1) ?? f.path) : (f.path.split('/').at(-1) ?? f.path)}
            </AttachChip>
          ),
        )}
      </div>
      {/* an image's caption under the chips, a fact about it, never his words: the talk's still says
          the app and window it shows (architect m_22000) */}
      {view.images.map((img, i) =>
        img.caption === '' ? null : (
          <p key={`c${String(i)}`} className="th-part-caption" data-testid={`${id}.image.${String(i + 1)}.caption`}>
            {img.caption}
          </p>
        ),
      )}
      {paste !== undefined && (
        <pre className="th-part-paste" data-testid={`${id}.paste.${String(paste.n)}.text`}>
          {paste.text}
        </pre>
      )}
    </>
  );
}

/** An image part's chip words: its file name when it has one, else 'image 2', `n` the number its
 *  chip has in his words ('[Image #2]'; one part, one number everywhere, designer m_29843), never
 *  the '[Image #n]' tag (designer m_17969). Pure. */
export function partImageWords(name: string, n: number): string {
  return name !== '' && !name.startsWith('[') ? name : thread.image_n({ n });
}
