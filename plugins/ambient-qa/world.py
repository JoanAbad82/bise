"""ambient-qa world: a throwaway bise with several projects, for bise desktop (S12).

One isolated HOME under ~/.bise/gate holds bise's home workspace (<HOME>/bise,
no git) and 2 or 3 projects (<HOME>/code/<name>, git repos). Each runs its
own hub with tests/e2e.py's scripted provider. The hubs find their state by
the user's own rules (<HOME>/.bise/hubs/<name>-<hash>), the way the app's
core finds his, never through SB_STATE_DIR. The fake mains then seed each
project through their own `sb`: agents in worktrees, a committed diff
ready for review, a dirty worktree with an agent at work, cards with
options, a merge question, a blocked agent, an artifact.

  qa.py world up [--projects 2|3] [--bise EXE]  the hubs, seeded; returns the world
  qa.py world state                             what each hub holds: agents, cards, diffs
  qa.py world say <project|bise> "<words>"      words to that project's main (the fake one)
  qa.py world computer <project> <agent> driving|paused|stopped|none [place]
                                                that agent's row in the fake computer use (fake_cu.py)
  qa.py world computer-log                      the calls the fake computer-use broker got
  qa.py world down                              stops every hub of the world by its pid

`up` takes the heavy lock (/usr/bin/lockf -k ~/.bise/run/heavy.lock nice
-n 10) only around a rebuild of the tree's helpers (scripts/bins.sh) that
will compile; with built helpers and an existing bise it never waits on it
(main m_10008: the lock is for cargo builds and gates). The hubs
then idle until `down`; a daemon holds a `hello` on each, so none of them
stops through idle-exit. `world.json` (in the world's folder) names every hub:
its workspace, socket, state folder and pid. Nothing here touches the user's
hubs, app or accounts: every path is under ~/.bise/gate, checked before start.

The fixtures (PROJECTS, main_script, agent_script) are pure, tested in
tests/ambient_qa_test.py; the daemon only runs them.
"""
import glob
import json
import os
import re
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.realpath(__file__))
GATE = os.path.expanduser("~/.bise/gate")
LOCK = os.path.expanduser("~/.bise/run/heavy.lock")
HOME_NAME = "bise"     # bise's own hub: the home workspace, its main is bise


# ---------------------------------------------------------------- the fixtures (pure)

LATENCY_BEFORE = '''"""request latency percentiles for the dashboard"""


def p99(samples):
    # the mean of the slowest 10%: rises with every slow outlier
    slow = sorted(samples)[int(len(samples) * 0.9):]
    return sum(slow) / len(slow)
'''

LATENCY_AFTER = '''"""request latency percentiles for the dashboard"""


def percentile(samples, q):
    s = sorted(samples)
    return s[min(len(s) - 1, int(len(s) * q))]


def p99(samples):
    # the real 99th percentile: one slow outlier no longer moves it
    return percentile(samples, 0.99)
'''

PROJECTS = [
    {"name": "telemetry",
     "files": {"README.md": "# telemetry\n\nlatency and error dashboards.\n", "src/latency.py": LATENCY_BEFORE,
               "src/alerts.py": "ALERTS = []\n"},
     "cards": ["which window for the p99 alert?\n1. 5 min\n2. 15 min"],
     "agents": [
         {"name": "p99", "place": "new", "objective": "p99 rises since tuesday: find why and fix it",
          "steps": [{"write": "src/latency.py", "text": LATENCY_AFTER},
                    {"commit": "latency: p99 is the real 99th percentile, not the mean of the slowest 10%"},
                    {"report": "done", "text": "p99 rose because it averaged the slowest 10%; it is the real percentile now (src/latency.py). ready to merge."}]},
         {"name": "alerts", "place": "new", "objective": "page on-call when p99 stays above 800 ms",
          "steps": [{"write": "src/alerts.py", "text": "ALERTS = [{'metric': 'p99', 'above_ms': 800, 'for': '5m'}]\n"},
                    {"report": "progress", "text": "wiring the p99 alert", "step": "2/4"},
                    # a question main answers for him (qa-flows m_11510 (b): the 'answered for you' row, with why)
                    {"ask": "page on-call through PagerDuty or Slack?\n1. PagerDuty\n2. Slack",
                     "main_answers": {"text": "PagerDuty", "why": "the runbook pages on-call through PagerDuty; Slack is for FYI only"}},
                    {"work": 3600}]},
     ]},
    {"name": "shop",
     "files": {"README.md": "# shop\n\nthe store front.\n", "search/index.py": "def find(q, items):\n    return [i for i in items if q == i['name']]\n",
               "checkout/cart.py": "def total(items):\n    return sum(i['price'] for i in items)\n"},
     "cards": ["merge checkout into main? (2 files, tests pass)\n1. merge\n2. not yet"],
     "agents": [
         {"name": "checkout", "place": "new", "objective": "apply the discount codes at checkout",
          "steps": [{"write": "checkout/cart.py", "text": "def total(items, discount=0):\n    return round(sum(i['price'] for i in items) * (1 - discount), 2)\n"},
                    {"write": "checkout/codes.py", "text": "CODES = {'SPRING10': 0.10}\n"},
                    {"commit": "checkout: discount codes (SPRING10) applied to the total"},
                    {"report": "done", "text": "discount codes work at checkout (checkout/cart.py, checkout/codes.py). waiting for your merge."}]},
         {"name": "search", "place": "", "objective": "search doesn't find tshirt",
          "steps": [{"report": "blocked", "text": "search ne trouve pas tshirt: the index matches whole names only. fuzzy match or a synonym list?"}]},
         # a worktree agent with a draft PR, checks running (#415 below)
         {"name": "receipts", "place": "new", "objective": "email the receipt after checkout",
          "steps": [{"write": "checkout/receipt.py", "text": "def receipt(order):\n    return 'total: %.2f' % order['total']\n"},
                    {"commit": "receipts: the receipt text"},
                    # a message between two other agents (qa-flows m_11510 (c): the 'a → b' row)
                    {"send": "checkout", "text": "the receipt shows the discounted total: does total() round before or after the code?"},
                    {"report": "progress", "text": "draft PR #415 open, e2e running", "step": "2/3"}]},
         # a FEATURE with 2 agents (qa-flows m_10155): each in its own worktree from the feature's tip,
         # landing on the feature branch, so a try and a merge are possible (sb feature ready / merge)
         {"name": "gift-api", "feature": "gift-cards", "objective": "gift cards: the balance API",
          "steps": [{"write": "checkout/gift.py", "text": "BALANCES = {}\n\n\ndef balance(code):\n    return BALANCES.get(code, 0)\n"},
                    {"commit": "gift cards: balance(code) for the cart and checkout"},
                    {"land": "gift cards: the balance API, checkout/gift.py"},
                    {"report": "done", "text": "gift card balance API landed on gift-cards (checkout/gift.py)."}]},
         # ...and an agent with an open QUESTION of its own: it asks main, main escalates it as a card
         # tied to the agent's message (sb card --for), so the card is the agent's, not main's
         {"name": "gift-ui", "feature": "gift-cards", "objective": "gift cards: show the balance to the buyer",
          "steps": [{"write": "checkout/gift_ui.py", "text": "def label(balance):\n    return 'gift card: %.2f' % balance\n"},
                    {"commit": "gift cards: the balance label"},
                    {"land": "gift cards: the balance label, checkout/gift_ui.py"},
                    {"ask": "gift cards: show the balance on the cart page, or only at checkout?\n1. on the cart page\n2. only at checkout"},
                    {"report": "blocked", "text": "waiting for your answer: cart page or checkout only?"}]},
     ],
     "feature": "gift-cards",
     # a tool approval he answers with a note, in auto mode (qa-flows m_11510 (a)): after the seeds,
     # the world switches this hub to auto for the session, an agent force-pushes (a hard rule: a
     # card even in auto), the world answers 'no: <note>' as him, then yolo again. The call never
     # runs; its remote is a path in the world's home that doesn't exist, never the network.
     "approval": {"agent": "release", "objective": "publish the release branch",
                  "remote": "nowhere.git", "note": "use a branch, never force main"},
     # the shop's GitHub, for the PR list (ambient-lead m_10397): an origin on github.com that only the
     # world's fake gh (fake_gh.py, first on the hubs' PATH) ever answers; nothing reaches the network
     "origin": "https://github.com/acme-qa/shop.git",
     "prs": [
         {"number": 412, "branch": "sb/checkout", "title": "checkout: discount codes", "draft": False,
          "review": "CHANGES_REQUESTED", "rollup": "FAILURE",
          "checks": [{"name": "unit", "conclusion": "SUCCESS"},
                     {"name": "e2e", "conclusion": "FAILURE", "log": ["FAIL checkout/test_total.py::test_spring10 - assert 90.0 == 89.99"]}],
          "reviews": [{"state": "CHANGES_REQUESTED", "author": "lea-qa", "body": "round after the discount, not before"}]},
         # the hub follows PRs of plain worktree places only (core.rs pr_watches): a feature agent's
         # branch is never asked, so the draft is on receipts' worktree branch
         {"number": 415, "branch": "sb/receipts", "title": "receipts: email the receipt after checkout", "draft": True,
          "review": None, "rollup": "PENDING",
          "checks": [{"name": "unit", "conclusion": "SUCCESS"}, {"name": "e2e", "status": "IN_PROGRESS", "conclusion": None}],
          "reviews": []},
     ]},
    {"name": "docs",
     "files": {"README.md": "# docs\n\nthe user guide.\n", "guide/start.md": "# getting started\n\nInstal the app, then run it.\n"},
     "cards": [],
     "agents": [
         {"name": "typos", "place": "new", "objective": "fix the typos in the guide",
          "steps": [{"write": "guide/start.md", "text": "# getting started\n\nInstall the app, then run it.\n"},
                    {"commit": "guide: install, not instal"},
                    {"write": "notes.md", "text": "# style notes\n\n- one idea per sentence\n- say install, never setup\n"},
                    {"artifact": "notes.md", "title": "style notes"},
                    {"report": "done", "text": "one typo fixed in guide/start.md; style notes for the next pass."}]},
     ]},
]


def plan(n=3, rich=False):
    """The projects of a world of n (2 or 3); rich: the three, with RICH_AGENTS added."""
    if n not in (2, 3):
        raise ValueError("a world has 2 or 3 projects, not %r" % (n,))
    if not rich:
        return PROJECTS[:n]
    return [dict(p, agents=list(p["agents"]) + RICH_AGENTS.get(p["name"], [])) for p in PROJECTS]


