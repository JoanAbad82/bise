// The zip layer (fflate): an Office file as its parts, in their order.
//
// A part never touched is written back as the same bytes it came with
// (re-deflated, so the zip differs, the content does not): edits keep what
// they do not understand. Sync only: bise office run has no timers or
// workers, and the files are small enough.

import { unzipSync, zipSync, type Zippable } from "fflate";
import { OfficeError } from "./errors.ts";
import { utf8Decode, utf8Encode } from "./utf8.ts";

/** A fixed date for every entry: the same parts make the same bytes. */
const MTIME = new Date(Date.UTC(1980, 0, 1, 0, 0, 0));

/** The parts of an OPC package (xlsx, pptx, docx), by path without a leading `/`. */
export class Zip {
  private parts: Map<string, Uint8Array>;

  private constructor(parts: Map<string, Uint8Array>) {
    this.parts = parts;
  }

  static empty(): Zip {
    return new Zip(new Map());
  }

  static read(bytes: Uint8Array): Zip {
    if (!(bytes instanceof Uint8Array) || bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new OfficeError("not_a_zip", "these bytes are not a zip: not an xlsx, pptx or docx (or the file is cut short)");
    }
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(bytes);
    } catch (e) {
      throw new OfficeError("not_a_zip", `the zip does not read: ${(e as Error).message}`);
    }
    const parts = new Map<string, Uint8Array>();
    for (const [name, data] of Object.entries(files)) {
      if (!name.endsWith("/")) parts.set(name, data);
    }
    return new Zip(parts);
  }

  /** The part paths, in the file's order (new parts last). */
  list(): string[] {
    return [...this.parts.keys()];
  }

  has(path: string): boolean {
    return this.parts.has(clean(path));
  }

  bytes(path: string): Uint8Array | undefined {
    return this.parts.get(clean(path));
  }

  /** A part as UTF-8 text, undefined when absent. */
  text(path: string): string | undefined {
    const b = this.bytes(path);
    return b === undefined ? undefined : utf8Decode(b);
  }

  set(path: string, data: Uint8Array | string): void {
    this.parts.set(clean(path), typeof data === "string" ? utf8Encode(data) : data);
  }

  remove(path: string): boolean {
    return this.parts.delete(clean(path));
  }

  /** The package as zip bytes. `[Content_Types].xml` first, as Office writes it. */
  write(): Uint8Array {
    const files: Zippable = {};
    const ct = "[Content_Types].xml";
    const order = this.parts.has(ct) ? [ct, ...this.list().filter((p) => p !== ct)] : this.list();
    for (const p of order) files[p] = [this.parts.get(p)!, { mtime: MTIME, level: 6 }];
    return zipSync(files);
  }
}

function clean(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

export { utf8Decode, utf8Encode };
