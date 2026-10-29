// The first-run text (bar L1 / M18, the TUI's sb/panel.rs FIRST_RUN, BISE-284): shown dim in
// main's empty thread while there are no agents yet. Its last line's "show me what you can do"
// fills the composer with those words, selected (typing replaces them, ⏎ sends them), and never
// sends. Pure: the screen that shows it (main's empty thread) hands `onFill`, which puts the words
// in the composer through its actions. Owner: amb-kit (src/setup).
import { Act } from '@/ds';
import { composer } from '../proto/words.gen';

/** The empty thread's question, then what bise is, then the suggestion (the TUI's words). */
export const FIRST_RUN = [composer.placeholder_main, composer.first_run_say] as const;


/** The first-run text shows while main's thread has nothing he said and the project has no agent but main. */
export function showsFirstRun(said: boolean, agents: number): boolean {
  return !said && agents <= 1;
}

export interface FirstRunProps {
  /** the composer holds the suggestion: the last line says how to go on instead */
  ready?: boolean;
  /** put the suggestion (composer.demo) in the composer, selected; never a send */
  onFill: (text: string) => void;
}

export function FirstRun({ ready = false, onFill }: FirstRunProps) {
  return (
    <div className="setup-firstrun" data-testid="setup.firstrun">
      {FIRST_RUN.map((l) => (
        <p key={l}>{l}</p>
      ))}
      {ready ? (
        <p data-testid="setup.firstrun.ready">
          <kbd>⏎</kbd>
          {composer.demo_ready}
        </p>
      ) : (
        <p>
          {composer.first_run_try_head}
          <span
            className="setup-firstrun-demo"
            onMouseDown={(e) => {
              // keep the composer's focus and selection: the click must not blur it first
              e.preventDefault();
            }}
          >
            <Act
              testId="setup.firstrun.demo"
              onClick={() => {
                onFill(composer.demo);
              }}
            >
              {composer.demo}
            </Act>
          </span>
          ”
        </p>
      )}
    </div>
  );
}
