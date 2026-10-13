// The field's paste, drop and clipboard, out of PmField.tsx: images as chips (pasted, dropped on
// the field or anywhere in the window), a long text as a chip after it lands inline (⌘Z puts it
// back inline), any other text as plain text; a copy reads chips as their labels.
import { useEffect, useEffectEvent } from "react";
import { closeHistory } from "@tiptap/pm/history";
import {
  TextSelection,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Slice } from "@tiptap/pm/model";
import { chipLabel, isLongPaste, nextChipNumber, type Chip } from "../message";
import { isImagePath, type ComposerSources } from "../sources";
import { thumbnail } from "../attach";
import { insertChip, insertText, nodeType, segmentsOf } from "./pmtext";

/** What paste and drop need of the field: read at each use (the editor and props live in refs). */
export interface PasteCtx {
  readonly sources: () => ComposerSources;
  readonly state: () => EditorState | null;
  readonly dispatch: (tr: Transaction | null) => boolean;
  readonly view: () => EditorView | null;
}

/** What the clipboard reads of a selection: chips as their labels, a newline '\n', no dictation. */
export function clipboardText(slice: Slice): string {
  return slice.content.textBetween(0, slice.content.size, "\n", (n) =>
    n.type.name === "hardBreak"
      ? "\n"
      : n.type.name === "chip"
        ? chipLabel(n.attrs.chip as Chip)
        : "",
  );
}

const addChip = (c: PasteCtx, make: (n: number) => Chip): void => {
  const st = c.state();
  if (st !== null)
    c.dispatch(insertChip(st, make(nextChipNumber(segmentsOf(st.doc)))));
};

const addImages = (c: PasteCtx, list: readonly File[]): void => {
  for (const f of list) {
    void Promise.all([c.sources().saveImage(f), thumbnail(f)]).then(
      ([img, thumb]) => {
        if (img !== null)
          addChip(c, (n) => ({
            kind: "image",
            n,
            path: img.path,
            name: img.name,
            ...(thumb === null ? {} : { thumb }),
          }));
      },
    );
  }
};

const droppedImages = (e: DragEvent): File[] =>
  Array.from(e.dataTransfer?.files ?? []).filter(
    (f) => f.type.startsWith("image/") || isImagePath(f.name),
  );

/** A long paste: inline first, then its chip in a second undo step (⌘Z puts it back inline). */
const longPaste = (c: PasteCtx, raw: string): void => {
  const text = raw.replace(/\r\n?/gu, "\n");
  const st = c.state();
  if (st === null) return;
  const start = st.selection.from;
  c.dispatch(closeHistory(insertText(st, text).setMeta("paste", true)));
  const now = c.state();
  if (now === null) return;
  const chip: Chip = {
    kind: "paste",
    n: nextChipNumber(segmentsOf(now.doc)),
    text,
  };
  const tr = now.tr.replaceWith(
    start,
    start + text.length,
    nodeType(now.schema, "chip").create({ chip }),
  );
  tr.setSelection(TextSelection.create(tr.doc, start + 1));
  c.dispatch(closeHistory(tr));
};

/** A paste in the field (or anywhere, through grab.ts): true, it was handled. */
export function pasteInto(c: PasteCtx, e: ClipboardEvent): boolean {
  const data = e.clipboardData;
  if (data === null) return false;
  const images = Array.from(data.files).filter((f) =>
    f.type.startsWith("image/"),
  );
  if (images.length > 0) {
    e.preventDefault();
    addImages(c, images);
    return true;
  }
  const text = data.getData("text/plain");
  e.preventDefault();
  if (isLongPaste(text)) {
    longPaste(c, text);
    return true;
  }
  const st = c.state();
  if (st !== null && text !== "")
    c.dispatch(
      insertText(st, text.replace(/\r\n?/gu, "\n")).setMeta("paste", true),
    );
  return true;
}

/** A drop on the field: its images as chips; false (anything else): ProseMirror's own. */
export function dropInto(c: PasteCtx, e: DragEvent): boolean {
  const images = droppedImages(e);
  if (images.length === 0) return false;
  e.preventDefault();
  addImages(c, images);
  return true;
}

/** A file dropped anywhere in the window is the composer's, never a navigation. */
export function useDropAnywhere(c: PasteCtx): void {
  // registered once; the drop sees this render's context
  const drop = useEffectEvent((e: DragEvent): void => {
    e.preventDefault();
    if (c.view()?.dom.contains(e.target as Node) === true) return; // handleDrop has it
    const images = droppedImages(e);
    if (images.length > 0) addImages(c, images);
  });
  useEffect(() => {
    const over = (e: DragEvent): void => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent): void => {
      drop(e);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", onDrop);
    };
  }, []);
}
