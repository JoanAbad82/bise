// What a module that is not built yet says (office-artifacts plan §8: the
// sheets, slides and docs chunks replace their stub).

import { OfficeError } from "./errors.ts";

export type NotBuilt = {
  open(bytes: Uint8Array): Promise<never>;
  create(opts?: unknown): Promise<never>;
};

export function notBuilt(name: string, ext: string): NotBuilt {
  const refuse = (): Promise<never> =>
    Promise.reject(new OfficeError("not_built", `the ${name} module (${ext}) is not in this bise yet: office.inspect() reads its outline of parts, nothing edits it`));
  return { open: refuse, create: refuse };
}
