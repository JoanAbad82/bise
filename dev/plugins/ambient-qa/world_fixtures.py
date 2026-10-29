"""ambient-qa world: the fixtures, pure (PROJECTS, plan, the rich world's words and scripts).
Moved out of world.py as is (the 1,000-line cap, architect S1); world.py re-exports every name."""

import json
import os

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
         # a non-zero context gauge in the plain world (qa-flows m_20438): its brief's [[usage: N]]
         # makes every call of its turn report N input tokens
         {"name": "search", "place": "", "objective": "search doesn't find tshirt", "usage": 43800,
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
         # tied to the agent's message (sb notify --for), so the card is the agent's, not main's
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


def queued_count(agent):
    """His queued messages on an agent row: client-protocol's msgs_queued, or its queued list (the
    old hub sent a number in `queued`; a list compared to 1 raised and the world waited forever). Pure."""
    a = agent or {}
    q = a.get("queued")
    if a.get("msgs_queued") is not None:
        return int(a["msgs_queued"])
    return len(q) if isinstance(q, list) else int(q or 0)


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


def put_script(d, name, match, calls=(), reply="", slow=None, usage=None):
    """One script for the world's fake providers ($FAKE_SCRIPTS): a user message holding `match` makes
    `calls` [(tool, arg)], then answers `reply`; `usage` {"input", "output"}: the token counts its
    calls report. Written atomically."""
    os.makedirs(d, exist_ok=True)
    s = {"match": match, "calls": [{"tool": t, "arg": a} for t, a in calls], "reply": reply}
    if slow:
        s["slow"] = slow
    if usage:
        s["usage"] = usage
    tmp = os.path.join(d, ".%s.tmp" % name)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f)
    os.replace(tmp, os.path.join(d, name + ".json"))


# HEADFIT's context note (ambient-lead m_17350): p99's last call reports 43,800 + 200 tokens, so its
# head reads 'context 44k · 17%' (mistral/mistral-small-latest, a 262,144-token window)
USAGE_TURN = {"text": "how much of your context have the p99 notes taken?",
              "reply": "About 44k tokens so far, most of it the per-host latency tables.",
              "usage": {"input": 43800, "output": 200}, "words": "44k · 17%"}


def scripts_dir(world):
    return os.path.join(world, "rich", "scripts")


def agent_reply(agent):
    """What an agent says after its seed script: its last report, as a sentence. Pure."""
    reps = [s["text"] for s in agent.get("steps", []) if "report" in s]
    t = reps[-1] if reps else "started; I'll report when there is something to look at"
    return t[0].upper() + t[1:] + ("" if t.endswith((".", "?")) else ".")


