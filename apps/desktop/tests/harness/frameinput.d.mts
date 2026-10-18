// The types of frameinput.mjs (one copy, read by the checks and the as-he-does driver).
import type { Frame, Page } from '@playwright/test';

export type FrameKey = 'Escape' | 'Space';
export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface FrameInput {
  move(x: number, y: number): Promise<void>;
  wheel(x: number, y: number, dx: number, dy: number, o?: { ctrl?: boolean }): Promise<void>;
  down(x: number, y: number): Promise<void>;
  up(x: number, y: number): Promise<void>;
  click(x: number, y: number): Promise<void>;
  dblclick(x: number, y: number): Promise<void>;
  drag(a: Point, b: Point, steps?: number): Promise<void>;
  keyDown(name: FrameKey): Promise<void>;
  keyUp(name: FrameKey): Promise<void>;
  press(name: FrameKey): Promise<void>;
  detach(): Promise<void>;
}
export function frameInput(page: Page, frame: Frame): Promise<FrameInput>;