# ---------------------------------------------------------------- the rich world (the try gate, main m_12384)
# `world up --rich`: the 3 projects with more agents (every status: working, idle, done, blocked,
# archived; the gift-cards feature's 2), long threads (telemetry's main: 110 of his messages with
# tables, code and lists, each answered in markdown, one 52-line answer per third subject; the
# dashboards agent: 30 turns of tool rows, bash ok and failing, edits with their diffs), every card
# kind the fakes can raise (questions, a merge question, a feature_try approval, the gate's tool
# approval answered with a note), pages and files as artifacts, scheduled tasks, a message with his fn
# context (the input op's `context`, rendered by the hub), and a try home's 'real' dir (try-real/:
# projects.json + config.toml on the world's fake provider) for BISE_TRY_REAL. `--agents N`: telemetry
# gets N agents. Content reads as a real run (D5, ambient-lead m_12605/m_12612): his messages and the
# briefs are plain words, never a marker; the fake providers run from scripts ($FAKE_SCRIPTS: the
# calls and the answer for a phrase of his message) and answer plainly ($FAKE_PLAIN: no echo).

RICH_AGENTS = {
    "telemetry": [
        {"name": "dashboards", "place": "new", "objective": "the latency dashboard, panel by panel",
         "steps": [{"write": "panels.md", "text": "# panels\n"}, {"commit": "dashboards: the panels list"},
                   {"report": "progress", "text": "panels list started; adding them one by one", "step": "1/3"}]},
        {"name": "ingest", "place": "", "objective": "look at the ingest lag when you have a minute", "steps": []},
    ],
    "shop": [
        {"name": "perf", "place": "", "objective": "the cart page is slow on mobile: measure before changing anything",
         "steps": [{"report": "progress", "text": "measuring the cart page on a slow phone profile", "step": "1/2"}]},
    ],
    "docs": [
        {"name": "changelog", "place": "new", "objective": "write the 0.4 changelog",
         "steps": [{"write": "CHANGELOG.md", "text": "# 0.4\n\n- install works on fish\n- the guide says install, not instal\n"},
                   {"commit": "changelog: 0.4"},
                   {"report": "done", "text": "the 0.4 changelog is in CHANGELOG.md."}]},
    ],
}
RICH_DROPPED = ("docs", "changelog")      # done, then dropped by main: the archived agent

CROWD = ["ingest-lag", "disk-alerts", "grafana-import", "slo-report", "trace-sampling", "log-retention", "cost-dashboard",
         "error-budget", "alert-noise", "heatmap", "region-split", "otel-upgrade", "cardinality", "synthetic-checks",
         "status-page", "oncall-rota", "runbook-links", "query-cache", "metrics-backfill", "kafka-lag", "dns-latency",
         "tls-expiry", "cold-start", "gc-pauses", "pool-sizing", "rate-limits", "uptime-weekly", "cdn-hits", "db-locks",
         "mem-leak", "canary-split", "flaky-probe", "dash-export", "pager-tuning", "trace-ui", "late-events"]


def crowd(total, have):
    """The filler agents that bring telemetry to `total` agents ({name, objective}), real-looking. Pure."""
    n = max(0, total - have)
    if n > len(CROWD):
        raise ValueError("--agents %d: at most %d" % (total, have + len(CROWD)))
    return [{"name": c, "objective": "look into %s and tell me what you find" % c.replace("-", " ")} for c in CROWD[:n]]


LONG = ("The p99 moved on tuesday, right when the new ingest batch size went out, and it moved on every region at once, "
        "which points at something shared rather than one noisy host. Before we touch the alert, I'd like to know whether the "
        "dashboard averages the slowest ten percent or takes the real percentile, because the two drift apart as soon as the "
        "tail gets heavy. If it's the average, the alert has been lying to us for weeks and the 800 ms threshold means nothing. "
        "Please also check the error budget page: it reads the same series, so a fix there changes what the weekly report says.")
TABLE = ("| service | p50 | p99 | errors |\n|---|---:|---:|---:|\n| api | 42 ms | 810 ms | 0.3% |\n"
         "| ingest | 18 ms | 240 ms | 0.1% |\n| search | 65 ms | 1.2 s | 1.4% |\n| checkout | 51 ms | 690 ms | 0.2% |")
CODE = "```python\ndef p99(samples):\n    s = sorted(samples)\n    top = s[int(len(s) * 0.9):]\n    return sum(top) / len(top)\n```"
LIST = ("1. fix the p99\n2. wire the alert\n   - PagerDuty for on-call\n   - Slack for FYI only\n3. ship the dashboard\n\n"
        "> keep the old panel until friday, people still read it")


SUBJECTS = ["the api", "ingest", "search", "checkout", "the gateway", "auth", "the cart page", "billing", "the worker queue",
            "notifications", "the cdn edge", "the mobile app", "exports", "the admin panel", "webhooks", "the scheduler",
            "reports", "uploads", "the pricing page", "sessions", "the batch jobs", "the status page"]


def long_answer(s):
    """A long markdown answer (52 lines: R18's 40-line answer, headings, a table, code, a checklist,
    a quote) about subject s. Pure."""
    return "\n".join([
        "Agreed on %s: it's the shared batch size, not one noisy host. Here is the whole picture." % s,
        "",
        "## what changed on tuesday",
        "",
        "The ingest batch size went from 500 to 2000 events at 14:10. Every region moved within the same minute,",
        "which rules out a single host or a bad deploy in one zone. The p99 went up, the p50 barely moved: the",
        "tail got heavy, the middle didn't.",
        "",
        "| region | p50 before | p50 after | p99 before | p99 after |",
        "|---|---:|---:|---:|---:|",
        "| eu-west | 41 ms | 43 ms | 610 ms | 880 ms |",
        "| us-east | 39 ms | 40 ms | 580 ms | 910 ms |",
        "| ap-south | 52 ms | 55 ms | 720 ms | 1.1 s |",
        "",
        "## why the panel made it look worse",
        "",
        "The panel doesn't take the real percentile. It sorts the samples and averages the slowest 10%:",
        "",
        "```python",
        "def p99(samples):",
        "    s = sorted(samples)",
        "    top = s[int(len(s) * 0.9):]",
        "    return sum(top) / len(top)",
        "```",
        "",
        "On quiet hours that reads lower than the real p99, and under load it reads much higher, because a",
        "few very slow requests pull the whole average up. The right one:",
        "",
        "```python",
        "def p99(samples):",
        "    s = sorted(samples)",
        "    return s[min(len(s) - 1, int(len(s) * 0.99))]",
        "```",
        "",
        "## what I'd do, in order",
        "",
        "1. Fix the percentile in `src/latency.py` (the change above, with a test on a known series).",
        "2. Put the batch size back to 500 for one day and compare: if the p99 falls back, it's the batch.",
        "3. Only then move the alert threshold. With the real percentile, 800 ms may already be right.",
        "",
        "- [x] the percentile fix is written",
        "- [ ] the one-day batch test",
        "- [ ] the alert threshold",
        "- [ ] the error budget page, which reads the same series",
        "",
        "> the weekly report reads this panel too, so last week's number was wrong: I'd say so in the next one",
        "",
        "## what it costs",
        "",
        "The fix is a one-line change plus its test. The batch test needs nothing from you: I'll set it up and",
        "tell you tomorrow what the numbers say. The threshold is your call once we have them.",
    ])


