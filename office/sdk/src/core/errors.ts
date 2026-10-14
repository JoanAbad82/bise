// What the SDK refuses, in words an agent can act on.

/** Why an OfficeError was thrown: an agent can branch on it. */
export type OfficeErrorCode =
  | "not_a_zip" // the bytes are not a zip (not an Office file, or cut short)
  | "not_office" // a zip, but not an xlsx, pptx or docx
  | "bad_xml" // a part that does not parse as XML
  | "no_part" // a part the file needs is missing
  | "anchor_kind" // an anchor of a kind this version does not know
  | "anchor_shape" // an anchor of a known kind with missing or wrong fields
  | "anchor_kind_mismatch" // an anchor of another file type (a cell on a deck)
  | "not_found" // an anchor that points at nothing in this file
  | "no_host" // run.read/run.write outside `bise office run` with no host set
  | "bad_arg" // an edit's argument is wrong (a block of an unknown kind, a heading level 9)
  | "not_built"; // a module of the SDK that is not built yet

export class OfficeError extends Error {
  readonly code: OfficeErrorCode;
  constructor(code: OfficeErrorCode, message: string) {
    super(message);
    this.name = "OfficeError";
    this.code = code;
  }
}
