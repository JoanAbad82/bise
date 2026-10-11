// src/ds · the controls a screen may not draw itself (designer's raw-controls call m_18343, via
// ambient-lead m_18391): IconButton, Act, TextArea, Sheet, Select. With prim.tsx's Button / Field /
// Toggle and window.tsx's Row, these are the only places a <button>, <input>, <select> or
// <textarea> is written; the controls lint (ds/controls-lint.mjs, in pnpm check) refuses one
// anywhere else. Radix (headless) is used here only, for the Sheet's dialog and the Select's
// listbox: focus trap, esc, typeahead and the a11y wiring are theirs, the look is the ds's.
// Pure renders of their props, like every ds component (index.ts's rules); css/controls.css.
import * as Dialog from "@radix-ui/react-dialog";
import * as RSelect from "@radix-ui/react-select";
import type { KeyboardEvent, MouseEventHandler, ReactNode, Ref, TextareaHTMLAttributes } from "react";
import { cx, st, type UiState } from "./cx";

export interface IconButtonProps {
  /** what it does, in words: its aria-label and its tooltip (with `keys` after it) */
  label: string;
  /** the glyph */
  children: ReactNode;
  /** its key, shown in the tooltip ('⌘\\') */
  keys?: string;
  /** "bar": 24 px, for the title bar and other bars; else 28 */
  size?: "bar";
  /** a toggle's state (aria-pressed): the panel button while the panel shows */
  pressed?: boolean;
  state?: UiState;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  testId?: string;
  ref?: Ref<HTMLButtonElement>;
}
/** a square button with a glyph: 28×28 (24 in bars), r-2, glyph text-2, a 6% tint on hover */
export function IconButton({ label, children, keys, size, pressed, state, disabled, onClick, testId, ref }: IconButtonProps) {
  const off = disabled || state === "disabled";
  return (
    <button ref={ref} type="button" className={cx("b-ibtn", size, pressed && "on", st(state))} aria-label={label}
      title={keys !== undefined && keys !== "" ? `${label}  ${keys}` : label} aria-pressed={pressed} disabled={off}
      onClick={onClick} data-testid={testId}>
      {children}
    </button>
  );
}

export interface ActProps {
  children: ReactNode;
  /** err: the words in the error tone */
  tone?: "err";
  state?: UiState;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  testId?: string;
  title?: string;
  ref?: Ref<HTMLButtonElement>;
}
/** an inline text action in a line ('edit · drop', 'give it back', 'show the report'): text-2, underlined on hover */
export function Act({ children, tone, state, disabled, onClick, testId, title, ref }: ActProps) {
  const off = disabled || state === "disabled";
  return (
    <button ref={ref} type="button" className={cx("b-act", tone, st(state))} disabled={off} onClick={onClick} data-testid={testId} title={title}>
      {children}
    </button>
  );
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "children"> {
  state?: "focus" | "error";
  testId?: string;
  ref?: Ref<HTMLTextAreaElement>;
}
/**
 * a field of several lines: the Field's look, grows with its words up to 40% of the window, then
 * scrolls; no resize grip. Uncontrolled-friendly (defaultValue + ref), like Field.
 */
export function TextArea({ state, testId, ref, ...area }: TextAreaProps) {
  return (
    <label className={cx("b-field", "b-area", st(state))}>
      <textarea ref={ref} {...area} aria-invalid={state === "error" || undefined} data-testid={testId} />
    </label>
  );
}

export interface SheetProps {
  open: boolean;
  /** esc, a click on the scrim, or the cancel: the sheet asks to close */
  onClose: () => void;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  /** the foot, right-aligned: a ghost cancel then the primary Button */
  foot?: ReactNode;
  /** ⏎ (outside a field of several lines) runs it, as the primary button would */
  onPrimary?: () => void;
  testId?: string;
}
/**
 * a modal over the window: a 40% scrim, a raised r-4 sheet 560 wide (90% under 700), its head
 * (17/600) and sub (t-13, text-2), its body, its foot. Focus stays inside, esc closes, ⏎ runs the
 * primary, and focus goes back to what opened it (Radix Dialog).
 */
export function Sheet({ open, onClose, title, sub, children, foot, onPrimary, testId }: SheetProps) {
  const enter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.altKey || e.ctrlKey || e.nativeEvent.isComposing) return;
    const t = e.target as HTMLElement;
    if (t.tagName === "TEXTAREA" || t.tagName === "BUTTON" || t.isContentEditable || onPrimary === undefined) return;
    e.preventDefault();
    onPrimary();
  };
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="b-scrim" data-testid={testId === undefined ? undefined : `${testId}.scrim`} />
        <Dialog.Content className="b-sheet" onKeyDown={enter} data-testid={testId} aria-describedby={undefined}>
          <div className="b-sheet-head">
            <Dialog.Title className="t">{title}</Dialog.Title>
            {sub != null && <Dialog.Description className="sub">{sub}</Dialog.Description>}
          </div>
          <div className="b-sheet-body">{children}</div>
          {foot != null && <div className="b-sheet-foot">{foot}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** dim words after the label ('default for agents') */
  hint?: ReactNode;
}
export interface SelectProps {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  /** its name in words (aria-label), when no visible label names it */
  label?: string;
  placeholder?: string;
  state?: "focus" | "error" | "disabled";
  testId?: string;
}
/**
 * the settings picker: a Field with '⌄' that opens the ds menu under it; typeahead, ↑↓ ⏎ esc
 * (Radix Select). Each option's test id is `<testId>.opt.<value>`.
 */
export function Select({ value, options, onChange, label, placeholder, state, testId }: SelectProps) {
  return (
    <RSelect.Root value={value} onValueChange={onChange} disabled={state === "disabled"}>
      <RSelect.Trigger className={cx("b-field", "b-select", st(state))} aria-label={label} data-testid={testId}>
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon className="chev">⌄</RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className="b-menu b-select-menu" position="popper" sideOffset={4}>
          <RSelect.Viewport>
            {options.map((o) => (
              <RSelect.Item key={o.value} value={o.value} className="b-mi" data-testid={testId === undefined ? undefined : `${testId}.opt.${o.value}`}>
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                {o.hint != null && <span className="k">{o.hint}</span>}
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
