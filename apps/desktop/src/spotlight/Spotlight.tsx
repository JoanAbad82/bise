// The spotlight (fn space; bar ⛔1s, his bugs 7, 6 and 2): amb-kit's Spot frame, an uncontrolled
// <Input> the app never writes while he types (only a send clears it), the list under it as
// memo'd rows keyed by id (a keystroke updates the rows that changed, the input and the other rows
// stay the same nodes), the live pearl mounted once. bise's answer shows under the input at a
// readable size; the panel grows with it (onHeight tells the window), and past ANSWER_MAX_LINES it
// cuts with 'the rest in bise' (⏎ opens it in the window).
import {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { type DotState, Input, Press, Spot, SpotGroup, SpotRow } from "@/ds";
import { cx } from "@/ds/cx";
import { LivePearl, type Mood } from "@/pearl";
import {
  flat,
  routeList,
  spotList,
  type AgentStatus,
  type SpotData,
  type SpotItem,
} from "./list";
import { W, newBrief } from "./words";
import { LiveText } from "./LiveText";
import { shownName } from "@/agents/model";
import { caretAtEnd, keep } from "@/app/keep";
import type { PreviewLine } from "./preview";
import {
  filePathOf,
  isImageFile,
  saveImageFile,
  thumbnail,
} from "@/composer/attach";
import type { SavedImage } from "@/composer/sources";
import type { Part } from "@/proto";
import "./spotlight.css";

/** What he pasted or dropped in the spot (R41): an image saved in bise's image store, or a file by its own path. */
export interface SpotFile {
  readonly n: number;
  readonly path: string;
  readonly name: string;
  readonly image: boolean;
  readonly thumb?: string;
}

/** A chip's words: an image as the composer's '[Image #n]', a file by its name. */
export const spotFileLabel = (f: SpotFile): string =>
  f.image ? `[Image #${String(f.n)}]` : f.name;

/** A chip's words on screen, as the sent bubble's chip (amb-win 900f998e, designer m_18136): an
 *  image reads 'image n' in ink, never its '[Image #n]' tag; a file by its name. */
export const spotChipWords = (f: SpotFile): string =>
  f.image ? `image ${String(f.n)}` : f.name;

/** The bubble's no-file glyph (rows-cards Thumb): an image chip whose thumbnail could not be drawn. */
function NoThumb() {
  return (
    <span className="thumb none" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="16" height="16">
        <rect
          x="2.5"
          y="3.5"
          width="11"
          height="9"
          rx="1.5"
          fill="none"
          stroke="currentColor"
        />
        <circle cx="6" cy="6.5" r="1" fill="currentColor" />
        <path
          d="M3 11.5l3.5-3 2.5 2 2-1.5 2.5 2"
          fill="none"
          stroke="currentColor"
        />
      </svg>
    </span>
  );
}

/** His ask with chips as typed parts (msg-parts, like the thread's d68b4867): each chip in order, an
 *  image by its source in the image store alone (the hub stores it, main 18a32ce3; no b64_file), a
 *  file by its path, then his words. The text keeps the chips' labels before his words for older
 *  readers and the pending row's match; never `files` (the hub takes one list or the other). */
export function spotAsk(
  words: string,
  files: readonly SpotFile[],
): { text: string; parts: Part[] } {
  const parts: Part[] = files.map((f) =>
    f.image
      ? { kind: "image", name: spotFileLabel(f), source: f.path }
      : { kind: "file", path: f.path },
  );
  if (words !== "") parts.push({ kind: "text", text: words });
  return {
    text: [...files.map(spotFileLabel), words]
      .filter((x) => x !== "")
      .join(" "),
    parts,
  };
}

/** His typed words' field in the keep (keep.ts). */
const KEPT = "spot";

export interface SpotAnswer {
  readonly text: string;
  /** bise is still writing it. An empty text not done: asked, no word back yet (W.asked shows). */
  readonly done: boolean;
  /** a line about the answer, not the answer (dim): it went to another project's thread */
  readonly note?: boolean;
}

/** A routing hold on what he just sent: bise picked `to`, he can change it until `until` (epoch ms). */
export interface SpotRoute {
  readonly rid: number;
  readonly to: string;
  readonly name: string;
  readonly until: number;
}

export interface SpotlightProps {
  readonly data: SpotData;
  readonly answer?: SpotAnswer | null;
  readonly mood?: Mood;
  readonly level?: number;
  readonly still?: boolean;
  /** The pearl's place: the capsule passes a hole and keeps its one live pearl over it (never
   *  re-mounted when the capsule changes view); alone, the spotlight draws its own. */
  readonly pearl?: ReactNode;
  /** A routing hold running on his last send: shown at once, with its countdown (bar ⛔3). */
  readonly route?: SpotRoute | null;
  /** esc or a click on the hold: keep it with bise (route_cancel). */
  readonly onRouteKeep?: () => void;
  /** ⏎ on another project during the hold (route_correct). */
  readonly onRouteTo?: (project: string) => void;
  /** A sentence for bise (⏎ on 'ask bise', or ⏎ with nothing picked); with images or files he
   *  pasted or dropped (R41), its typed parts too (spotAsk; absent when none). */
  readonly onAsk: (text: string, parts?: readonly Part[]) => void;
  /** A pasted or dropped image into bise's image store (default: window.bise.saveImage). */
  readonly saveImage?: (file: File) => Promise<SavedImage | null>;
  /** A dropped file's absolute path (default: window.bise.filePath). */
  readonly filePath?: (file: File) => string;
  /** '/new …' or 'start an agent: …' (bar A.1): start an agent with that brief; none: it goes to bise as words. */
  readonly onNew?: (brief: string) => void;
  /** Open a card, an agent or an environment in bise's window. */
  readonly onOpen: (item: SpotItem) => void;
  /** The row the keyboard is on, each time it changes (none: no row): the capsule follows the
   *  selected agent's thread for its last actions (R07-a). */
  readonly onSelect?: (item: SpotItem | null) => void;
  /** The selected agent's last actions (its row id and lines, newest last): its right column
   *  shows them instead of its objective. None or no line yet: the objective stays. */
  readonly preview?: {
    readonly id: string;
    readonly lines: readonly PreviewLine[];
  } | null;
  /** Open bise's answer in the window (the rest of a long one). */
  readonly onOpenAnswer?: () => void;
  readonly onClose: () => void;
  /** The content's height in CSS px, each time it changes: the panel follows it. */
  readonly onHeight?: (px: number) => void;
  readonly testId?: string;
}

/** An answer longer than this many lines shows its start and 'the rest in bise'. */
export const ANSWER_MAX_LINES = 18;

const DOT: Record<AgentStatus, DotState> = {
  waiting: "nd",
  blocked: "off",
  working: "wk",
  idle: "off",
  done: "ok",
  failed: "er",
};

/** The selected agent's last actions in its right column, newest last (the newest in the text's
 *  color, the older dim), each with its time at the right; a question that waits on him in accent. */
function Actions({
  lines,
  testId,
}: {
  lines: readonly PreviewLine[];
  testId: string;
}): JSX.Element {
  return (
    <span className="b-spot-acts" data-testid={testId}>
      {lines.map((l, i) => (
        <span
          key={l.key}
          className={cx("a", i === lines.length - 1 && "new", l.ask && "ask")}
          data-testid={`${testId}.${String(i)}`}
        >
          <span className="t">{l.text}</span>
          <span className="tm">{l.time}</span>
        </span>
      ))}
    </span>
  );
}

const Row = memo(function Row({
  item,
  on,
  testId,
  onPick,
  acts,
  withFiles,
}: {
  item: SpotItem;
  on: boolean;
  testId: string;
  onPick: (item: SpotItem) => void;
  acts?: readonly PreviewLine[] | undefined;
  withFiles?: string | undefined;
}): JSX.Element {
  const click = (): void => {
    onPick(item);
  };
  const id = `${testId}.row.${item.id}`;
  switch (item.kind) {
    case "ask":
      // with chips in the spot it says they go too ('2 images · what is wrong in these', designer m_13808)
      return (
        <SpotRow
          lead="bise"
          name={W.askBise}
          what={
            withFiles === undefined || withFiles === ""
              ? item.text
              : item.text === ""
                ? withFiles
                : `${withFiles} · ${item.text}`
          }
          hotkey="↵"
          on={on}
          onClick={click}
          testId={id}
        />
      );
    case "new":
      return (
        <SpotRow
          lead="bise"
          name={W.startAgent}
          what={item.brief}
          hotkey="↵"
          on={on}
          onClick={click}
          testId={id}
        />
      );
    case "card":
      return (
        <SpotRow
          lead="nd"
          // the inbox block's sign (one-inbox 3: the tray menu and the window draw the same row)
          name={
            <>
              <span className="ib-sign">{item.mark}</span> {shownName(item.agent)}
            </>
          }
          where={item.pname}
          what={item.text}
          hotkey={W.answerKey}
          on={on}
          onClick={click}
          testId={id}
        />
      );
    case "agent":
      return (
        <SpotRow
          lead={DOT[item.status]}
          name={item.name}
          where={item.pname}
          what={
            on && acts !== undefined && acts.length > 0 ? (
              <Actions lines={acts} testId={`${id}.acts`} />
            ) : (
              item.title
            )
          }
          on={on}
          onClick={click}
          testId={id}
        />
      );
    case "env":
      return (
        <SpotRow
          lead="off"
          name={item.name}
          what={item.sub}
          hotkey={item.n === null ? undefined : `⌘${item.n}`}
          on={on}
          onClick={click}
          testId={id}
        />
      );
    case "front":
      return (
        <SpotRow
          lead="off"
          name={`◦ ${item.name}`}
          what={item.sub}
          on={on}
          testId={id}
        />
      );
  }
});

/** '→ bise · telemetry · 2 s to change', counting down on its own (the list and the input don't re-render). */
export function RouteLine({
  route,
  onKeep,
  testId,
}: {
  route: SpotRoute;
  onKeep?: (() => void) | undefined;
  testId: string;
}): JSX.Element {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      window.clearInterval(t);
    };
  }, []);
  const left = Math.max(0, Math.ceil((route.until - now) / 1000));
  return (
    <div className="b-spot-route" data-testid={testId} data-left={left}>
      <span className="to">{W.routeTo(route.name, left)}</span>
      {onKeep !== undefined && (
        <Press
          look="keep"
          onClick={onKeep}
          data-testid={`${testId}.keep`}
        >
          {W.keepWithBise}
        </Press>
      )}
    </div>
  );
}

