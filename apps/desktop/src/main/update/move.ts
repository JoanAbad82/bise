// 'Move to Applications' (apple-signing ag-move), the pure part; the shell is run.ts (Updates
// offerMove, move). An app that runs from the disk image, from a copy macOS translocated (opened
// from Downloads) or from a folder it can't write never updates itself (plan.ts cantSwapAt). On
// its first start there, one alert asks to move it to /Applications (Electron's
// app.moveToApplicationsFolder: it moves, quits and opens again from there); 'Not now' is kept
// for that build (<userData>/updates/move.json), and settings › general › update keeps the same
// act on its 'updates are off here' row. Words: designer.
import type { UpdateCant } from '../../shared/api';

/**
 * The alert's words (designer m_26871: a native macOS alert, all sentence case). The agents keep
 * running: the move quits the app and its core, never the hubs (their own processes, as an update).
 */
export const MOVE_ASK = {
  message: 'Move bise to Applications?',
  detail: 'bise can update itself only from your Applications folder. It moves there and opens again. Your agents keep running.',
  buttons: ['Move', 'Not now'],
} as const;

/** The Applications folders: the Mac's and his own (`<home>/Applications`). */
function inApplications(target: string, home: string): boolean {
  return target.startsWith('/Applications/') || (home !== '' && target.startsWith(`${home.replace(/\/+$/, '')}/Applications/`));
}

/**
 * Whether moving the app fixes 'updates are off here': from a disk image or a translocated copy,
 * always; from a folder it can't write, only outside an Applications folder (an /Applications it
 * can't write is his Mac's rights, not where bise runs). Pure.
 */
export function movable(cant: UpdateCant | null, target: string, home: string): boolean {
  if (cant === 'disk_image' || cant === 'translocated') return true;
  return cant === 'read_only' && !inApplications(target, home);
}

/** The start asks: the app can move, and he didn't say 'Not now' to this build. Pure. */
export function asksMove(canMove: boolean, build: string | null, declined: string | null): boolean {
  return canMove && build !== null && build !== declined;
}

/** move.json's build he said 'Not now' to, or null (none, junk). */
export function readDeclined(text: string): string | null {
  try {
    const v = JSON.parse(text) as { declined?: unknown };
    return typeof v.declined === 'string' && v.declined !== '' ? v.declined : null;
  } catch {
    return null;
  }
}

/** move.json's text for 'Not now' on `build`. */
export function declinedText(build: string): string {
  return `${JSON.stringify({ declined: build })}\n`;
}

/** Test mode's answer to the alert (BISE_DESKTOP_TEST_MOVE): 'move', else 'Not now'. */
export function testAnswer(v: string | undefined): 'move' | 'not_now' {
  return v === 'move' ? 'move' : 'not_now';
}
