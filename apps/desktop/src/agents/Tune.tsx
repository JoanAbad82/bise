// An agent's name, model and reasoning effort, changed in place (bar A.5):
// the '…' of its row in the agents list and of its thread's head open it.
// Rename is an inline field as the project rename; the model a pick among
// the models in use plus any id typed; the effort the TUI's /reasoning
// levels. The current values come from the agents row; a refusal shows its
// words here, a change shows when the next agents event comes. And the
// '+ new agent' sheet (A.1). Owner: amb-win.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/ds';
import type { Agent } from '@/proto';
import { useAgents, useCoreEvent, useStore, useWorktrees, type Ev } from '@/store';
import { EFFORTS, hasChanges, modelChoices, nameProblem, newAgent, renameAgent, setEffort, setModel } from './actions';

/** The hub's last refusal of one of `cmds` for this project, cleared by `clear`. */
export function useRefusal(project: string, cmds: readonly string[]): { text: string | undefined; cmd: string | undefined; clear: () => void } {
  const [got, setGot] = useState<{ text: string; cmd: string } | undefined>(undefined);
  const key = cmds.join(',');
  const on = useCallback(
    (ev: Ev) => {
      if (ev.ev !== 'error' || !('cmd' in ev) || ev.cmd == null) return;
      if ('project' in ev && ev.project != null && ev.project !== project) return;
      if (key.split(',').includes(ev.cmd)) setGot({ text: ev.text, cmd: ev.cmd });
    },
    [project, key],
  );
  useCoreEvent(on);
  return {
    text: got?.text,
    cmd: got?.cmd,
    clear: () => {
      setGot(undefined);
    },
  };
}

export function Tune({ project, a, onRenamed }: { project: string; a: Agent; onRenamed?: (to: string) => void }) {
  const store = useStore();
  const agents = useAgents(project);
  const refusal = useRefusal(project, ['rename', 'model', 'effort']);
  const [name, setName] = useState(a.name);
  const [model, setModelText] = useState(a.model ?? '');
  const problem = name.trim() === a.name ? undefined : nameProblem(name, agents, a.name);
  const id = a.name;

  // a rename waits for the hub: the field stays (and says 'renaming…') until
  // the agents event has the new name, then onRenamed; a refusal shows its
  // words here with the field still editable (qa-flows 5362cd43)
  const [renaming, setRenaming] = useState<string | undefined>(undefined);
  const refusedRename = refusal.cmd === 'rename' && refusal.text !== undefined;
  if (renaming !== undefined && refusedRename) setRenaming(undefined);
  const landed = renaming !== undefined && agents.some((x) => x.name === renaming) ? renaming : undefined;
  const done = useRef(false);
  useEffect(() => {
    if (landed === undefined || done.current) return;
    done.current = true;
    onRenamed?.(landed);
  }, [landed, onRenamed]);

  const rename = () => {
    if (problem !== undefined || renaming !== undefined) return;
    refusal.clear();
    if (renameAgent(store, project, a.name, name)) setRenaming(name.trim());
  };
  const onNameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      rename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setName(a.name);
    }
  };
  const choices = modelChoices(agents, a.model);
  return (
    <div className="ag-tune" data-testid={`agents.tune.${id}`}>
      {!a.main && (
        <label className="ag-field">
          <span>name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            onKeyDown={onNameKey}
            onBlur={() => {
              if (name.trim() !== a.name && problem === undefined && !refusedRename) rename();
            }}
            readOnly={renaming !== undefined}
            spellCheck={false}
            aria-invalid={problem !== undefined}
            data-testid={`agents.rename.${id}`}
          />
          {problem !== undefined && <em className="ag-why">{problem}</em>}
          {renaming !== undefined && (
            <em className="ag-why" data-testid={`agents.rename.${id}.wait`}>
              renaming…
            </em>
          )}
        </label>
      )}
      <label className="ag-field">
        <span>model</span>
        <input
          list={`ag-models-${id}`}
          value={model}
          placeholder="provider/model"
          onChange={(e) => {
            setModelText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              refusal.clear();
              setModel(store, project, a.name, model);
            }
          }}
          spellCheck={false}
          data-testid={`agents.model.${id}`}
        />
        <datalist id={`ag-models-${id}`}>
          {choices.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <Button
          kind="ghost"
          disabled={model.trim() === '' || model.trim() === (a.model ?? '')}
          onClick={() => {
            refusal.clear();
            setModel(store, project, a.name, model);
          }}
          testId={`agents.model.${id}.set`}
        >
          use it
        </Button>
      </label>
      <div className="ag-field" role="radiogroup" aria-label="reasoning effort">
        <span>reasoning</span>
        {EFFORTS.map((x) => (
          <button
            key={x.effort}
            type="button"
            role="radio"
            aria-checked={a.effort === x.effort}
            className={a.effort === x.effort ? 'ag-seg on' : 'ag-seg'}
            title={x.hint}
            onClick={() => {
              refusal.clear();
              setEffort(store, project, a.name, x.effort);
            }}
            data-testid={`agents.effort.${id}.${x.effort}`}
          >
            {x.effort}
          </button>
        ))}
        {a.effort == null && <em className="ag-why">its model says none</em>}
      </div>
      {refusal.text !== undefined && (
        <p className="ag-err" role="alert" data-testid={`agents.tune.${id}.error`}>
          {refusal.text}
        </p>
      )}
    </div>
  );
}

