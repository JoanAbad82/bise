// Types of the bise-testid ESLint plugin (testid.mjs), for the harness's TypeScript self-tests.
import type { ESLint } from 'eslint';

export declare const AREAS: string[];
export declare const ID_RE: RegExp;
export declare function badId(id: string, opts?: { prefix?: boolean }): string | null;
declare const plugin: ESLint.Plugin;
export default plugin;
