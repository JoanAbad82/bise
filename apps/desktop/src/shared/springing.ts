// macOS's spring-loading setting (System Settings › Accessibility › Pointer Control › Spring-loading,
// NSGlobalDomain com.apple.springing.enabled / com.apple.springing.delay), as main reads it
// (main/a11y.ts) for the sidebar's spring-loaded projects (app/spring.ts, designer m_47386).
// Read as strings, so a key never set ('') is told from a set one: unset is macOS's own default,
// on with a 0.5 s delay. Pure. Owner: drag-spring.

/** macOS's default delay when he never moved the slider. */
export const SPRING_DEFAULT_MS = 500;

export interface Springing {
  /** spring-loading on: a held drag opens the row; off, the row only lights as a drop target */
  readonly on: boolean;
  /** how long the drag is held on a row before it blinks and opens */
  readonly delayMs: number;
}

/** What the two defaults say ('' a key never set; NSUserDefaults gives '1'/'0' for a bool, '0.5' for a float). Pure. */
export function springingOf(enabled: string, delay: string): Springing {
  const on = enabled.trim() !== '0';
  const s = Number.parseFloat(delay);
  const delayMs = Number.isFinite(s) && s >= 0 ? Math.round(s * 1000) : SPRING_DEFAULT_MS;
  return { on, delayMs };
}
