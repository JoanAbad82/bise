// The types of purity.mjs (a plain module: check.mjs runs it under node).
export declare const HOOKS_FILE: string;
export declare const EXCEPTIONS: Readonly<Record<string, string>>;
export declare function purityFaults(files: Readonly<Record<string, string>>): string[];
