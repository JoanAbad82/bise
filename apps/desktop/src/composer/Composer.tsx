// The composer (bar ⛔1, ⛔2, 2.1-2.7, 3.1-3.2): a Lexical editor the app never rewrites per
// keystroke. His typing goes keyboard -> contenteditable -> Lexical, and nothing in the app
// writes it back: no store round trip, no re-render of the field (the old app's bug 1: ui.js
// rewrote the region with innerHTML on every state change). The app writes into it only on
// what he asked for: a pick, a paste, a chip, dictation, ↑ through the drafts, a send that clears.
//
// Mounted once per screen (React never re-creates the editor: the initial config is read once,
// the callbacks go through refs). The frame around it is amb-kit's ComposerFrame.
import { memo, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { defineExtension } from 'lexical';
import { HistoryExtension } from '@lexical/history';
import { PlainTextExtension } from '@lexical/plain-text';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { ComposerFrame } from '@/ds';
import './composer.css';
import { ChipNode } from './ChipNode';
import { Brain, type ComposerActions } from './Brain';
import type { Outgoing } from './message';
import { NO_SOURCES, type ComposerSources } from './sources';
import type { Store } from './drafts';

export interface ComposerProps {
  /** Whose composer this is (`<project>/<agent>`): its draft, history and queue are kept per target. */
  readonly target: string;
  /** A turn runs: tab queues, ⏎ steers, the send button stops. */
  readonly busy?: boolean;
  readonly sources?: ComposerSources;
  /** Where drafts live (localStorage by default; tests pass their own). */
  readonly store?: Store;
  /** "you → bise · opus · high" */
  readonly to?: string;
  readonly placeholder?: string;
  readonly keys?: string;
  readonly onSend: (out: Outgoing) => void;
  /** A command line he ran (`/model opus`): the screen runs it (a core cmd or a screen). */
  readonly onCommand?: (name: string, args: string) => void;
  /** The send button while busy: stop the turn. */
  readonly onStop?: () => void;
  /** The composer's actions for the screen (dictation's words at the caret, focus), once mounted. */
  readonly onReady?: (a: ComposerActions) => void;
  readonly testId?: string;
}

function onError(error: Error): void {
  // an editor error must not take the screen down; it is logged, and the text stays
  console.error('composer', error);
}

// module scope: one stable extension, so React never re-creates the editor
const EXTENSION = defineExtension({
  name: '@bise/composer',
  namespace: 'bise-composer',
  nodes: [ChipNode],
  theme: { paragraph: 'p', text: { base: 't' } },
  onError,
  dependencies: [PlainTextExtension, HistoryExtension],
});

export const Composer = memo(function Composer(props: ComposerProps): JSX.Element {
  const { target, busy = false, sources = NO_SOURCES, to, placeholder = 'write to bise', keys = '@ file   $ skills   / commands', testId = 'composer' } = props;
  const store = useMemo<Store>(() => props.store ?? window.localStorage, [props.store]);
  // the latest callbacks, read by the editor's handlers without re-creating them
  const cb = useRef(props);
  useEffect(() => {
    cb.current = props;
  });
  const actions = useRef<ComposerActions | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [strip, setStrip] = useState<JSX.Element | null>(null);

  return (
    <ComposerFrame
      testId={testId}
      to={to}
      keys={keys}
      quote={strip}
      send={busy && !canSend ? 'stop' : canSend ? 'on' : 'off'}
      onSend={() => {
        if (busy && !canSend) cb.current.onStop?.();
        else actions.current?.submit();
      }}
    >
      <LexicalExtensionComposer extension={EXTENSION} contentEditable={null}>
        <ContentEditable
          className="b-field"
          data-testid={`${testId}.field`}
          aria-label={placeholder}
          aria-multiline
          spellCheck
          aria-placeholder={placeholder}
          placeholder={<span className="ph b-field-ph">{placeholder}</span>}
        />
        <Brain
          target={target}
          busy={busy}
          sources={sources}
          store={store}
          testId={testId}
          send={(o) => {
            cb.current.onSend(o);
          }}
          command={(name, args) => {
            cb.current.onCommand?.(name, args);
          }}
          onCanSend={setCanSend}
          onStrip={setStrip}
          onActions={(a) => {
            if (actions.current === null) cb.current.onReady?.(a);
            actions.current = a;
          }}
        />
      </LexicalExtensionComposer>
    </ComposerFrame>
  );
});
