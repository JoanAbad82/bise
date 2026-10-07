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
import { useAgents, useCoreEvent, useModels, useStore, useWorktrees, type Ev } from '@/store';
import { defaultWords, EFFORTS, effortsFor, hasChanges, modelGroups, modelOf, nameProblem, newAgent, renameAgent, setEffort } from './actions';
import { modelOrSetup } from '@/settings';
import { useRouter } from '@/app/router';
import { useKeptText } from '@/app/keep';

/** The TUI's words for an effort (rust/tui/src/commands.rs effort_hint). */
function hintOf(e: string): string {
  const known: Record<string, string> = { none: 'no reasoning, the fastest', minimal: 'barely any reasoning', max: 'the hard stuff', xhigh: 'the hard stuff' };
  return EFFORTS.find((x) => x.effort === e)?.hint ?? known[e] ?? '';
}

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
  const router = useRouter();
  const agents = useAgents(project);
  const refusal = useRefusal(project, ['rename', 'model', 'effort']);
  // his rename and his typed model id survive a reload until done or put back (keep.ts)
  const [keptName, keepName, dropName] = useKeptText(a.main ? null : `rename:${project}/${a.name}`);
  const [name, setNameState] = useState(keptName === '' ? a.name : keptName);
  const setName = (n: string) => {
    setNameState(n);
    if (n === a.name) dropName();
    else keepName(n);
  };
  const models = useModels(project);
  const [keptModel, keepModel, dropModel] = useKeptText(`model:${project}/${a.name}`);
  const [model, setModelState] = useState(keptModel === '' ? (a.model ?? '') : keptModel);
  const setModelText = (m: string) => {
    setModelState(m);
    if (m === (a.model ?? '')) dropModel();
    else keepModel(m);
  };
  // the model it runs, or the one he just picked until the agents row moves:
  // a pick is held only while the row still says the model it said at the
  // pick, so any agents event with another model (his pick landing, or a
  // /model from the TUI) wins (qa-flows a8758ee6)
  const [pick0, setPick0] = useState<{ to: string; from: string } | undefined>(undefined);
  const runs = a.model ?? '';
  const picked = pick0 !== undefined && pick0.from === runs ? pick0.to : undefined;
  if (pick0 !== undefined && picked === undefined) setPick0(undefined);
  const setPicked = (m: string | undefined) => {
    setPick0(m === undefined ? undefined : { to: m, from: runs });
  };
  const current = picked ?? runs;
  const groups = modelGroups(models);
  const efforts = effortsFor(models, current);
  const pick = (m: string) => {
    refusal.clear();
    const model = m.trim();
    if (model === '') return;
    // L5 (amb-kit 6078b20c): a model whose provider has no key or sign-in yet opens that
    // provider's setup on settings · models; settings sends the held pick once signed in
    const how = modelOrSetup(model, models, { cmd: 'model', project, agent: a.name, model }, {
      send: (c) => {
        store.command(c);
      },
      setup: () => {
        router.go({ screen: 'settings', page: 'models' });
      },
    });
    if (how === 'sent') {
      setPicked(model);
      dropModel();
    }
  };
  // refused: back to the model it runs
  if (picked !== undefined && refusal.cmd === 'model' && refusal.text !== undefined) setPicked(undefined);
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
    dropName();
    onRenamed?.(landed);
  }, [landed, onRenamed, dropName]);

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
      <div className="ag-field ag-models">
        <span>model</span>
        <div className="ag-model-list" role="listbox" aria-label="model" data-testid={`agents.models.${id}`}>
          {groups.length === 0 && <em className="ag-why">the list comes from the hub</em>}
          {groups.map((g) => (
            <div key={g.head} className="ag-model-group">
              <div className="ag-model-head">{g.head}</div>
              {g.rows.map((m) => {
                const on = m.id === current;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={on ? 'ag-model on' : 'ag-model'}
                    onClick={() => {
                      pick(m.id);
                    }}
                    data-testid={`agents.model.${id}.pick.${m.id}`}
                  >
                    <span className="ag-model-mark">{on ? '✓' : ''}</span>
                    <span className="ag-model-label">{m.label}</span>
                    {/* the catalog's own words, as they come (never rebuilt here) */}
                    <span className="ag-model-short">{m.short}</span>
                    {defaultWords(m) !== '' && <span className="ag-model-def">{defaultWords(m)}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <label className="ag-field">
        <span>or an id</span>
        <input
          value={model}
          placeholder="provider/model"
          onChange={(e) => {
            setModelText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              pick(model);
            }
          }}
          spellCheck={false}
          data-testid={`agents.model.${id}`}
        />
        <Button
          kind="ghost"
          disabled={model.trim() === '' || model.trim() === current}
          onClick={() => {
            pick(model);
          }}
          testId={`agents.model.${id}.set`}
        >
          use it
        </Button>
      </label>
      <div className="ag-field" role="radiogroup" aria-label="reasoning effort">
        <span>reasoning</span>
        {efforts.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={a.effort === e}
            className={a.effort === e ? 'ag-seg on' : 'ag-seg'}
            title={hintOf(e)}
            onClick={() => {
              refusal.clear();
              setEffort(store, project, a.name, e);
            }}
            data-testid={`agents.effort.${id}.${e}`}
          >
            {e}
          </button>
        ))}
        {efforts.length === 0 && (
          <em className="ag-why" data-testid={`agents.effort.${id}.none`}>
            {modelOf(models, current)?.label ?? current} has no reasoning setting
          </em>
        )}
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
  // his brief and name survive a reload until he starts it or cancels (keep.ts)
  const [brief, setBrief, dropBrief] = useKeptText(`new:${project}`);
  const [name, setName, dropNewName] = useKeptText(`new.name:${project}`);
  const [worktree, setWorktree] = useState(false);
  const [withChanges, setWithChanges] = useState(false);
  const [sent, setSent] = useState(false);
  // the name it was started with (the field's kept words are dropped at the send)
  const [sentName, setSentName] = useState('');
  const problem = name.trim() === '' ? undefined : nameProblem(name, agents);
  const cancel = () => {
    dropBrief();
    dropNewName();
    onDone();
  };
  const send = () => {
    if (problem !== undefined) return;
    refusal.clear();
    if (newAgent(store, project, { brief, name, worktree, withChanges: changes && withChanges })) {
      setSent(true);
      setSentName(name.trim());
      dropBrief();
      dropNewName();
    }
  };
  // the new row came: the sheet's job is done
  if (sent && refusal.text === undefined && sentName !== '' && agents.some((a) => a.name === sentName)) onDone();
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
            cancel();
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
        <Button kind="ghost" onClick={cancel} testId="agents.new.cancel">
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