def rich_messages(n=110):
    """His n messages to telemetry's main (22 subjects x 5 kinds, all different), each with its
    markdown answer: {text, match (his first line), reply, needle (the answer's first sentence)}.
    The 4th kind on every 3rd subject gets long_answer (52 lines). Pure."""
    out = []
    for i in range(n):
        s, kind = SUBJECTS[(i // 5) % len(SUBJECTS)], i % 5
        if kind == 0:
            text = "here are this week's numbers for %s, check them:\n\n%s" % (s, TABLE)
            reply = ("I checked the numbers for %s.\n\n- **p99** is the outlier: search at 1.2 s is the only one past the 800 ms line\n"
                     "- **errors** at 1.4%% on search too, the rest under 0.5%%\n- api and checkout look fine\n\n"
                     "I'd look at search's index first; the others can wait a week." % s)
        elif kind == 1:
            text = "why does this give the mean for %s, not the p99?\n\n%s" % (s, CODE)
            reply = ("The mean for %s comes from line 3: it keeps the slowest 10%% and averages them.\n\n"
                     "```python\ndef p99(samples):\n    s = sorted(samples)\n    return s[min(len(s) - 1, int(len(s) * 0.99))]\n```\n\n"
                     "That takes the sample at the 99th position instead, which is what the panel's title promises." % s)
        elif kind == 2:
            text = "plan for %s today:\n\n%s" % (s, LIST)
            reply = ("Here's the plan for %s, in order.\n\n1. the p99 fix: an hour, with its test\n2. the alert: on-call by PagerDuty, "
                     "FYI in Slack\n3. the dashboard, once the first two are in\n\nThe old panel stays until friday, as you said." % s)
        elif kind == 3:
            text = "%s: %s" % (s, LONG)
            reply = long_answer(s) if (i // 5) % 3 == 0 else (
                "Agreed on %s: it's the shared batch size, not one noisy host.\n\n## next\n\n- check whether the panel averages the tail\n"
                "- then the alert threshold\n- then the error budget page, which reads the same series" % s)
        else:
            text = "where are we on %s? one paragraph is enough" % s
            reply = ("Where %s stands: the latency fix is written and tested, the alert waits for the real percentile, and nothing "
                     "is blocked on you. I'll tell you when the dashboard is up." % s)
        out.append({"text": text, "match": text.split("\n")[0][:80], "reply": reply, "needle": reply.split("\n")[0][:60]})
    return out


REGIONS = ["eu-west", "us-east", "ap-south"]
METRICS = ["p99 latency", "p50 latency", "error rate", "requests per second", "queue depth", "cache hit rate",
           "cold starts", "db time", "retries", "timeouts"]


def dash_messages(n=30):
    """n turns for the dashboards agent, his plain words with their script: a bash that adds the panel
    (with its description), every third a bash that fails (exit 1), an edit of that panel's line (a
    diff), a closing bash; the reply's first line is the needle. Pure."""
    out = []
    for i in range(n):
        m, r = METRICS[i % len(METRICS)], REGIONS[(i // len(METRICS)) % len(REGIONS)]
        title = "%s · %s" % (m, r)
        calls = [("bash", "printf '# %s\\n' >> panels.md && echo added @@ add the %s panel" % (title, m))]
        if i % 3 == 1:
            calls.append(("bash", "python3 -c \"import sys; print('no data for %s in %s yet'); sys.exit(1)\"" % (m, r)))
        calls.append(("edit", {"file_path": "panels.md", "old_string": "# %s\n" % title, "new_string": "# %s (last 24 h, by host)\n" % title}))
        calls.append(("bash", "tail -n 3 panels.md"))
        reply = "Added the %s panel for %s." % (m, r)
        if i % 3 == 1:
            reply += "\n\nThere's no data for it in %s yet, so it shows empty until the exporter is on there." % r
        out.append({"text": "add the %s panel for %s" % (m, r), "calls": calls, "reply": reply, "needle": reply.split("\n")[0]})
    return out


# the bar's seeds (ambient-lead m_16108, ambient-pm 70ba71ae): R37/FOLDS2's '▸ N other step' pill and
# thinking row (a 'skill' call is ToolKind::Other, rust/proto/src/thread.rs; reasoning paced so
# 'thought N s' shows), and a tool output past the hub's 4 KB cap (TOOL_TEXT_CAP) with a known total
LOG_LINE = "batch %04d  ingest ok  lag 41 ms"
LOG_LINES = 640
LONG_OUT_BYTES = LOG_LINES * (len(LOG_LINE % 1) + 1)      # 21120 bytes: '… 4 KB of 21 KB shown'


def bar_turns():
    """The dashboards agent's two extra turns for the bar, as scripts: {text, calls, reply, needle,
    think?, stream?}. Pure."""
    other = {"text": "work out which panels still have no data, and check the pages guide before you write it up",
             "think": "Three panels came back empty: cold starts, db time and timeouts, all in us-east. That's the region "
                      "without the exporter, so it's not the panels. Before I write this up as a page I should read the "
                      "pages guide, then list them with what each needs.",
             "stream": {"chunks": 10, "every": 0.4},
             "calls": [("skill", "bise-pages"),
                       ("bash", "grep -c 'us-east' panels.md @@ count the us-east panels"),
                       ("bash", "tail -n 3 panels.md")],
             "reply": "Three panels have no data yet, all in us-east: **cold starts**, **db time** and **timeouts**. "
                      "The exporter isn't on there; once it is, they fill without a change on our side."}
    out = {"text": "show me the last hour of the ingest log",
           "calls": [("bash", "for i in $(seq 1 %d); do printf '%s\\n' \"$i\"; done @@ print the last hour of the ingest log"
                      % (LOG_LINES, LOG_LINE.replace("%04d", "%04d")))],
           "reply": "The last hour of ingest: %d batches, every one ok, lag steady at 41 ms." % LOG_LINES}
    for t in (other, out):
        t["needle"] = t["reply"].split("\n")[0][:60]
    return [other, out]


# his messages for the right-aligned rows (ambient-lead m_16198, designer's messages-right): one
# QUEUED behind ingest's 2-hour turn (input op "queued": true, as the core sends it: stays queued
# until world down), one STEERED into a dashboards turn while its slow command runs (the hub hands it
# to the agent mid-turn: the turn's next step answers it), and one to telemetry's main QUOTING an
# earlier answer (the composer's `<selection from="main">…</selection>` in front of his words,
# apps/desktop/src/composer/message.ts quoteTag + buildMessage)
QUEUED_TEXT = "when it drops, also tell me what the peak was"
STEER_TURN = {"text": "rebuild the latency panels from the raw series",
              "calls": [("bash", "sleep 6 && echo rebuilt 9 panels @@ rebuild the latency panels from the raw series")],
              "reply": "Rebuilt the 9 latency panels from the raw series."}
STEER_TEXT = "while you're at it, put p95 next to p99 on each of them"
STEER_REPLY = "Rebuilt the 9 latency panels from the raw series, and added **p95** next to p99 on each, as you asked mid-way."
QUOTED = "Agreed on the api: it's the shared batch size, not one noisy host. Here is the whole picture."
QUOTE_WORDS = "is that still true now that the batch size is back to 500?"
QUOTE_REPLY = ("Mostly. With the batch back at 500 the p99 fell from 910 ms to 640 ms in us-east, so the batch was most of it. "
               "The rest is the panel's old percentile, which the fix replaces.")


def quoted_message(quoted=QUOTED, words=QUOTE_WORDS, frm="main"):
    """His message quoting an earlier answer, as the window's composer builds it. Pure."""
    return '<selection from="%s">\n%s\n</selection>\n%s' % (frm, quoted, words)


P99_ASK = "ship the p99 fix today or after the batch test?\n1. today\n2. after the batch test"
P99_ANSWER = {"text": "after the batch test", "why": "the batch test runs tomorrow and could move the threshold; one day costs nothing"}


SCREEN_TEXT = "make the apply-code button match this mock"
SCREEN_CONTEXT = {"app": "Figma", "title": "checkout, mobile cart", "file": "Checkout.fig", "selection": "Apply code",
                  "window_text": "Cart · 3 items · Subtotal 89.99 · Apply code · Checkout"}
SCREEN_REPLY = ("The mock's apply-code button is the secondary style, not the primary one we ship.\n\n"
                "- **height** 40 px (ours is 44)\n- **label** sentence case: *Apply code*\n- **color** the outline, filled only on hover\n\n"
                "I'll change `checkout/CartCode.tsx` to match and send you a shot of the cart on a phone.")


def screen_input():
    """His words with his fn context, the input op as the app sends it (`context`: the FnContext the hub
    renders with rust/switchboard/src/fn_context.rs). Pure."""
    return {"op": "input", "focus": "main", "text": SCREEN_TEXT, "context": dict(SCREEN_CONTEXT)}


SEED_WORDS = {"telemetry": "get the team going on telemetry: the p99, the alert and the dashboard",
              "shop": "get the team going on the shop: checkout, search, receipts and the gift cards",
              "docs": "get the team going on the docs"}


def put_script(d, name, match, calls=(), reply="", slow=None):
    """One script for the world's fake providers ($FAKE_SCRIPTS): a user message holding `match` makes
    `calls` [(tool, arg)], then answers `reply`. Written atomically."""
    os.makedirs(d, exist_ok=True)
    s = {"match": match, "calls": [{"tool": t, "arg": a} for t, a in calls], "reply": reply}
    if slow:
        s["slow"] = slow
    tmp = os.path.join(d, ".%s.tmp" % name)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f)
    os.replace(tmp, os.path.join(d, name + ".json"))


def scripts_dir(world):
    return os.path.join(world, "rich", "scripts")


def agent_reply(agent):
    """What an agent says after its seed script: its last report, as a sentence. Pure."""
    reps = [s["text"] for s in agent.get("steps", []) if "report" in s]
    t = reps[-1] if reps else "started; I'll report when there is something to look at"
    return t[0].upper() + t[1:] + ("" if t.endswith((".", "?")) else ".")


def try_real(dir_, projects, url):
    """A try home's 'real' dir (BISE_TRY_REAL): projects.json (the world's projects, in order) and a
    config.toml whose main runs on the world's fake provider; never a key of his. The fake provider's
    key comes from a key_command ('echo fake-key'), so the try core's accounts event lists 'fake' as
    signed_in and setup's model step can continue to the project picker (qa-native m_12872, R34);
    key_env names a variable nothing sets, only so the account is listed. Returns the dir."""
    os.makedirs(dir_, exist_ok=True)
    with open(os.path.join(dir_, "projects.json"), "w") as f:
        json.dump({"v": 1, "projects": [{"path": p["ws"], "name": p["project"], "order": i} for i, p in enumerate(projects)]}, f, indent=1)
    base = url.split("/chat/completions")[0]
    with open(os.path.join(dir_, "config.toml"), "w") as f:
        f.write('[roles]\nmain = "fake/mistral-small-latest"\nclassify = "off"\n\n' + FAKE_ACCOUNT % base)
    return dir_


def rich_seed(world, hubs, holds, agents, timeout):
    """The rich world's extra seeding, on the hubs already seeded. Each part runs alone: a part that
    fails is recorded in `errors` (the world stays up, the try gate sees what is missing)."""
    import qa
    by = {h["project"]: c for h, c in zip(hubs, holds)}
    hub = {h["project"]: h for h in hubs}
    d = os.path.join(world, "rich")
    os.makedirs(d, exist_ok=True)
    out = {"errors": []}

    def part(name, fn):
        t0 = time.time()
        try:
            out[name] = fn()
        except Exception as e:  # noqa: BLE001 - one part's failure must not stop the others
            out["errors"].append("%s: %s" % (name, e))
        print("world: rich %s in %.0f s" % (name, time.time() - t0), flush=True)

    sd = scripts_dir(world)

    def bash(project, words, script, reply):
        """his plain words to `project`'s main, which runs the script (the fake provider's script for
        those words: never a marker in his message), then answers `reply`; waits for the script's
        .done file, then main idle."""
        k = len([n for n in os.listdir(d) if n.endswith(".sh")])
        path = os.path.join(d, "%s-%d.sh" % (project, k))
        with open(path, "w") as f:
            f.write("set -u\n{\n%s\n} > %s.log 2>&1\ntouch %s.done\n" % (script, path, path))
        put_script(sd, "%s-%d" % (project, k), words, [("bash", "bash %s" % path)], reply)
        # a say can be lost while main is busy (seen on the crowd step: main idle, the script never
        # asked): idle first, said again once when nothing ran
        for attempt in (1, 2):
            by[project].wait_idle("main", timeout=timeout)
            by[project].say(words)
            try:
                by[project].wait(lambda: os.path.exists(path + ".done"), min(timeout, 60), "%s ran" % path)
                break
            except Exception:  # noqa: BLE001 - wait.until's timeout
                if attempt == 2:
                    raise
        by[project].wait_idle("main", timeout=timeout)
        return path

    def turn(project, agent, text, needle, focus=None):
        """his words to an agent, its answer's first line awaited; said again once when none (a [bise]
        note reaching the agent mid-turn makes its next turn answer the note instead)."""
        c = by[project]
        for attempt in (1, 2):
            c.wait_idle(agent, timeout=timeout)
            c.say(text, focus=focus or agent)
            try:
                c.wait_line(agent, needle, min(timeout, 60))
                return
            except Exception:  # noqa: BLE001 - wait.until's timeout
                if attempt == 2:
                    raise

    def long_main():
        msgs = rich_messages()
        for i, m in enumerate(msgs):
            put_script(sd, "main-%03d" % i, m["match"], (), m["reply"])
        for m in msgs:
            turn("telemetry", "main", m["text"], m["needle"])
        return len(msgs)

    def dash():
        msgs = dash_messages()
        for i, m in enumerate(msgs):
            put_script(sd, "dash-%02d" % i, m["text"], m["calls"], m["reply"])
        for m in msgs:
            turn("telemetry", "dashboards", m["text"], m["needle"])
        return len(msgs)

    def bar():
        # R37/FOLDS2 (an 'other' step + a thinking row) and the 4 KB output cut, on the dashboards agent
        turns = bar_turns()
        for i, t in enumerate(turns):
            put_script(sd, "bar-%d" % i, t["text"], t["calls"], t["reply"])
            if t.get("think") or t.get("stream"):
                f = os.path.join(sd, "bar-%d.json" % i)
                s = json.load(open(f))
                s.update({k: t[k] for k in ("think", "stream") if t.get(k)})
                with open(f + ".tmp", "w") as fh:
                    json.dump(s, fh)
                os.replace(f + ".tmp", f)
        for t in turns:
            turn("telemetry", "dashboards", t["text"], t["needle"])
        return {"other_step": turns[0]["text"], "long_output_bytes": LONG_OUT_BYTES}

    def answered():
        # the docked 'answered … for you' row, last in telemetry's thread so a check reaches it (the
        # seed's PagerDuty answer sits under 110 messages): p99 asks main, main answers for him with why
        f = ask_file(world, "telemetry", "p99-ship")
        os.makedirs(os.path.dirname(f), exist_ok=True)
        q = shlex.quote
        ask = os.path.join(d, "p99-ask.sh")
        with open(ask, "w") as fh:
            fh.write("sb send main --expect-reply %s | sed -n 's/^sent \\(m_[0-9]*\\).*/\\1/p' > %s.tmp && mv %s.tmp %s\n"
                     % (q(P99_ASK), q(f), q(f), q(f)))
        reply = os.path.join(d, "p99-answer.sh")
        with open(reply, "w") as fh:
            fh.write("for i in $(seq 120); do [ -s %s ] && break; sleep 0.5; done\nsb send p99 --reply-to \"$(cat %s)\" --why %s %s\ntouch %s.done\n"
                     % (q(f), q(f), q(P99_ANSWER["why"]), q(P99_ANSWER["text"]), q(reply)))
        words = "ask main whether the p99 fix ships today"
        put_script(sd, "p99-ask", words, [("bash", "bash %s" % ask)], "Asked main: today or after the batch test.")
        put_script(sd, "p99-answer", P99_ASK.split("\n")[0], [("bash", "bash %s" % reply)],
                   "I answered p99 for you: after the batch test, since it runs tomorrow and could move the threshold.")
        c = by["telemetry"]
        c.wait_idle("main", timeout=timeout)
        c.wait_idle("p99", timeout=timeout)
        c.say(words, focus="p99")
        c.wait(lambda: os.path.exists(reply + ".done"), timeout, "main's answer for p99")
        c.wait_idle("main", timeout=timeout)
        return "telemetry: main answered p99 for him (%s)" % P99_ANSWER["text"]

    def messages():
        c = by["telemetry"]
        out_ = {}
        # STEERED: his words reach dashboards while its slow command runs; the turn's next step answers them
        put_script(sd, "steer-turn", STEER_TURN["text"], STEER_TURN["calls"], STEER_TURN["reply"])
        put_script(sd, "steer-words", STEER_TEXT, [("edit", {"file_path": "panels.md", "old_string": "# p99 latency · eu-west (last 24 h, by host)\n",
                                                             "new_string": "# p99 latency · eu-west (last 24 h, by host), with p95\n"})],
                   STEER_REPLY)
        c.wait_idle("dashboards", timeout=timeout)
        c.say(STEER_TURN["text"], focus="dashboards")
        log = hub["telemetry"]["fake_log"]
        c.wait(lambda: os.path.exists(log) and "sleep 6 && echo rebuilt" in open(log, errors="replace").read(), timeout,
               "dashboards' slow command started")
        c.say(STEER_TEXT, focus="dashboards")       # no "queued": a steer, as the window's send while it works
        c.wait_line("dashboards", STEER_REPLY.split(",")[0], timeout)
        out_["steered"] = "telemetry/dashboards: %s" % STEER_TEXT
        # QUOTED: his message to telemetry's main quoting the first line of an earlier long answer
        put_script(sd, "quoted", QUOTE_WORDS, (), QUOTE_REPLY)
        c.wait_idle("main", timeout=timeout)
        c.say(quoted_message())
        c.wait_line("main", QUOTE_REPLY[:40], timeout)
        out_["quoted"] = "telemetry/main: %s" % QUOTE_WORDS
        # QUEUED: behind ingest's 2-hour turn ('working'): it waits for the turn's end, i.e. until world down
        c.wait_status("ingest", ["working", "thinking"], timeout)
        c.send({"op": "input", "focus": "ingest", "text": QUEUED_TEXT, "queued": True})
        c.wait(lambda: (c.agent("ingest") or {}).get("queued", 0) >= 1, timeout, "his message queued on ingest")
        out_["queued"] = "telemetry/ingest: %s" % QUEUED_TEXT
        return out_

    def scheduled():
        bash("telemetry", "check the p99 panel every 30 minutes, and make me the morning page every day at 9",
             "sb every 30m 'check the p99 panel and tell me if it moved' --to dashboards\n"
             "sb every day 09:00 'make the morning page'\nsb every",
             "Two timers are set:\n\n- every 30 min, **dashboards** checks the p99 panel and tells you if it moved\n"
             "- every day at 09:00, the morning page")
        return "2 timers on telemetry"

    def more_agents():
        have = len([a for a in plan(3, True)[0]["agents"]])
        fill = crowd(agents, have) if agents else []
        if fill:
            for a in fill:
                what = a["name"].replace("-", " ")
                put_script(sd, "crowd-%s" % a["name"], a["objective"], (),
                           "Looked into %s.\n\n- nothing urgent: it's within its usual range this week\n"
                           "- one thing to watch: it moved with the tuesday batch change, like the p99\n\n"
                           "I'll keep an eye on it and tell you if that changes." % what)
            bash("telemetry", "split the open telemetry questions between new agents, one each",
                 "\n".join("sb spawn %s --objective %s" % (a["name"], shlex.quote(a["objective"])) for a in fill),
                 "Started %d agents, one per open question. Each one reports here when it has something." % len(fill))
            by["telemetry"].wait(lambda: len((by["telemetry"].state or {}).get("agents", [])) >= agents, timeout,
                                 "%d agents in telemetry" % agents)
        return len(fill)

    def pages():
        made = []
        for project, ex, pid, title in (("bise", "inbox-review", "inbox-review", "inbox review"),
                                        ("bise", "weekly-update", "weekly-update", "weekly update"),
                                        ("shop", "diff-review", "checkout-review", "checkout review")):
            src = os.path.join(qa.KIT_EXAMPLES, ex + ".html")
            if not os.path.exists(src):
                raise RuntimeError("no kit example %s" % src)
            bash(project, "make me a page for the %s" % title,
                 "sb page publish %s --id %s --title %s" % (shlex.quote(src), pid, shlex.quote(title)),
                 "The %s is on its page. Leave notes on it and I'll pick them up." % title)
            made.append("%s:%s" % (project, pid))
        return made

    def screen():
        # as the app sends it: his words, and his fn context as the input op's `context`; the hub
        # renders the screen_context block (fn_context.rs), never his message
        c = by["bise"]
        put_script(sd, "screen", SCREEN_TEXT, (), SCREEN_REPLY)
        c.wait_idle("main", timeout=timeout)
        c.send(screen_input())
        c.wait_line("main", SCREEN_REPLY.split("\n")[0][:50], timeout)
        return "bise main"

    def approval():
        h = hub["docs"]
        path = os.path.join(world, "seed", "docs", "feature-dark-mode.sh")
        with open(path, "w") as f:
            f.write(feature_script(world, h["ws"], "dark-mode"))
        words = "the dark mode is ready: open it for review"
        put_script(sd, "feature-dark-mode", words, [("bash", "bash %s" % path)],
                   "The dark mode is ready for you: try it, then merge it or ask for changes.")
        by["docs"].wait_idle("main", timeout=timeout)
        by["docs"].say(words)
        by["docs"].wait(lambda: any(cd.get("kind") == "feature_try" for cd in by["docs"].cards()), timeout, "docs' feature_try card")
        return "docs feature_try (dark-mode)"

    def archived():
        project, name = RICH_DROPPED
        by[project].wait_idle(name, timeout=timeout)
        bash(project, "%s is done, drop it" % name, "sb drop %s" % name,
             "I asked to drop %s: its work is on its branch, nothing is lost." % name)
        # main's drop is a suggestion to him (a 'drop' card): his yes archives the agent
        c = by[project]
        card = c.wait(lambda: next((cd for cd in c.cards() if cd.get("kind") == "drop"), None), timeout, "the drop card")
        c.say("/answer %d yes" % card["id"])
        c.wait(lambda: all(a.get("status") == "archived" for a in (c.state or {}).get("agents", []) if a.get("name") == name),
               timeout, "%s archived" % name)
        return "%s/%s archived" % (project, name)

    def working():
        # an agent in a long turn (the fake provider holds every request of that message for 2 h):
        # 'working' for the whole try gate, until world down
        c = by["telemetry"]
        words = "keep watching the ingest lag and tell me when it drops"
        put_script(sd, "ingest-watch", words, (), "The ingest lag is back under a second.", slow=7200)
        c.wait_idle("ingest", timeout=timeout)
        c.say(words, focus="ingest")
        c.wait_status("ingest", ["working", "thinking"], timeout)
        return "telemetry/ingest"

    for name, fn in (("main_thread", long_main), ("tool_thread", dash), ("bar", bar), ("scheduled", scheduled), ("crowd", more_agents),
                     ("pages", pages), ("screen_context", screen), ("feature_approval", approval), ("archived", archived),
                     ("answered", answered), ("working", working), ("messages", messages)):
        part(name, fn)
    return out


def marker(world, project, agent):
    return os.path.join(world, "seeded", "%s.%s" % (project, agent))


def ask_file(world, project, agent):
    return os.path.join(world, "asks", "%s.%s" % (project, agent))


def agent_script(world, project, agent):
    """The bash an agent runs in its own folder (worktree or the shared one): its steps, then the
    seeded marker (before a long `work`, so an agent at work counts as seeded)."""
    out = ["set -u", "cd \"$PWD\""]
    done = "mkdir -p %s && touch %s" % (shlex.quote(os.path.join(world, "seeded")), shlex.quote(marker(world, project, agent["name"])))
    marked = False
    for s in agent["steps"]:
        if "write" in s:
            d = os.path.dirname(s["write"])
            if d:
                out.append("mkdir -p %s" % shlex.quote(d))
            out.append("printf %%s %s > %s" % (shlex.quote(s["text"]), shlex.quote(s["write"])))
        elif "commit" in s:
            out.append("git add -A && git -c commit.gpgsign=false commit -q --no-verify -m %s" % shlex.quote(s["commit"]))
        elif "report" in s:
            out.append("sb report %s %s%s" % (s["report"], shlex.quote(s["text"]),
                                              " --step %s" % shlex.quote(s["step"]) if s.get("step") else ""))
        elif "land" in s:
            out.append("sb land %s" % shlex.quote(s["land"]))
        elif "ask" in s:
            # its question to main; main's script waits for the message id and escalates it
            f = ask_file(world, project, agent["name"])
            out.append("mkdir -p %s" % shlex.quote(os.path.dirname(f)))
            out.append("sb send main --expect-reply %s | sed -n 's/^sent \\(m_[0-9]*\\).*/\\1/p' > %s.tmp && mv %s.tmp %s"
                       % (shlex.quote(s["ask"]), shlex.quote(f), shlex.quote(f), shlex.quote(f)))
        elif "send" in s:
            out.append("sb send %s %s" % (shlex.quote(s["send"]), shlex.quote(s["text"])))
        elif "artifact" in s:
            out.append("sb artifact add %s --title %s" % (shlex.quote(s["artifact"]), shlex.quote(s["title"])))
        elif "work" in s:
            out.append(done)
            marked = True
            out.append("sleep %d" % int(s["work"]))
        else:
            raise ValueError("unknown step %r" % (s,))
    if not marked:
        out.append(done)
    out.append("echo seeded %s" % agent["name"])
    return "\n".join(out) + "\n"


def main_script(world, project, rich=False):
    """The bash the project's fake main runs: its agents (each with its script as the brief's
    {{bash:}}; rich: the objective alone, its script in $FAKE_SCRIPTS), then its cards."""
    out = ["set -u"]
    if project.get("feature"):
        out.append("sb feature new %s" % shlex.quote(project["feature"]))
    for a in project["agents"]:
        script = os.path.join(world, "seed", project["name"], a["name"] + ".sh")
        brief = a["objective"] if rich else "%s {{bash: bash %s}}" % (a["objective"], script)
        where = " --feature %s" % shlex.quote(a["feature"]) if a.get("feature") else (" --place %s" % a["place"] if a.get("place") else "")
        out.append("sb spawn %s%s --objective %s" % (a["name"], where, shlex.quote(brief)))
    for c in project["cards"]:
        out.append("sb card %s" % shlex.quote(c))
    # an agent's question: wait (up to 300 s) for its message to main, then the card for it, or
    # main's own answer with its why (main_answers: the hub's 'answered' line)
    for a in project["agents"]:
        for st in a["steps"]:
            if "ask" in st:
                f = shlex.quote(ask_file(world, project["name"], a["name"]))
                out.append("for i in $(seq 600); do [ -s %s ] && break; sleep 0.5; done" % f)
                if st.get("main_answers"):
                    ans = st["main_answers"]
                    out.append("[ -s %s ] && sb send %s --reply-to \"$(cat %s)\" --why %s %s"
                               % (f, shlex.quote(a["name"]), f, shlex.quote(ans["why"]), shlex.quote(ans["text"])))
                else:
                    out.append("[ -s %s ] && sb card --for \"$(cat %s)\" %s" % (f, f, shlex.quote(st["ask"])))
    out.append("echo seeded main")
    return "\n".join(out) + "\n"


FEATURE_FILE = ("FEATURE.md", "# %s\n\nwhat this feature adds, for the review.\n")


def feature_script(world, ws, name):
    """The bash a project's fake main runs for `world feature`: the real dev-flow feature
    (sb feature new), one commit on its branch made in a throwaway worktree of the project's own
    checkout (removed after), then `sb feature ready`, which opens the user's feature_try card
    (an approval kind: Card.approval). Answering it 1 (try it) opens feature_merge, the second."""
    tmp = os.path.join(world, "feature", "%s-%s" % (os.path.basename(ws), name))
    rel, text = FEATURE_FILE
    q = shlex.quote
    return "\n".join([
        "set -eu",
        "sb feature new %s" % q(name),
        "rm -rf %s" % q(tmp),
        "git -C %s worktree add -q %s %s" % (q(ws), q(tmp), q(name)),
        "printf %%s %s > %s" % (q(text % name), q(os.path.join(tmp, rel))),
        "git -C %s add -A" % q(tmp),
        "git -C %s -c commit.gpgsign=false commit -q --no-verify -m %s" % (q(tmp), q("%s: what it adds" % name)),
        "git -C %s worktree remove --force %s" % (q(ws), q(tmp)),
        "sb feature ready %s" % q(name),
        "echo seeded feature %s" % q(name),
    ]) + "\n"


def checker_off(home):
    """The world's bise home has the approvals checker off ([roles] classify = "off"): a gated call
    in auto mode is a card, never a model call (the hubs run yolo anyway, but for approval_seed)."""
    cfg = os.path.join(home, ".bise", "config.toml")
    text = open(cfg).read() if os.path.exists(cfg) else ""
    if "classify" not in text:
        with open(cfg, "a") as f:
            f.write(("\n" if text and not text.endswith("\n") else "") + "[roles]\nclassify = \"off\"\n")


FAKE_ACCOUNT = ('[providers.fake]\nname = "fake"\napi = "openai-chat"\nbase_url = "%s"\nkey_env = "BISE_TRY_FAKE_KEY"\n'
                'key_command = "echo fake-key"\nsmall_model = "mistral-small-latest"\n')


def home_account(home, url):
    """The world's own bise home gets the same signed-in fake account as try-real (qa-native m_12883:
    the gate's window runs on h/.bise, and setup's model step waits for a signed_in account). Only
    the provider: no role points at it, so the world's hubs keep their own fake provider."""
    cfg = os.path.join(home, ".bise", "config.toml")
    text = open(cfg).read() if os.path.exists(cfg) else ""
    if "[providers.fake]" not in text:
        with open(cfg, "a") as f:
            f.write(("\n" if text and not text.endswith("\n") else "") + "\n" + FAKE_ACCOUNT % url.split("/chat/completions")[0])


def approval_command(home, spec):
    """The seeded agent's call the gate asks about: a forced push (tier 0, a card in auto whatever
    the sandbox; a write outside the workspace was let through to the sandbox, no card), to a
    remote that is a missing path in the world's home: it could never reach the network. Pure."""
    return "git push --force %s HEAD:main" % shlex.quote(os.path.join(home, spec["remote"]))


def approval_seed(c, home, spec, timeout, scripts=None):
    """qa-flows m_11510 (a): his answer to a tool approval with a note, in auto mode. The hub goes
    auto for this session (BISE_APPROVALS is set, so config.toml keeps yolo), an agent's call that
    writes outside its workspace raises the gate's card, the world answers '/answer N no: <note>' as
    him (the hold client is the hub's starter), the call never runs, the hub goes back to yolo."""
    def mode():
        evs = [e for e in list(c.events) if e.get("ev") == "approvals"]
        return evs[-1].get("mode") if evs else None
    c.send({"op": "approvals", "mode": "auto"})
    c.wait(lambda: mode() == "auto", timeout, "the hub in auto")
    try:
        if scripts:
            # rich: his /new is plain words, the call comes from the fake provider's script for the brief
            put_script(scripts, "approval-%s" % spec["agent"], spec["objective"], [("bash", approval_command(home, spec))],
                       "Not pushed: you said no. I'll put it on a branch instead.")
            c.say("/new %s: %s" % (spec["agent"], spec["objective"]))
        else:
            c.say("/new %s: %s {{bash: %s}}" % (spec["agent"], spec["objective"], approval_command(home, spec)))
        card = c.wait(lambda: next((cd for cd in c.cards() if cd.get("kind") == "confirm" and cd.get("agent") == spec["agent"]), None),
                      timeout, "the approval card for %s" % spec["agent"])
        c.say("/answer %d no: %s" % (card["id"], spec["note"]))
        c.wait(lambda: not any(cd.get("id") == card["id"] for cd in c.cards()), timeout, "the approval card closed")
        c.wait_line("main", "sb approval : no : %s" % spec["agent"], timeout)
    finally:
        c.send({"op": "approvals", "mode": "yolo"})
        c.wait(lambda: mode() == "yolo", timeout, "the hub back in yolo")


def seed_words(project, rich):
    """What main is told to seed `project`: plain words (rich: run by $FAKE_SCRIPTS), else the marker. Pure."""
    if rich:
        return SEED_WORDS[project["name"]]
    return "[[bash: bash %s]]" % project["_main"]


def write_seeds(world, projects, rich=False):
    """The scripts on disk (rich: and the fake providers' scripts for the seed words and each brief);
    returns the markers to wait for."""
    want = []
    for p in projects:
        d = os.path.join(world, "seed", p["name"])
        os.makedirs(d, exist_ok=True)
        p["_main"] = os.path.join(d, "main.sh")
        with open(p["_main"], "w") as f:
            f.write(main_script(world, p, rich))
        if rich:
            put_script(scripts_dir(world), "seed-%s" % p["name"], SEED_WORDS[p["name"]], [("bash", "bash %s" % p["_main"])],
                       "The %s team is started: %s. I'll tell you when one of them needs you."
                       % (p["name"], ", ".join(a["name"] for a in p["agents"])))
        for a in p["agents"]:
            path = os.path.join(d, a["name"] + ".sh")
            with open(path, "w") as f:
                f.write(agent_script(world, p["name"], a))
            if rich:
                put_script(scripts_dir(world), "brief-%s-%s" % (p["name"], a["name"]), a["objective"],
                           [("bash", "bash %s" % path)], agent_reply(a))
            want.append(marker(world, p["name"], a["name"]))
    return want


def make_repo(ws, files, origin=None):
    """A project's git repo on main, its files committed; `origin` its remote (never fetched or pushed:
    only the world's fake gh reads it)."""
    os.makedirs(ws, exist_ok=True)
    for rel, text in files.items():
        p = os.path.join(ws, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w") as f:
            f.write(text)
    env = dict(os.environ, GIT_AUTHOR_NAME="qa", GIT_AUTHOR_EMAIL="qa@world.test", GIT_COMMITTER_NAME="qa", GIT_COMMITTER_EMAIL="qa@world.test")
    for cmd in (["git", "init", "-q", "-b", "main"], ["git", "config", "user.email", "qa@world.test"], ["git", "config", "user.name", "qa"],
                ["git", "config", "commit.gpgsign", "false"], ["git", "add", "-A"], ["git", "commit", "-q", "--no-verify", "-m", "init"]):
        r = subprocess.run(cmd, cwd=ws, capture_output=True, text=True, env=env)
        if r.returncode != 0:
            raise RuntimeError("make_repo %s: %s: %s" % (ws, " ".join(cmd), (r.stderr or r.stdout).strip()))
    if origin:
        subprocess.run(["git", "remote", "add", "origin", origin], cwd=ws, check=True, capture_output=True)
        subprocess.run(["git", "config", "remote.origin.pushurl", "DISABLED-in-world"], cwd=ws, check=True, capture_output=True)


def fake_gh(world, projects):
    """<world>/bin/gh: the world's gh (fake_gh.py) over the PRs of every project with an origin, put
    first on the world hubs' PATH. Returns the bin folder."""
    bindir = os.path.join(world, "bin")
    os.makedirs(bindir, exist_ok=True)
    for p in projects:
        if p.get("origin"):
            ref = p["origin"].rstrip("/").removesuffix(".git").split("/")
            with open(os.path.join(world, "prs-%s.json" % p["name"]), "w") as f:
                json.dump({"owner": ref[-2], "name": ref[-1], "prs": p.get("prs", [])}, f, indent=1)
    gh = os.path.join(bindir, "gh")
    with open(gh, "w") as f:
        # one gh for every hub: the PR data of the repo the hub asks about (its owner/name in the query)
        f.write("#!/bin/sh\n# the world's fake gh (plugins/ambient-qa/fake_gh.py): never his gh, his login or the network\n"
                "exec %s %s %s \"$@\"\n" % (shlex.quote(sys.executable), shlex.quote(os.path.join(HERE, "fake_gh.py")),
                                              shlex.quote(world)))
    os.chmod(gh, 0o755)
    return bindir


# ---------------------------------------------------------------- where

def world_dir():
    import qa
    return os.environ.get("AMBIENT_WORLD_DIR") or os.path.join(GATE, "w-" + qa._short_agent())


def _paths(world):
    return {"home": os.path.join(world, "h"), "json": os.path.join(world, "world.json"), "log": os.path.join(world, "world.log")}


def guard(world, values=()):
    """Refuse a world outside ~/.bise/gate, or any value that reaches his own state."""
    import qa
    gate = os.path.realpath(GATE) + "/"
    if not os.path.realpath(world).startswith(gate):
        raise qa.QAError("refused: the world %s is not under ~/.bise/gate" % world)
    if isinstance(values, dict):
        for k, v in values.items():
            try:
                qa.refuse_his_state([v])
            except qa.QAError as e:
                raise qa.QAError("%s (env %s)" % (e, k))
        return
    qa.refuse_his_state(values)


def _read(path):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def _alive(pid):
    try:
        os.kill(int(pid), 0)
        return True
    except (OSError, TypeError, ValueError):
        return False


# ---------------------------------------------------------------- the daemon

def daemon(bise, root, n, rich=False, agents=0):
    """Detached (`qa.py _world`): the hubs, seeded, held until SIGTERM, then stopped."""
    import qa
    world = world_dir()
    P = _paths(world)
    sys.path.insert(0, os.path.join(qa.REPO, "tests"))
    tmp = os.path.join(world, "t")
    os.makedirs(tmp, exist_ok=True)
    tempfile.tempdir = tmp
    os.environ["BISE_APP_ROOT"] = root    # e2e.Env passes it on: the hubs' repl-live
    import e2e  # noqa: E402
    e2e.EXE = bise
    try:
        from wait import load_factor
    except ImportError:
        load_factor = getattr(e2e, "load_factor", lambda: 1.0)
    home = P["home"]
    qa._prepare_home(home)
    checker_off(home)
    home_ws = os.path.join(home, HOME_NAME)
    os.makedirs(home_ws, exist_ok=True)
    projects = plan(n, rich)
    stop = {"now": False}
    signal.signal(signal.SIGTERM, lambda *_: stop.update(now=True))
    signal.signal(signal.SIGINT, lambda *_: stop.update(now=True))
    hubs, envs, holds = [], [], []
    t_up = time.time()     # each step's time goes to world.log (ambient-lead m_15705)
    bindir = fake_gh(world, projects)
    try:
        for name, files in [(HOME_NAME, None)] + [(p["name"], p["files"]) for p in projects]:
            ws = home_ws if files is None else os.path.join(home, "code", name)
            if files is not None:
                make_repo(ws, files, next((p.get("origin") for p in projects if p["name"] == name), None))
            E = e2e.Env()
            E.env = world_env(E.env)      # never his keys (main m_10585)
            if rich:
                # D5: scripted calls and answers for his plain words, no echo (fake_provider.py)
                os.makedirs(scripts_dir(world), exist_ok=True)
                E.env.update(FAKE_SCRIPTS=scripts_dir(world), FAKE_PLAIN="1")
            fresh_fake(E)
            E.env["PATH"] = bindir + os.pathsep + E.env.get("PATH", "/usr/bin:/bin")
            envs.append(E)
            E.ws = ws
            sb_core = os.path.join(root, "sb-core")
            if os.path.exists(sb_core):
                E.env["SB_CORE_BIN"] = sb_core
            E.env["BISE_HOME_WORKSPACE"] = home_ws
            qa.real_home_env(E.env, home)
            # the caller's shell folders are stale here (the hub runs in e2e.ROOT) and may be an
            # agent's tmp under his ~/.bise/hubs: never handed on
            for k in ("PWD", "OLDPWD"):
                E.env.pop(k, None)
            guard(world, dict(E.env, _ws=ws, _home_ws=home_ws))
            before = set(glob.glob(os.path.join(home, ".bise", "hubs", "*", "hub.sock")))
            err = open(os.path.join(E.tmp, "hub.stderr"), "a")
            E.hub = subprocess.Popen([bise, "sbd", "--workspace", ws], cwd=e2e.ROOT, env=E.env,
                                     stdin=subprocess.DEVNULL, stdout=err, stderr=err)
            t0, limit, sock = time.time(), 60 * load_factor(), None
            while not sock:
                new = set(glob.glob(os.path.join(home, ".bise", "hubs", "*", "hub.sock"))) - before
                sock = sorted(new)[0] if new else None
                if not sock and (E.hub.poll() is not None or time.time() - t0 > limit):
                    raise RuntimeError("the %s hub did not start in %.0f s (exit %s): %s" % (
                        name, limit, E.hub.poll(), open(os.path.join(E.tmp, "hub.stderr"), errors="replace").read()[-2000:]))
                time.sleep(0.1)
            refuse_leak("the %s hub" % name, E.hub.pid)
            refuse_leak("the %s fake provider" % name, E.fake.pid)
            E.state = os.path.dirname(sock)
            c = e2e.Client(sock)     # the world's hold: its hello keeps idle-exit away
            holds.append(c)
            hubs.append({"project": name, "ws": ws, "sock": sock, "state": E.state, "hub_pid": E.hub.pid,
                         "fake_pid": E.fake.pid, "fake_log": E.fake_log, "home": files is None})
        for h, c in zip(hubs, holds):
            c.wait_status("main", "idle", 120 * load_factor())
        print("world: step hubs (%d up, mains idle) in %.0f s" % (len(hubs), time.time() - t_up), flush=True)
        t_step = time.time()
        want = write_seeds(world, projects, rich)
        for p in projects:
            c = holds[[h["project"] for h in hubs].index(p["name"])]
            c.say(seed_words(p, rich))
        for p in projects:
            # a message to main can be lost while it is busy (seen in the rich world's runs; likely
            # qa-flows' one 'not seeded in time' world, ambient-lead m_12599): when none of the
            # project's agents exists 90 s after the seed was said, main gets it again, once
            c = holds[[h["project"] for h in hubs].index(p["name"])]
            names = {a["name"] for a in p["agents"]}
            spawned = lambda: names & {a.get("name") for a in (c.state or {}).get("agents", [])}  # noqa: E731
            try:
                c.wait(spawned, 90 * load_factor(), "%s's first agent" % p["name"])
            except Exception:  # noqa: BLE001 - wait.until's timeout
                print("world: %s's seed never started: said again" % p["name"], flush=True)
                c.wait_status("main", "idle", 120 * load_factor())
                c.say(seed_words(p, rich))
        t0 = time.time()
        while [m for m in want if not os.path.exists(m)]:
            if stop["now"] or time.time() - t0 > 300 * load_factor():
                raise RuntimeError("not seeded in time: %s" % [os.path.basename(m) for m in want if not os.path.exists(m)])
            time.sleep(0.3)
        print("world: step seed (%d agents) in %.0f s" % (len(want), time.time() - t_step), flush=True)
        t_step = time.time()
        for p in projects:
            if p.get("approval"):
                c = holds[[h["project"] for h in hubs].index(p["name"])]
                approval_seed(c, home, p["approval"], 120 * load_factor(), scripts_dir(world) if rich else None)
        print("world: step approval in %.0f s" % (time.time() - t_step), flush=True)
        t_step = time.time()
        rich_out = rich_seed(world, hubs, holds, agents, 300 * load_factor()) if rich else None
        if rich:
            print("world: step rich in %.0f s" % (time.time() - t_step), flush=True)
        home_env = envs[[h["home"] for h in hubs].index(True)].env
        real = try_real(os.path.join(world, "try-real"), [h for h in hubs if not h["home"]], home_env["BEND_PROVIDER_URL"])
        home_account(home, home_env["BEND_PROVIDER_URL"])
        print("world: up in %.0f s (load factor %.1f)" % (time.time() - t_up, load_factor()), flush=True)
        info = {"pid": os.getpid(), "world": world, "home": home, "bise": bise, "root": root, "projects": n,
                "hubs": hubs, "registry": register(bise, home, [h["ws"] for h in hubs if not h["home"]]),
                "rich": rich_out, "try_real": real, "up_ms": int(time.time() * 1000)}
        with open(P["json"] + ".tmp", "w") as f:
            json.dump(info, f, indent=1)
        os.replace(P["json"] + ".tmp", P["json"])
        while not stop["now"]:
            for h, E in zip(hubs, envs):
                if E.fake.poll() is not None:
                    h["fake_pid"] = revive_fake(E, h["project"])     # same port: try-real's config stays right
                    with open(P["json"] + ".tmp", "w") as f:
                        json.dump(info, f, indent=1)
                    os.replace(P["json"] + ".tmp", P["json"])
            time.sleep(0.3)
    finally:
        for E in envs:
            E.keep = True        # the world's files stay for reading; `up` clears them
            os.environ["SB_KEEP"] = "1"
            try:
                E.close()
            except Exception:  # noqa: BLE001
                pass
        try:
            os.unlink(P["json"])
        except OSError:
            pass


# ---------------------------------------------------------------- his keys, never

# main m_10585 / lead m_10587: world.py passed os.environ (through e2e.Env's clean_env) to the
# world's hubs, so his real provider keys reached throwaway hubs. Now every process the world starts
# (hubs, fake providers, and what they start) gets an env built from this ALLOWLIST: the system's
# few, the world's own paths and the fake provider; never a *KEY*/*TOKEN*/*SECRET*/*PASSWORD* name,
# except the fake key e2e's model needs.
ENV_KEEP = {"PATH", "LANG", "LC_ALL", "LC_CTYPE", "USER", "LOGNAME", "SHELL", "TERM", "__CF_USER_TEXT_ENCODING",
            "HOME", "TMPDIR", "TMP", "TEMP", "TMUX_TMPDIR", "CARGO_HOME", "RUSTUP_HOME", "BISE_APP_ROOT", "SB_CORE_BIN",
            "BISE_HOME_WORKSPACE", "SB_ONBOARDING", "BISE_APPROVALS", "SB_STATE_DIR", "FAKE_LOG", "FAKE_SCRIPTS", "FAKE_PLAIN", "FAKE_BODIES", "PYTHONUNBUFFERED"}
SECRET = re.compile(r"KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|COOKIE|SESSION_ID", re.I)
FAKE_KEYS = {"MISTRAL_API_KEY": "fake-key"}


def world_env(env):
    """`env` cut to the allowlist (ENV_KEEP and the world's own BEND_* paths and URLs), no secret-named
    variable, plus the fake key. Pure."""
    out = {k: v for k, v in env.items() if (k in ENV_KEEP or k.startswith("BEND_")) and not SECRET.search(k)}
    out.update(FAKE_KEYS)
    return out


def leaked(env):
    """The secret-named variables of `env` that aren't the world's fake ones (names only). Pure."""
    return sorted(k for k, v in env.items() if SECRET.search(k) and FAKE_KEYS.get(k) != v)


def proc_env(pid):
    """A running process's environment (ps -E), for the law below; never printed."""
    r = subprocess.run(["/bin/ps", "-wwE", "-o", "command=", "-p", str(pid)], capture_output=True, text=True)
    return dict(re.findall(r" ([A-Za-z_][A-Za-z0-9_]*)=(\S*)", r.stdout))


def refuse_leak(what, pid):
    """The law (main m_10585): a world process holding any real key stops the world, naming the
    variables only."""
    names = leaked(proc_env(pid))
    if names:
        raise RuntimeError("%s (pid %s) holds secret-named variables: %s (values never shown): the world refuses to run"
                           % (what, pid, ", ".join(names)))


def fresh_fake(E):
    """e2e.Env starts its fake provider with clean_env (his whole env): replaced at once by one with
    the world's env, on the same port."""
    import e2e
    port = E.env["BEND_PROVIDER_URL"].split("127.0.0.1:")[1].split("/")[0]
    try:
        E.fake.kill()
        E.fake.wait(5)
    except Exception:  # noqa: BLE001
        pass
    E.fake = subprocess.Popen([sys.executable, "-u", os.path.join(e2e.HERE, "fake_provider.py"), port],
                              stdout=subprocess.PIPE, text=True, env=world_env(dict(E.env, FAKE_LOG=E.fake_log)))
    line = E.fake.stdout.readline()
    if not line.startswith("PORT"):
        raise RuntimeError("the world's fake provider didn't start on port %s: %r" % (port, line))


def revive_fake(E, project):
    """A world lives for hours and its fake providers died under one (exit seen by the daemon, no
    traceback; amb-tools' wwin3 run): a dead one is reaped, its exit logged, and a new one started on
    the same port, so the hub's BEND_PROVIDER_URL stays right. Returns the new pid."""
    import e2e
    port = E.env["BEND_PROVIDER_URL"].split("127.0.0.1:")[1].split("/")[0]
    print("world: %s's fake provider exited (%s): restarted on port %s" % (project, E.fake.returncode, port), flush=True)
    E.fake = subprocess.Popen([sys.executable, "-u", os.path.join(e2e.HERE, "fake_provider.py"), port],
                              stdout=subprocess.PIPE, text=True, env=world_env(dict(E.env, FAKE_LOG=E.fake_log)))
    line = E.fake.stdout.readline()
    if not line.startswith("PORT"):
        print("world: %s's fake provider didn't come back: %r" % (project, line), flush=True)
    return E.fake.pid


def register(bise, home, workspaces):
    """`bise project add` for each project once S1 has it (amb-hub); until then the hubs are
    independent and this says so."""
    import qa
    env = {"HOME": home, "BISE_HOME_WORKSPACE": os.path.join(home, HOME_NAME), "PATH": qa.own_path(os.environ.get("PATH", "/usr/bin:/bin"))}
    h = subprocess.run([bise, "project", "--help"], capture_output=True, text=True, env=env, timeout=20)
    if h.returncode != 0 or "add" not in (h.stdout + h.stderr):
        return "no `bise project` in this bise yet (S1, f1e91b82): the hubs are independent"
    out = []
    for ws in workspaces:
        r = subprocess.run([bise, "project", "add", ws], capture_output=True, text=True, env=env, timeout=30)
        out.append({"ws": ws, "rc": r.returncode, "out": (r.stdout + r.stderr).strip()[-300:]})
    r = subprocess.run([bise, "project", "list", "--json"], capture_output=True, text=True, env=env, timeout=30)
    try:
        listed = json.loads(r.stdout)
    except ValueError:
        listed = (r.stdout + r.stderr).strip()[-300:]
    return {"added": out, "list": listed}


# ---------------------------------------------------------------- the commands

SLOTS = (LOCK, os.path.join(os.path.dirname(LOCK), "heavy2.lock"))


def holds_a_slot(cmd):
    """True when this command line holds one of the heavy slots: a `lockf ... heavy.lock` or
    `lockf ... heavy2.lock` (~/.bise/run/heavy-run takes either, slot 2 when slot 1 is busy), or the
    heavy-run script itself (`/bin/bash .../heavy-run ...`), which holds a slot for all it runs.
    Pure."""
    argv = cmd.split()
    if not argv:
        return False
    if os.path.basename(argv[0]) == "lockf" and any(s in argv for s in SLOTS):
        return True
    return any(os.path.basename(a) == "heavy-run" for a in argv[:2])


def _ps(pid):
    r = subprocess.run(["ps", "-ww", "-o", "ppid=,command=", "-p", str(pid)], capture_output=True, text=True)
    ppid, _, cmd = r.stdout.strip().partition(" ")
    return (int(ppid.strip() or 0), cmd.strip()) if r.stdout.strip() else None


def under_heavy_lock(pid=None, ps=_ps):
    """True when this process (or the given one) runs under a heavy slot of its own ancestry (either
    slot, or heavy-run around it): taking the lock again would wait on itself, or on the other slot's
    job while this one already holds a slot (qa-flows 82b584d6: a world up under heavy-run around
    real.sh, 'not seeded in time: shop.gift-ui'). ps(pid) -> (ppid, command) or None."""
    pid = pid or os.getpid()
    for _ in range(64):
        got = ps(pid)
        if not got:
            return False
        ppid, cmd = got
        if holds_a_slot(cmd):
            return True
        if ppid <= 1 or ppid == pid:
            return False
        pid = ppid
    return False


def helpers_fresh(root):
    """True when the tree's helpers are the build of its sources now: each <root>/<helper> is there
    with a <helper>.key (written by bins.sh) equal to `bins.sh key` of the sources. Then nothing
    compiles, and bins.sh isn't called at all (its cache may have been pruned: a call would compile)."""
    import qa
    bins = os.path.join(root, "scripts", "bins.sh")
    for h in qa.HELPERS:
        exe = os.path.join(root, h)
        try:
            have = open(exe + ".key").read().strip()
        except OSError:
            return False
        if not have or not os.access(exe, os.X_OK):
            return False
        k = subprocess.run([bins, "key", "--src", root, h], capture_output=True, text=True, cwd=root, timeout=120)
        if k.returncode != 0 or k.stdout.strip() != have:
            return False
    return True


def ensure_helpers_locked(root):
    """The tree's helpers current, taking the heavy lock only around a compile that will run (main
    m_10008: the lock is for builds and gates only): fresh helpers take no lock; stale ones are
    rebuilt by scripts/bins.sh under `lockf -k heavy.lock nice -n 10`, or directly when this
    process already runs under the lock (one take, never two: main m_9310)."""
    import qa
    if helpers_fresh(root):
        return
    if os.environ.get("AMBIENT_WORLD_LOCKED") == "1" or under_heavy_lock():
        qa.ensure_helpers(root)
        return
    os.makedirs(os.path.dirname(LOCK), exist_ok=True)
    bins = os.path.join(root, "scripts", "bins.sh")
    p = subprocess.run(["/usr/bin/lockf", "-k", LOCK, "nice", "-n", "10", bins, "--src", root] + list(qa.HELPERS),
                       capture_output=True, text=True, cwd=root, timeout=1800)
    if p.returncode != 0:
        raise qa.QAError("scripts/bins.sh %s failed in %s: %s" % (" ".join(qa.HELPERS), root, (p.stderr or p.stdout)[-1200:]))


def up(n=3, bise=None, root=None, rich=False, agents=0):
    """Clear the old world, start the daemon, wait until seeded. The heavy lock only around a
    helpers compile that runs (ensure_helpers_locked); an up with built helpers never waits on it.
    rich: the try gate's world (always 3 projects); agents: telemetry's agent count with rich."""
    import qa
    world = world_dir()
    P = _paths(world)
    guard(world)
    old = _read(P["json"])
    if old and _alive(old.get("pid")):
        raise qa.QAError("a world is up (pid %s): `qa.py world down` first" % old["pid"])
    if agents and not rich:
        raise qa.QAError("--agents goes with --rich")
    if rich:
        n = 3
        crowd(agents, len(plan(3, True)[0]["agents"]))     # refuses a count above the names it has
    plan(n)
    if bise:
        bise, root = os.path.abspath(bise), root or qa.app_root_of(bise)
    else:
        bise, root2 = qa.find_bise()
        root = root or root2
    if not root:
        raise qa.QAError("%s has no app root with a built repl-live (--root)" % bise)
    ensure_helpers_locked(root)
    if os.path.exists(world):
        shutil.rmtree(world)
    os.makedirs(world)
    log = open(P["log"], "a")
    env = {k: v for k, v in os.environ.items() if not k.startswith("SB_") and k not in ("BISE_ROLE", "BISE_EXPORTS_FOR", "AMBIENT_WORLD_LOCKED")}
    env["AMBIENT_WORLD_DIR"] = world     # the daemon has no SB_AGENT: same folder as this caller's
    p = subprocess.Popen([sys.executable, "-u", "-B", os.path.join(HERE, "qa.py"), "_world", "--bise", bise, "--root", root, "--projects", str(n)]
                         + (["--rich", "--agents", str(agents)] if rich else []),
                         stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True, cwd=qa.REPO, env=env)
    t0, limit = time.time(), world_timeout()
    print("world: up within %.0f s at most (load factor %.1f%s)" % (limit, _load_factor(),
          ", AMBIENT_QA_WORLD_TIMEOUT" if os.environ.get("AMBIENT_QA_WORLD_TIMEOUT") else ""), file=log, flush=True)
    while time.time() - t0 < limit:
        info = _read(P["json"])
        if info and info.get("pid") == p.pid:
            return dict(state(), log=P["log"])
        if p.poll() is not None:
            raise qa.QAError("the world's daemon exited (%s): %s" % (p.returncode, open(P["log"], errors="replace").read()[-2500:]))
        time.sleep(0.3)
    p.terminate()
    raise qa.QAError("the world didn't come up in %.0f s (AMBIENT_QA_WORLD_TIMEOUT raises it): see %s; its steps' times are in that log"
                     % (limit, P["log"]))


WORLD_UP_S = 900


def _load_factor():
    """tests/wait.py's load factor (load average per core, 1 to 4), 1 when it can't be read."""
    try:
        return max(1.0, min(4.0, os.getloadavg()[0] / (os.cpu_count() or 1)))
    except OSError:
        return 1.0


def world_timeout(env=None, lf=None):
    """How long `up` waits for the world (qa-native's 19d26863 rerun: the crowd step alone took 822 s
    at load 27, past the fixed 900 s): $AMBIENT_QA_WORLD_TIMEOUT seconds when it is a positive number,
    else 900 s times the load factor (1 to 4, as every e2e wait). Pure but for the load."""
    env = os.environ if env is None else env
    try:
        v = float(env.get("AMBIENT_QA_WORLD_TIMEOUT") or 0)
    except ValueError:
        v = 0
    if v > 0:
        return v
    return WORLD_UP_S * (_load_factor() if lf is None else max(1.0, lf))


def down():
    """SIGTERM the daemon (it stops each hub), then make sure every recorded pid is gone."""
    P = _paths(world_dir())
    info = _read(P["json"])
    if not info:
        return {"down": "no world up"}
    pids = [info["pid"]] + [h[k] for h in info["hubs"] for k in ("hub_pid", "fake_pid")]
    import fake_cu
    fake_cu.stop(_run_dir(info))
    if _alive(info["pid"]):
        os.kill(info["pid"], signal.SIGTERM)
    t0 = time.time()
    while any(_alive(p) for p in pids) and time.time() - t0 < 60:
        time.sleep(0.3)
    killed = [p for p in pids if _alive(p)]
    for p in killed:
        os.kill(p, signal.SIGKILL)
    left = subprocess.run(["ps", "-axww", "-o", "pid=,args="], capture_output=True, text=True).stdout
    left = [l.strip() for l in left.splitlines() if info["world"] in l]
    return {"down": True, "killed": killed, "left": left}


def _hub_state(sock, timeout=10):
    import qa
    sys.path.insert(0, os.path.join(qa.REPO, "tests"))
    import e2e  # noqa: E402
    c = e2e.Client(sock)
    try:
        t0 = time.time()
        while c.state is None and time.time() - t0 < timeout:
            time.sleep(0.05)
        return c.state or {}
    finally:
        c.s.close()


def _git(path, *args):
    r = subprocess.run(["git", "-C", path] + list(args), capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def state():
    """Each hub's agents (status, place, branch, commits ahead of main, dirty files) and cards."""
    import qa
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up: `qa.py world up`")
    out = []
    for h in info["hubs"]:
        st = _hub_state(h["sock"])
        agents = []
        for a in st.get("agents", []):
            row = {"name": a.get("name"), "status": a.get("status"), "mode": a.get("mode"), "branch": a.get("branch")}
            if a.get("mode") == "worktree" and a.get("path") and os.path.isdir(a["path"]):
                row["path"] = a["path"]
                row["commits"] = (_git(a["path"], "log", "--format=%s", "main..HEAD") or "").splitlines()
                row["diff"] = _git(a["path"], "diff", "--shortstat", "main...HEAD")
                row["dirty"] = (_git(a["path"], "status", "--porcelain") or "").splitlines()
            agents.append(row)
        cards = [{"id": c.get("id"), "kind": c.get("kind"), "place": c.get("place"),
                  "text": (c.get("text") or c.get("question") or "")[:160]} for c in st.get("cards", [])]
        out.append({"project": h["project"], "home": h["home"], "ws": h["ws"], "sock": h["sock"], "hub_pid": h["hub_pid"],
                    "alive": _alive(h["hub_pid"]), "agents": agents, "cards": cards})
    return {"world": info["world"], "home": info["home"], "pid": info["pid"], "bise": info["bise"],
            "registry": info.get("registry"), "rich": info.get("rich"), "try_real": info.get("try_real"), "hubs": out}


def say(project, text):
    """Words to that project's main (bise = the home hub), as typed in its TUI."""
    import qa
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    h = [h for h in info["hubs"] if h["project"] == project or (project == HOME_NAME and h["home"])]
    if not h:
        raise qa.QAError("no project %r in the world (%s)" % (project, ", ".join(x["project"] for x in info["hubs"])))
    sys.path.insert(0, os.path.join(qa.REPO, "tests"))
    import e2e  # noqa: E402
    c = e2e.Client(h[0]["sock"])
    try:
        c.say(text)
        time.sleep(0.3)
    finally:
        c.s.close()
    return {"sent": text, "project": h[0]["project"]}


def _run_dir(info):
    """The world's run dir: its hubs', its TUI's and the app's core's (HOME/.bise/run, worldEnv)."""
    return os.path.join(info["home"], ".bise", "run")


def computer(project, agent, state, place=None):
    """One agent's computer-use row in the world's fake computer-use world (fake_cu.py): driving,
    paused, stopped or none, on `place` ('Chrome · amazon.fr'); its fake broker's commands' socket
    started if it isn't up. Returns {key, agent: the row or None}."""
    import qa
    import fake_cu
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    guard(info["world"])
    h = [h for h in info["hubs"] if h["project"] == project or (project == HOME_NAME and h["home"])]
    if not h:
        raise qa.QAError("no project %r in the world (%s)" % (project, ", ".join(x["project"] for x in info["hubs"])))
    if state not in fake_cu.STATES:
        raise qa.QAError("state is one of %s" % "|".join(fake_cu.STATES))
    run = _run_dir(info)
    key = fake_cu.agent_key(fake_cu.hub_id(os.path.dirname(h[0]["sock"])), agent)
    fake_cu.ensure(run, os.path.join(os.path.dirname(os.path.abspath(__file__)), "qa.py"))
    return {"key": key, "agent": fake_cu.set_agent(run, key, state, place)}


def computer_log():
    """Every call the world's fake computer-use broker got so far: [{act, agent, key, args, ok}]."""
    import qa
    import fake_cu
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    return fake_cu.calls(_run_dir(info))


def feature(project, name, timeout=120):
    """A real approval card in that project: its fake main runs feature_script, then this waits
    on the hub's state for the feature_try card of `feature:<name>` and returns it."""
    import qa
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    h = [h for h in info["hubs"] if h["project"] == project and not h["home"]]
    if not h:
        raise qa.QAError("no project %r with a git checkout in the world (%s)" % (project, ", ".join(x["project"] for x in info["hubs"] if not x["home"])))
    h = h[0]
    guard(info["world"], [h["ws"]])
    path = os.path.join(info["world"], "seed", project, "feature-%s.sh" % name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(feature_script(info["world"], h["ws"], name))
    say(project, "[[bash: bash %s]]" % path)
    want = "feature:%s" % name
    t0 = time.time()
    while time.time() - t0 < timeout:
        cards = [c for c in _hub_state(h["sock"]).get("cards", []) if c.get("kind") == "feature_try" and c.get("place") == want]
        if cards:
            c = cards[-1]
            return {"project": project, "feature": name, "card": {"id": c.get("id"), "kind": c.get("kind"), "place": c.get("place"),
                                                                   "text": c.get("text") or c.get("question")}, "script": path}
        time.sleep(0.5)
    raise qa.QAError("no feature_try card for %s in %s after %d s: see %s and the hub's main" % (want, project, timeout, path))
