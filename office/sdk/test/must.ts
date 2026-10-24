// The tests' guards for a value the SDK may not have (a part, a match, a
// cell) or gives as plain JSON (an outline node's props): present and of
// its shape, or the test fails here naming it.

import assert from "node:assert/strict";

export function must<T>(value: T | undefined | null, what: string): T {
  assert.ok(value !== undefined && value !== null, `missing: ${what}`);
  return value;
}

/** a JSON list (a node's props.widths, props.charts) */
export function list(value: unknown, what: string): unknown[] {
  assert.ok(Array.isArray(value), `not a list: ${what}`);
  return value;
}

/** a JSON object (a node's props, a chart in props.charts) */
export function obj(value: unknown, what: string): Record<string, unknown> {
  assert.ok(typeof value === "object" && value !== null && !Array.isArray(value), `not an object: ${what}`);
  return Object.fromEntries(Object.entries(value));
}
