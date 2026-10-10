#!/usr/bin/env python3
"""ambient-qa: throwaway hubs, fake accounts and scripted product runs for bise's QA, never the user's.

The Swift app this plugin once drove (QA.swift's socket, scenes, snapshots) is gone (amb-mac's
delete plan, step 2): the desktop app's own checks live in apps/desktop/tests (its harness, its
checks/world.ts and real.sh call `qa.py world`). What stays: a throwaway hub with the fake accounts
and its page server, the scripted product runs through a `bise ambient-core` child, the asks, and
the QA world (world.py: one throwaway HOME, bise's home hub + 2-3 seeded projects). server.py
exposes it as MCP tools; this file is also the CLI:

  qa.py launch [--hub fake|model]              a throwaway hub, its pages, the fake accounts
  qa.py run <scenario> [--keep] [--json]       a scripted product run (model hub, fake accounts)
  qa.py ask "words" … | page … | tick | outbox | stop
  qa.py world up [--projects 2|3] | state | say <project> <text> | feature <project> <name> | down

Never: the user's real main or hub (the real workspace is refused: it needs a client the user
started, docs/issues/16), his real accounts (fake ones only, unless he asks for one run), pkill by
name (only our own pids).
"""

import json
import sys

# qa.py is the CLI and the one name space: its body moved as is to qa_core, qa_pages, qa_flows,
# qa_checks and qa_run (the 1,000-line cap, architect S1); every name stays qa.<name>.
from qa_core import (  # noqa: E402
    FAKE_ACCOUNTS, FAKE_REPO, FAKE_SERVER_NAMES, FAKE_SERVICES, HELPERS, HERE, HIS_STATE,
    HUB, OTHER_BRANCH, OUT, QAError, QA_DIR, REPO, RUN,
    SCRIPTED_VARS, _CLIENTS, _ReusedEnv, _ancestors, _clock_path, _git, _http,
    _http_once, _hub, _is_exe, _pid_alive, _port, _prepare_home, _read,
    _short_agent, _start_hub, _stop_hub, _wait, app_root_of, behind, dev_dir,
    ensure_helpers, find_bise, hub_daemon, hub_plugins_state, install_fake_accounts, launch, launch_truth,
    other_branch, outbox, own_path, raise_file_limit, reaches_his_state, real_home_env, refuse_his_state,
    require_commits, seed_repo, stale_bise, stop, tick, tree_info, user_plugins_state)
from qa_pages import (  # noqa: E402
    KIT_EXAMPLE, page_drive, page_fixture, page_meta, page_notes, page_publish)
from qa_flows import (  # noqa: E402
    FIX_WORDS, SCENARIOS, SENDS, _agent_settled, _body, _feedback_loop_end, _flow_checklist,
    _flow_feedback, _flow_newsletter, _rows, _sections, _soft_until, _until, _writes,
    answer_card, answer_questions, batch_card, feedback_done_check, option_label, question_pick)
from qa_checks import (  # noqa: E402
    COOKIE_QUESTION, FLOWS, KIT_EXAMPLES, MEETINGS_OVERDUE, MEETINGS_RUN, MEETING_PAGE, MORNING_MEETINGS,
    MORNING_TRUTH, NOT_HIS, PROMISES, SEEDS, SEND_ON, _card_about, _covered,
    _flow_meetings, _flow_mentions, _flow_morning, _flow_promises, _hub_sb, _seed_morning, meeting_brief_check,
    meeting_followup_check, mentions_cards_check, mentions_check, mentions_items, mentions_truth, morning_check, promises_check,
    team_asks)
from qa_run import (  # noqa: E402
    RUN_NOTES, _Core, _run, _term_to_interrupt, ask, keep_hub_state, run,
    run_report)

# ---------------------------------------------------------------- the CLI

