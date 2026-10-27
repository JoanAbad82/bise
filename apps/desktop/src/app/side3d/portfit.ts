// src/app/side3d · a process row's port gives way to its command (designer m_46894): the command is
// the row's name. At rest the port says its short form (':5242'); on the row's hover or focus its
// full form ('localhost:5242 ↗') only when the command still shows 12 characters beside it (all of
// it when shorter), else the short form stays. The command is mono, so its characters are one
// width. The rule is pure (portFits, fullGrows); the hook measures the row at the hover with the
// short form drawn, what the full one would take off the command's line from it. Owner: nm-side.
import { useEffect, useState, type RefObject } from 'react';

/** the command's characters the full port leaves it at least */
export const CMD_KEEP = 12;

/**
 * Whether the full port fits: the command's line `lineW` wide were the full form shown, the
 * command `cmdW` wide whole for its `cmdLen` characters. Pure.
 */
export function portFits(lineW: number, cmdW: number, cmdLen: number): boolean {
  if (cmdLen <= 0) return true;
  const need = cmdLen <= CMD_KEEP ? cmdW : (cmdW / cmdLen) * CMD_KEEP;
  return lineW + 0.5 >= need;
}

/** the full form's ↗ (AppIcon 14) and its gap (--s-1), css px */
export const FULL_ICON_PX = 14 + 4;

/**
 * How much wider the full form draws than the short one: the port is mono too, so its characters
 * are one width (`shortW` for `shortLen`), and the ↗. Pure.
 */
export function fullGrows(shortW: number, shortLen: number, fullLen: number): number {
  if (shortLen <= 0) return FULL_ICON_PX;
  return (shortW / shortLen) * Math.max(0, fullLen - shortLen) + FULL_ICON_PX;
}

/** What the row's elements measure with the short form drawn. */
export interface PortBoxes {
  readonly line: HTMLElement | null;
  readonly cmd: HTMLElement | null;
  readonly port: HTMLElement | null;
}

/**
 * The port's form for the row in `row`: full while hovered or focused when it fits beside 12
 * characters of the command, measured at the hover with the short form drawn. `pick` finds the
 * command's line, the command and the port in the row; `full` the full form's words (no ↗).
 */
export function usePortFull(row: RefObject<HTMLElement | null>, pick: (el: HTMLElement) => PortBoxes, full: string): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = row.current;
    if (el === null) return undefined;
    const on = () => {
      const { line, cmd, port } = pick(el);
      if (line === null || cmd === null || port === null) return;
      const grows = fullGrows(port.scrollWidth, port.textContent.length, full.length);
      setShown(portFits(line.clientWidth - grows, cmd.scrollWidth, cmd.textContent.length));
    };
    const off = (e: Event) => {
      // focus moving inside the row, or the pointer still over it, keeps it
      if (e.type === 'focusout' && el.contains((e as FocusEvent).relatedTarget as Node | null)) return;
      if (e.type === 'focusout' && el.matches(':hover')) return;
      if (e.type === 'pointerleave' && el.contains(document.activeElement)) return;
      setShown(false);
    };
    el.addEventListener('pointerenter', on);
    el.addEventListener('focusin', on);
    el.addEventListener('pointerleave', off);
    el.addEventListener('focusout', off);
    return () => {
      el.removeEventListener('pointerenter', on);
      el.removeEventListener('focusin', on);
      el.removeEventListener('pointerleave', off);
      el.removeEventListener('focusout', off);
    };
  }, [row, pick, full]);
  return shown;
}
