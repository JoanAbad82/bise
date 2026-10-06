import type { BiseApi } from '../shared/api';

declare global {
  interface Window {
    /** Built by src/main/preload.ts. */
    readonly bise: BiseApi;
  }
}
