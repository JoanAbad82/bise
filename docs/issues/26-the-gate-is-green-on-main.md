# 26 · the gate is green on main, and stays green

Status: fixes on sb/debt-t1, the full gate twice next (debt-t1, plan signed by architect m_23084). Item T1
of architect's tech-debt-night list. Label: tests, gate.

## The problem

Agents land past reds that "aren't theirs", and a known red hides the
next real one. Done when `tests/gate.sh full` is green twice in a row on
main's tip, with no known red; each fixed red has its cause in its commit
(never "flake"); a red another task owns is listed here with its owner;
`tests/sleep_exceptions.txt` (22 lines) does not grow.

## The first full gate

`gate.sh full --all` on main d6ece40b: 6 reds, each then run alone
(serial, `run_all.sh --only`):

| test | alone | cause | fix |
|---|---|---|---|
| partial_e2e | red | turn/send answers `{msg_id}` since f4c033f6 | e2e-msgid's 8ef60b33 |
| one_key_auto_e2e | red | the test hub got the user's real keys (below) | keys dropped, a law |
| ambient_core_e2e | red | dffe9d15 puts his card answer in the asker's thread | the test allows it |
| prompt_size_e2e | red | main's role grew 1.5k without its budget | budget raised by the rows |
| tui_file_chips_tmux | green | asserts the size on the first screen with the name | waits for the row |
| tui_computer_use_tmux | green | its folder path's length came from the run's tmp: the gate's made the row wrap | a short path |

Not fixed here, owned elsewhere:

- **tui_queue_tmux**: 2 of 3 alone under load. T4 removes its cause
  (owner: T4 of architect's tech-debt-night list); green in this run.
- **apps/desktop delivery.spec** (not in gate.sh full): amb-win's
  ef74cc92 on main fixed it (the check scrolled the wrong element).

## main's prompt grew past its budget

prompt_size_e2e: main 40913 chars > 40684. Its role rows grew without the
budget, measured on rust/switchboard/src/testdata/prompts/main_role_desktop.txt
at each sha (27929 -> 29437). The budget is raised by exactly these
(architect m_23084), for a later prompt-diet to weigh:

| sha | row | chars |
|---|---|---|
| f0c1b04f | sb every: estimate low and check often, prefer the event | +229 |
| f681138e | sb every: wakes reach a busy agent mid-turn | +34 |
| ae7fcca8 | sb artifact archive / unarchive | +216 |
| 338dd46c | sb wake (a new row) | +548 |
| df1bacdf | sb wake --then / --alarm | +327 |
| d7e20a63 | sb feature retire | +154 |
| | total | +1508 |

The task's prompt is at 28921 of 29044: 123 chars left.

## tui_computer_use_tmux: the gate's tmp

Red in every full gate run from an agent, green alone from an agent's
shell. The extension folder the test shows was
`<tmp>/cu-xxxxxxxx/dev/try/computer-use/extension`, `<tmp>` from
e2e.short_tmp(): the run's $TMPDIR when 40 chars or less (the gate's
`~/.bise/gate/<pid>`, 39 chars here), else /tmp (an agent's own $TMPDIR is
deeper). Under the gate the row `   the folder: <path>` was 97 chars, wider
than the steps column at 150 columns: the TUI wrapped it, and the test
waited 40 s for the one-line row. Reproduced alone with
`TMPDIR=~/.bise/gate/99999`: red, same screen. The path is now
`<tmp>/cu-xxxxxxxx/ext`, short for any tmp short_tmp gives.

## The leak: test hubs had the user's real keys

`tests/bise_env.py clean_env` dropped bise's internal and test variables
and the caller's paths, but kept everything else of his shell, his model
keys too. On this machine that is `OPENROUTER_API_KEY` and
`ANTHROPIC_FOUNDRY_API_KEY` (and `MISTRAL_API_KEY`, which e2e.Env replaces
with a fake one). What reached the real network with his real key:

- **every test hub's efforts refresher** (effort-table step 2, b77eeae5,
  2026-10-13): at its start it fetched OpenRouter's model list with his
  key (`sbd: efforts: 201 lists from openrouter` in each hub's stderr), a
  read-only GET. live_fetch was right (it fetches a provider only with its
  key or login); the key should never have been there.
- **one_key_auto_e2e's approvals checker**: with an OpenRouter key the
  checker route is Jev via OpenRouter, whose call (`approvals/check.rs`,
  curl on the provider's base URL) ignores `BEND_PROVIDER_URL`. It asked
  the real OpenRouter with his key; the key is expired, so the card said
  `API key expired.` and the test went red. Proven by a run with
  `HTTPS_PROXY` on a dead port: the card said `curl: (7) ... 127.0.0.1
  port 9`. Since the test exists (f52fec74, 2026-10-02) whenever his shell
  had the key.

The REPLs' own model calls went to the fake provider (`BEND_PROVIDER_URL`),
local. The other approvals tests run with the checker off.

Closed by:

- `clean_env` drops every provider key (the catalog's `key_env` names,
  read from rust/catalog/models.toml, and auth.rs's ALIASES: one owner) and
  any other `*_API_KEY`; `BISE_TEST_REAL_ACCOUNTS=1` is the only way back
  (`run_all.sh --live` sets it for live_smoke);
- a law, `bise_env.refuse_real_keys`: a test hub or TUI whose env holds a
  key with the caller's own value is refused (e2e.Env.start_hub,
  tui_tmux.start_tui, older_tui_bundle_hub_tmux, version_skew_e2e), with
  its self-test;
- `effort_tests::no_key_no_fetch`: a hub with no provider key makes no
  fetch (both providers on a listener that is never called).

After: one_key_auto_e2e 5/5 alone, and a kept run's hub stderr has no
efforts line, its cache no efforts.json, its checker no card.
