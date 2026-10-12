// A side column's border he can drag (designer m_19374): no handle at rest; an 8 px hit area
// centred on the border; after 120 ms of hover the 1 px border reads as 2 px --c-text-3 and the
// cursor col-resize; while dragging 2 px --c-text-2 and col-resize over the whole window (window
// listeners); live resize, no ghost line; a double-click goes back to the default width. Keyboard:
// a focusable separator, ←/→ move it 16 px, Enter goes back to the default. Owner: amb-win.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const HOVER_MS = 120;
const STEP_PX = 16;

export interface SplitterProps {
  /** which column it resizes: the sidebar (its right border) or the right panel (its left border) */
  readonly edge: 'side' | 'panel';
  /** the column's width now */
  readonly width: number;
  /** a drag or a key wants this width (the caller clamps it) */
  readonly onWidth: (want: number) => void;
  /** a double-click or Enter: the default width */
  readonly onReset: () => void;
  readonly label: string;
  readonly testId: string;
}

export function Splitter({ edge, width, onWidth, onReset, label, testId }: SplitterProps) {
  const [hot, setHot] = useState(false);
  const [drag, setDrag] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const from = useRef<{ x: number; w: number } | null>(null);
  // the panel's border moves left when it widens
  const sign = edge === 'side' ? 1 : -1;
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      document.documentElement.classList.remove('app-resizing');
    },
    [],
  );
  const onEnter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setHot(true);
    }, HOVER_MS);
  };
  const onLeave = () => {
    window.clearTimeout(timer.current);
    setHot(false);
  };
  // the drag follows the pointer anywhere in the window (listeners on the window, not only on the
  // 8 px handle: a fast move leaves it before the border catches up)
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    from.current = { x: e.clientX, w: width };
    setDrag(true);
    document.documentElement.classList.add('app-resizing');
    const move = (m: globalThis.PointerEvent) => {
      const f = from.current;
      if (f !== null) onWidth(f.w + sign * (m.clientX - f.x));
    };
    const up = () => {
      from.current = null;
      setDrag(false);
      document.documentElement.classList.remove('app-resizing');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      onWidth(width + sign * (e.key === 'ArrowRight' ? STEP_PX : -STEP_PX));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onReset();
    }
  };
  return (
    <div
      className={`app-split ${edge}${hot ? ' is-hot' : ''}${drag ? ' is-drag' : ''}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      tabIndex={0}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerDown={onDown}
      onDoubleClick={onReset}
      onKeyDown={onKey}
      data-testid={testId}
    />
  );
}
