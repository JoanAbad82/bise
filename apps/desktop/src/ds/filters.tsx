// src/ds · a page's filters and its search (bise fait mac, page native-mac §6, mockup 6):
// - Filters: the segmented control, 28 high, its segments 24 inside a margin of 2 on --c-sunken;
//   the chosen one is --c-solid with --e-1 (never the hover's look, never the accent); role tablist
//   of tabs, each part's test id `<testId>.<id>`. A row of filters is `<FilterRow>` (the segmented
//   one, then Dropdowns), 24 under the page's lead.
// - BarSearch: the page's search field in the window's bar, 200 × 28, r 8, --c-sunken, the '/' key
//   at its right; its placeholder, VoiceOver name and tip are the ds's words (words_ds).
// Pure render of their props; the screens own the choice, the query and the keys. Owner: nm-ds.
import type { ChangeEventHandler, KeyboardEventHandler, ReactNode, Ref } from "react";
import { ds } from "@/proto/words_ds.gen";
import { cx, sub } from "./cx";
import { AppIcon } from "./icons-app";
import { tipAttrs } from "./tip";

export interface FilterOpt {
  /** its id: the test id's last part, what onPick gets */
  readonly id: string;
  /** its words (sentence case, from the screen's words) */
  readonly label: ReactNode;
  /** a count's tip, a hint: the part's hover tip */
  readonly tip?: string;
}

export interface FiltersProps {
  items: readonly FilterOpt[];
  /** the chosen one's id */
  on: string;
  onPick?: (id: string) => void;
  /** its VoiceOver name ('show') */
  label?: string;
  testId?: string;
}

/** the segmented filter: 28 high, segments 24, chosen --c-solid + --e-1 */
export function Filters({ items, on, onPick, label, testId }: FiltersProps) {
  return (
    <span className="b-filters b-chrome" role="tablist" aria-label={label} data-testid={testId}>
      {items.map((o) => (
        <span key={o.id} role="tab" tabIndex={o.id === on ? 0 : -1} aria-selected={o.id === on} className={cx(o.id === on && "on")}
          {...tipAttrs(o.tip)}
          onClick={onPick ? () => { onPick(o.id); } : undefined}
          onKeyDown={onPick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(o.id); } } : undefined}
          data-testid={sub(testId, o.id)}>
          {o.label}
        </span>
      ))}
    </span>
  );
}

/** a page's filters on one line: the segmented one, then its menus (Dropdowns), 8 apart, 24 under the lead */
export function FilterRow({ children, testId }: { children: ReactNode; testId?: string }) {
  return <div className="b-filter-row" data-testid={testId}>{children}</div>;
}

export interface BarSearchProps {
  value: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  /** the key that focuses it, shown at its right and in its tip: '/' */
  keys?: string;
  /** its placeholder and VoiceOver name, when the page names what it searches ('search artifacts') */
  placeholder?: string;
  /** a × at its right end once it has words: clears them (`<testId>.clear`) */
  onClear?: () => void;
  ref?: Ref<HTMLInputElement>;
  testId?: string;
}

/** the page's search: 200 × 28, r 8, --c-sunken, the icon 14, the key at its right (× once it has words, with onClear) */
export function BarSearch({ value, onChange, onKeyDown, keys = "/", placeholder = ds.search, onClear, ref, testId }: BarSearchProps) {
  return (
    <label className="b-barsearch" {...tipAttrs(ds.search_tip({ key: keys }))} data-testid={testId}>
      <AppIcon name="search" size={14} />
      {/* data-esc-own: esc is its own (it clears, then gives the focus back), before the float's (app/escape.ts) */}
      <input ref={ref} type="search" value={value} placeholder={placeholder} aria-label={placeholder} spellCheck={false} data-esc-own=""
        onChange={onChange} onKeyDown={onKeyDown} data-testid={sub(testId, "input")} />
      {value === "" && <span className="b-kbd">{keys}</span>}
      {value !== "" && onClear !== undefined && (
        <button type="button" className="b-barsearch-x" aria-label={ds.search_clear} onClick={onClear} data-testid={sub(testId, "clear")}>
          <AppIcon name="close" size={14} />
        </button>
      )}
    </label>
  );
}