def _cli(argv):
    import argparse
    ap = argparse.ArgumentParser(prog="qa.py", description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("launch", help="a throwaway hub, its page server and the fake accounts (no app)")
    p.add_argument("--hub", default="fake", help="fake (scripted) or model (your model and keys, fake accounts)")
    p.add_argument("--bise")
    p.add_argument("--connectors", action="store_true", help="hub model: the user's REAL connectors (needs --real-accounts-approved-by-user)")
    p.add_argument("--computer", action="store_true", help="the QA hub may load the computer plugin: the user's browser (needs --real-accounts-approved-by-user)")
    p.add_argument("--real-accounts-approved-by-user", default="", metavar="MESSAGE_ID", help="the user's own message asking for this one run")
    sub.add_parser("stop", help="stop the throwaway hub")
    p = sub.add_parser("page", help="pages on the throwaway hub")
    p.add_argument("action", choices=["publish", "notes", "meta", "fixture", "drive"]); p.add_argument("--url"); p.add_argument("--steps", help="a JSON file of steps (drive)"); p.add_argument("--schemes", default="light,dark")
    p.add_argument("--file"); p.add_argument("--id", default="weekly-update")
    p.add_argument("--title", default="weekly update"); p.add_argument("--notes", help="JSON list of notes"); p.add_argument("--send", action="store_true")
    p.add_argument("--done", help="n1,n2"); p.add_argument("--edit", help='JSON {"old": "new"} applied to the file first')
    p = sub.add_parser("run", help="a scripted product run on a model hub with the fake accounts, through a bise ambient-core child")
    p.add_argument("scenario", choices=sorted(SCENARIOS)); p.add_argument("--headless", action="store_true", help="(always: kept for old callers)")
    p.add_argument("--timeout", type=int, default=900); p.add_argument("--keep", action="store_true", help="leave the hub running"); p.add_argument("--out")
    p.add_argument("--json", action="store_true", help="print run.json instead of the report")
    p.add_argument("--require", help="commits the bise tree must have (comma-separated): refused otherwise")
    sub.add_parser("outbox")
    p = sub.add_parser("ask", help="asks to main on the running throwaway hub, one after the other: its words, length, time, pages")
    p.add_argument("texts", nargs="*"); p.add_argument("--file", help="one ask per line"); p.add_argument("--no-capsule", action="store_true", help="as the TUI, not through a core")
    p.add_argument("--timeout", type=int, default=600); p.add_argument("--json", action="store_true")
    p = sub.add_parser("tick", help="the launch's next batch of fake comments comes in now (numbers move)"); p.add_argument("--n", type=int, default=1)
    p = sub.add_parser("_hub"); p.add_argument("--bise", required=True); p.add_argument("--kind", default="fake"); p.add_argument("--connectors", action="store_true"); p.add_argument("--computer", action="store_true")
    p.add_argument("--real-accounts-approved-by-user", default=""); p.add_argument("--keep", action="store_true"); p.add_argument("--reuse"); p.add_argument("--home")
    p = sub.add_parser("world", help="bise desktop: one throwaway HOME, bise's home hub + 2-3 seeded projects (world.py)")
    ws = p.add_subparsers(dest="wcmd", required=True)
    q = ws.add_parser("up"); q.add_argument("--projects", type=int, default=3); q.add_argument("--bise"); q.add_argument("--root")
    q.add_argument("--rich", action="store_true", help="the try gate's world: more agents, long threads, every card kind, pages, timers, a screen_context message")
    q.add_argument("--agents", type=int, default=0, help="with --rich: telemetry gets this many agents (filler agents added)")
    ws.add_parser("down"); ws.add_parser("state")
    q = ws.add_parser("say"); q.add_argument("project"); q.add_argument("text")
    q = ws.add_parser("feature"); q.add_argument("project"); q.add_argument("name")
    q = ws.add_parser("computer", help="one agent's row in the world's fake computer-use world (fake_cu.py)")
    q.add_argument("project"); q.add_argument("agent"); q.add_argument("state", choices=["driving", "paused", "stopped", "none"])
    q.add_argument("place", nargs="?", help="'Chrome · amazon.fr' (an app on a place) or 'Notes'")
    ws.add_parser("computer-log", help="every call the fake computer-use broker got, JSON")
    p = sub.add_parser("_cu"); p.add_argument("--run", required=True)
    p = sub.add_parser("_world"); p.add_argument("--bise", required=True); p.add_argument("--root", required=True); p.add_argument("--projects", type=int, default=3)
    p.add_argument("--rich", action="store_true"); p.add_argument("--agents", type=int, default=0)
    a = ap.parse_args(argv)
    if a.cmd == "_cu":
        import fake_cu
        return fake_cu.serve(a.run)
    if a.cmd in ("world", "_world"):
        import world
        if a.cmd == "_world":
            return world.daemon(a.bise, a.root, a.projects, a.rich, a.agents)
        r = {"up": lambda: world.up(a.projects, a.bise, a.root, a.rich, a.agents), "down": world.down, "state": world.state,
             "say": lambda: world.say(a.project, a.text), "feature": lambda: world.feature(a.project, a.name),
             "computer": lambda: world.computer(a.project, a.agent, a.state, a.place), "computer-log": world.computer_log}[a.wcmd]()
        print(json.dumps(r, indent=1, ensure_ascii=False))
        return
    if a.cmd == "_hub":
        return hub_daemon(a.bise, a.kind, a.connectors, a.computer, a.real_accounts_approved_by_user, a.keep, a.reuse, a.home)
    if a.cmd == "launch":
        r = launch(a.hub, a.bise, a.connectors, a.computer, a.real_accounts_approved_by_user)
    elif a.cmd == "stop":
        r = stop()
    elif a.cmd == "page":
        if a.action == "publish":
            r = page_publish(a.file, a.id, a.title, a.done.split(",") if a.done else None, None, json.loads(a.edit) if a.edit else None)
        elif a.action == "notes":
            r = page_notes(a.id, json.loads(a.notes or "[]"), a.send)
        elif a.action == "meta":
            r = page_meta(a.id)
        elif a.action == "drive":
            r = page_drive(None if a.url else a.id, a.url, json.load(open(a.steps)) if a.steps else None, a.schemes)
        else:
            r = page_fixture(a.id)
    elif a.cmd == "run":
        r = run(a.scenario, a.timeout, a.keep, a.out, a.require)
        if not a.json:
            print(r["report"])
            return
    elif a.cmd == "ask":
        texts = list(a.texts) + ([l.strip() for l in open(a.file) if l.strip()] if a.file else [])
        if not texts:
            raise QAError("ask: give the asks (or --file)")
        r = ask(texts, not a.no_capsule, a.timeout)
        if not a.json:
            print(r["report"] + "\n" + r["file"])
            return
    elif a.cmd == "tick":
        r = tick(a.n)
    else:
        r = outbox()
    print(json.dumps(r, indent=1, ensure_ascii=False))


# the moved names are qa.py's exports (qa.<name> for world.py, server.py, the tests)
__all__ = [
    'COOKIE_QUESTION', 'FAKE_ACCOUNTS', 'FAKE_REPO', 'FAKE_SERVER_NAMES', 'FAKE_SERVICES',
    'FIX_WORDS', 'FLOWS', 'HELPERS', 'HERE', 'HIS_STATE',
    'HUB', 'KIT_EXAMPLE', 'KIT_EXAMPLES', 'MEETINGS_OVERDUE', 'MEETINGS_RUN',
    'MEETING_PAGE', 'MORNING_MEETINGS', 'MORNING_TRUTH', 'NOT_HIS', 'OTHER_BRANCH',
    'OUT', 'PROMISES', 'QAError', 'QA_DIR', 'REPO',
    'RUN', 'RUN_NOTES', 'SCENARIOS', 'SCRIPTED_VARS', 'SEEDS',
    'SENDS', 'SEND_ON', '_CLIENTS', '_Core', '_ReusedEnv',
    '_agent_settled', '_ancestors', '_body', '_card_about', '_clock_path',
    '_covered', '_feedback_loop_end', '_flow_checklist', '_flow_feedback', '_flow_meetings',
    '_flow_mentions', '_flow_morning', '_flow_newsletter', '_flow_promises', '_git',
    '_http', '_http_once', '_hub', '_hub_sb', '_is_exe',
    '_pid_alive', '_port', '_prepare_home', '_read', '_rows',
    '_run', '_sections', '_seed_morning', '_short_agent', '_soft_until',
    '_start_hub', '_stop_hub', '_term_to_interrupt', '_until', '_wait',
    '_writes', 'answer_card', 'answer_questions', 'app_root_of', 'ask',
    'batch_card', 'behind', 'dev_dir', 'ensure_helpers', 'feedback_done_check',
    'find_bise', 'hub_daemon', 'hub_plugins_state', 'install_fake_accounts', 'keep_hub_state',
    'launch', 'launch_truth', 'meeting_brief_check', 'meeting_followup_check', 'mentions_cards_check',
    'mentions_check', 'mentions_items', 'mentions_truth', 'morning_check', 'option_label',
    'other_branch', 'outbox', 'own_path', 'page_drive', 'page_fixture',
    'page_meta', 'page_notes', 'page_publish', 'promises_check', 'question_pick',
    'raise_file_limit', 'reaches_his_state', 'real_home_env', 'refuse_his_state', 'require_commits',
    'run', 'run_report', 'seed_repo', 'stale_bise', 'stop',
    'team_asks', 'tick', 'tree_info', 'user_plugins_state',
]


if __name__ == "__main__":
    try:
        _cli(sys.argv[1:])
    except QAError as e:
        print("ambient-qa: %s" % e, file=sys.stderr)
        sys.exit(1)
