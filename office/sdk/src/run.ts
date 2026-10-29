// `run.read` / `run.write`: the only way a script touches files.
//
// The SDK itself is pure (bytes in, bytes out). The host gives these two:
// `bise office run` installs its ops (scope and size checked in Rust, a
// write becomes the artifact's next version: plan §9.2-3), the tests and a
// node user install their own with `setHost`. No host: a clear refusal.

import { OfficeError } from "./core/errors.ts";

export type WriteOptions = {
  /** register the file as a new artifact (a file that already is one gets its next version anyway) */
  artifact?: boolean;
};

export interface Host {
  read(path: string): Promise<Uint8Array>;
  write(path: string, bytes: Uint8Array, opts?: WriteOptions): Promise<void>;
}

const KEY = "__biseOfficeHost";

function host(): Host {
  const h = (globalThis as Record<string, unknown>)[KEY] as Host | undefined;
  if (!h) {
    throw new OfficeError("no_host", "run.read and run.write work inside `bise office run <script.ts>`; elsewhere call setHost({read, write}) first");
  }
  return h;
}

/** Install the file ops (bise office run does it before the script starts). */
export function setHost(h: Host | undefined): void {
  (globalThis as Record<string, unknown>)[KEY] = h;
}

export const run = {
  /** a file's bytes, by path (relative: to the script's working folder) */
  read: async (path: string): Promise<Uint8Array> => host().read(path),
  /** write a file; when it is an artifact, it becomes its next version */
  write: async (path: string, bytes: Uint8Array, opts?: WriteOptions): Promise<void> => host().write(path, bytes, opts),
};