/** '+ new agent': its brief, a name if he wants one, its own worktree, his uncommitted changes with it (A.1). */
export function NewAgentSheet({ project, onDone }: { project: string; onDone: () => void }) {
  const store = useStore();
  const agents = useAgents(project);
  const changes = hasChanges(useWorktrees(project));
  const refusal = useRefusal(project, ['new']);
  const [brief, setBrief] = useState('');
  const [name, setName] = useState('');
  const [worktree, setWorktree] = useState(false);
  const [withChanges, setWithChanges] = useState(false);
  const [sent, setSent] = useState(false);
  const problem = name.trim() === '' ? undefined : nameProblem(name, agents);
  const send = () => {
    if (problem !== undefined) return;
    refusal.clear();
    if (newAgent(store, project, { brief, name, worktree, withChanges: changes && withChanges })) setSent(true);
  };
  // the new row came: the sheet's job is done
  if (sent && refusal.text === undefined && name.trim() !== '' && agents.some((a) => a.name === name.trim())) onDone();
  return (
    <div className="ag-sheet" data-testid="agents.newsheet">
      <textarea
        className="ag-brief"
        autoFocus
        rows={3}
        placeholder="what should it do?"
        value={brief}
        onChange={(e) => {
          setBrief(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onDone();
          }
        }}
        data-testid="agents.new.brief"
      />
      <div className="ag-sheet-row">
        <label className="ag-field">
          <span>name</span>
          <input
            value={name}
            placeholder="bise names it"
            onChange={(e) => {
              setName(e.target.value);
            }}
            spellCheck={false}
            data-testid="agents.new.name"
          />
          {problem !== undefined && <em className="ag-why">{problem}</em>}
        </label>
        <label className="ag-check">
          <input
            type="checkbox"
            checked={worktree}
            onChange={(e) => {
              setWorktree(e.target.checked);
            }}
            data-testid="agents.new.worktree"
          />
          its own worktree
        </label>
        {changes && worktree && (
          <label className="ag-check">
            <input
              type="checkbox"
              checked={withChanges}
              onChange={(e) => {
                setWithChanges(e.target.checked);
              }}
              data-testid="agents.new.changes"
            />
            with my changes
          </label>
        )}
      </div>
      <div className="ag-acts">
        <Button kind="pri" disabled={brief.trim() === '' || problem !== undefined} onClick={send} testId="agents.new.send">
          start it ⏎
        </Button>
        <Button kind="ghost" onClick={onDone} testId="agents.new.cancel">
          cancel
        </Button>
        {sent && refusal.text === undefined && <span className="ag-why">starting…</span>}
      </div>
      {refusal.text !== undefined && (
        <p className="ag-err" role="alert" data-testid="agents.new.error">
          {refusal.text}
        </p>
      )}
    </div>
  );
}