export function answerLines(text: string): {
  readonly shown: string;
  readonly cut: boolean;
} {
  const lines = text.split("\n");
  return lines.length <= ANSWER_MAX_LINES
    ? { shown: text, cut: false }
    : { shown: lines.slice(0, ANSWER_MAX_LINES).join("\n"), cut: true };
}

export function Spotlight(p: SpotlightProps): JSX.Element {
  const testId = p.testId ?? "spot";
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  // his words survive a reload or an update swap until sent or put away with esc (keep.ts, amb-win)
  const [text, setText] = useState(() => keep.text(KEPT));
  // the list follows the words at React's pace; the input itself is never re-rendered by it
  const query = useDeferredValue(text);
  const route = p.route ?? null;
  // R41: what he pasted or dropped, as chips before his words; they leave with the ask
  const [files, setFiles] = useState<readonly SpotFile[]>([]);
  const list = useMemo(
    () =>
      route === null ? spotList(p.data, query) : routeList(p.data, route.to),
    [p.data, query, route],
  );
  const items = useMemo(() => flat(list), [list]);
  const [sel, setSel] = useState({ q: "", i: 0 });
  const index =
    sel.q === query ? Math.min(sel.i, Math.max(0, items.length - 1)) : 0;
  const props = useRef(p);
  useEffect(() => {
    props.current = p;
  });
  // the row the keyboard is on, told when it changes (R07-a: the capsule follows that agent)
  const selected = items[index] ?? null;
  useEffect(() => {
    props.current.onSelect?.(selected);
  }, [selected]);

  useEffect(() => {
    input.current?.focus();
    caretAtEnd(input.current);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (el === null) return;
    const ro = new ResizeObserver(() => {
      props.current.onHeight?.(Math.ceil(el.getBoundingClientRect().height));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  /** A chip for each pasted or dropped file, in order: an image saved in bise's image store (with
   *  its thumbnail), any other file by its own path (none: a page-made non-image, left out). */
  const addFiles = (list: readonly File[]): void => {
    const add = (f: Omit<SpotFile, "n">): void => {
      setFiles((now) => [
        ...now,
        { ...f, n: now.reduce((m, x) => Math.max(m, x.n), 0) + 1 },
      ]);
    };
    for (const f of list) {
      if (isImageFile(f)) {
        const save = props.current.saveImage ?? saveImageFile;
        void Promise.all([save(f), thumbnail(f)]).then(([img, thumb]) => {
          if (img !== null)
            add({
              path: img.path,
              name: img.name,
              image: true,
              ...(thumb === null ? {} : { thumb }),
            });
        });
      } else {
        const path = (props.current.filePath ?? filePathOf)(f);
        if (path !== "") add({ path, name: f.name, image: false });
      }
    }
  };
  const addRef = useRef(addFiles);
  useEffect(() => {
    addRef.current = addFiles;
  });

  // a file dropped anywhere on the spot (its field, its list, the pearl over its hole) is his ask's,
  // never a navigation of the capsule
  useEffect(() => {
    const over = (e: DragEvent): void => {
      e.preventDefault();
    };
    const drop = (e: DragEvent): void => {
      e.preventDefault();
      const list = Array.from(e.dataTransfer?.files ?? []);
      if (list.length > 0) addRef.current(list);
      input.current?.focus();
    };
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, []);

  const send = (q: string): void => {
    if (q.trim() === "" && files.length === 0) return;
    const brief = files.length === 0 ? newBrief(q) : undefined;
    const onNew = props.current.onNew;
    if (brief !== undefined && onNew !== undefined) onNew(brief);
    else if (files.length > 0) {
      const ask = spotAsk(q.trim(), files);
      props.current.onAsk(ask.text, ask.parts);
    } else props.current.onAsk(q.trim());
    if (input.current !== null) input.current.value = ""; // his send: the one write to the input
    setText("");
    setFiles([]);
    keep.dropText(KEPT);
  };

  const pick = (item: SpotItem): void => {
    if (props.current.route != null) {
      if (item.kind === "env") props.current.onRouteTo?.(item.project);
      return;
    }
    if (item.kind === "ask") send(item.text);
    else if (item.kind === "new")
      send(input.current?.value ?? `/new ${item.brief}`);
    else if (item.kind !== "front") props.current.onOpen(item);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const by = e.key === "ArrowDown" ? 1 : -1;
      setSel({
        q: query,
        i: items.length === 0 ? 0 : (index + by + items.length) % items.length,
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const a = p.answer;
      if (a && text.trim() === "" && answerLines(a.text).cut) {
        p.onOpenAnswer?.();
        return;
      }
      const item = items[index];
      if (route !== null) {
        if (item !== undefined) pick(item);
        return;
      }
      // R41: with an image or a file in the spot, ⏎ asks bise with it (opening a row would drop it)
      if (files.length > 0) send(text);
      else if (item !== undefined && text === query) pick(item);
      else send(text);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (route !== null) p.onRouteKeep?.();
      else {
        keep.dropText(KEPT);
        setFiles([]);
        p.onClose();
      }
    } else if (
      e.key === "Backspace" &&
      files.length > 0 &&
      e.currentTarget.selectionStart === 0 &&
      e.currentTarget.selectionEnd === 0
    ) {
      // ⌫ at the start of his words takes the last chip away, as the composer's ⌫ before a chip
      e.preventDefault();
      setFiles((now) => now.slice(0, -1));
    } else if (e.metaKey && /^[1-9]$/u.test(e.key)) {
      const env = items.find((x) => x.kind === "env" && x.n === Number(e.key));
      if (env !== undefined) {
        e.preventDefault();
        p.onOpen(env);
      }
    }
  };

  const ans = p.answer ? answerLines(p.answer.text) : null;
  const imageCount = files.filter((f) => f.image).length;
  const filesWords =
    files.length > 0
      ? W.withFiles(imageCount, files.length - imageCount)
      : undefined;
  const keys =
    route !== null
      ? W.keysRoute
      : files.length > 0
        ? W.keysFiles
        : list.mode === "new"
          ? W.keysNew
          : list.mode === "ask"
            ? W.keysAsk
            : W.keysEmpty;
  // one key per row even when two cards share an id (a hub's cards and its `others` count apart:
  // the fixture world's acme has two #11). A shared key let React keep a stale row after the
  // list changed (spotlight/new saw 2 rows); the second one gets '#1', in list order.
  const seen = new Map<string, number>();
  const keyOf = (id: string): string => {
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    return n === 0 ? id : `${id}#${String(n)}`;
  };

  return (
    <div ref={box} className="b-spotlight" data-testid={testId}>
      <Spot
        testId={`${testId}.frame`}
        to={W.to}
        pearl={
          p.pearl ?? (
            <LivePearl
              mood={p.mood ?? "rest"}
              level={p.level}
              still={p.still}
              size={40}
              testId={`${testId}.pearl`}
            />
          )
        }
        input={
          <span className="b-spot-field">
            {files.length > 0 && (
              <span className="b-spot-files" data-testid={`${testId}.files`}>
                {files.map((f) => (
                  <span
                    key={f.n}
                    className="b-spot-chip"
                    data-kind={f.image ? "image" : "file"}
                    title={f.path}
                    data-testid={`${testId}.file.${String(f.n)}`}
                  >
                    {f.image &&
                      (f.thumb !== undefined ? (
                        <img className="thumb" src={f.thumb} alt="" />
                      ) : (
                        <NoThumb />
                      ))}
                    {spotChipWords(f)}
                  </span>
                ))}
              </span>
            )}
            <Input
              ref={input}
              type="text"
              placeholder={W.ph}
              aria-label={W.ph}
              spellCheck={false}
              autoComplete="off"
              data-testid={`${testId}.input`}
              defaultValue={text}
              onInput={(e) => {
                setText(e.currentTarget.value);
                keep.setText(KEPT, e.currentTarget.value);
              }}
              onKeyDown={onKeyDown}
              onPaste={(e) => {
                // ⌘V of an image (a screenshot, a Finder copy) or a copied file: a chip, never its name as words
                const list = Array.from(e.clipboardData.files);
                if (list.length === 0) return;
                e.preventDefault();
                addFiles(list);
              }}
            />
          </span>
        }
        keys={ans?.cut === true ? W.answerMore : keys}
      >
        {route !== null && (
          <RouteLine
            route={route}
            onKeep={p.onRouteKeep}
            testId={`${testId}.route`}
          />
        )}
        {ans !== null && (
          // his ask shows it went (R18 on 723648da: the spot fell back to its list with no sign of
          // the ask until a word came back): 'asked bise' with the ∿ until the first words, which
          // take its place; an ask bise sent to another project says where its answer is
          <div
            className={cx(
              "b-spot-answer",
              (p.answer?.note === true || ans.shown === "") && "note",
            )}
            data-testid={`${testId}.answer`}
            data-state={
              p.answer?.note === true
                ? "went"
                : ans.shown === ""
                  ? "asked"
                  : p.answer?.done === false
                    ? "live"
                    : "done"
            }
            aria-live="polite"
          >
            <LiveText
              text={ans.shown === "" ? W.asked : ans.shown}
              live={p.answer?.done === false}
              testId={`${testId}.answer.text`}
            />
          </div>
        )}
        {/* one flat keyed list, the group heads as items: a row that stays listed keeps its element
            when it changes group or place (qa-type's spotlight/typing: rows keyed inside their group
            were rebuilt when typing moved them, bug 7's blink) */}
        {list.sections.flatMap((s) => [
          s.label === null ? null : (
            <div
              key={`group.${s.label}`}
              data-testid={`${testId}.group.${s.label}`}
            >
              <SpotGroup>{s.label}</SpotGroup>
            </div>
          ),
          ...s.items.map((item) => (
            <Row
              key={keyOf(item.id)}
              item={item}
              on={items[index]?.id === item.id}
              testId={testId}
              onPick={pick}
              acts={p.preview?.id === item.id ? p.preview.lines : undefined}
              withFiles={item.kind === "ask" ? filesWords : undefined}
            />
          )),
        ])}
      </Spot>
    </div>
  );
}
