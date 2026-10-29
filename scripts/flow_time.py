#!/usr/bin/env python3
"""Flow time (flow-time, 2026-10-20): per task, spawn -> first commit -> its
code on main -> archived, and where that time went. Gabriel's metric: « le
temps entre le lancement d'un agent et le code mergé sur main et l'agent
archivé ». scripts/loop_audit.py calls flow() and prints it daily.

Sources: the hub journal (task_created at_ms, lifecycle archived: its time is
the timed line before it), the agents' sessions (loop_audit.session_view: turns,
tool calls, the message that woke each turn), git (main's first-parent history
and reflog: when main first held each commit; a task's commits are the ones
whose subject starts like one of its `sb land "<message>"`), heavy.log.

Each second of [spawn, on main] counts once, in the first span that holds it:
its heavy job queued, then running, then the agent in a turn, then the gap
before its next turn, named by what woke it. [on main, archived] is the drop
wait. Tasks without a commit on main (read-only, plans, try cuts) are counted
apart. Pure part first (tested by self_test); the readers after.
"""
import json
import os
import re
import subprocess
from collections import Counter

SIGNERS = ("architect", "review-gates")
LAND_MSG = re.compile(r"""sb land\b[^"']*?(["'])([^"'$]{20,})""")
LAND_JOB = re.compile(r"gate\.sh (full|rerun)|test:land")


def subject_key(s):
    """A commit subject or an sb land message, compared on its first 40 word characters."""
    return re.sub(r"\W+", " ", s).strip().lower()[:40]


def land_keys(cmds):
    """The subjects a task's sb land commands commit."""
    out = set()
    for c in cmds:
        if "sb land" in c and "--help" not in c:
            m = LAND_MSG.search(c)
            if m:
                out.add(subject_key(m.group(2)))
    return out


def gap_label(text):
    """A gap between two turns, named by the message that woke the next turn."""
    if not text:
        return "idle: woken by the user"
    m = re.search(r'from="([^"]+)"', text[:300])
    who = m.group(1) if m else "user"
    body = text[text.find(">") + 1:].lower() if m else text.lower()
    if who == "bise":
        return "idle: polled by its own timer" if re.match(r"\s*timer #", body) else "waiting on a job outside heavy-run"
    if who in SIGNERS:
        return "sign-off wait (%s)" % who
    if who == "main":
        if re.search(r"provider|timed out|crash|restart|died", body):
            return "dead after a provider outage, until main"
        if re.search(r"freeze|lifted|needs the heavy slots|pause", body):
            return "paused by main (freeze for a release)"
        if re.search(r"gabriel|the user|his words|verbatim|picked|«", body):
            return "waiting for the user's decision"
        return "idle until main writes"
    if who == "user":
        return "idle: woken by the user"
    return "idle until a peer answers"


def job_label(cmd):
    return "heavy queue: land check" if LAND_JOB.search(cmd) else "heavy queue: other job"


def paint(a, b, spans):
    """{label: seconds} over [a, b]: each instant to the first span holding it."""
    pts = sorted({a, b} | {min(b, max(a, v)) for x, y, _ in spans for v in (x, y)})
    out = Counter()
    for p, q in zip(pts, pts[1:]):
        mid = (p + q) / 2
        for x, y, lab in spans:
            if x <= mid < y:
                out[lab] += q - p
                break
    return out


def split(spawn, end, turns, wakes, calls, jobs):
    """Where [spawn, end] went. turns [(a, b)], wakes {turn start: first
    message}, calls [(start, end, class, cmd)], jobs heavy.log rows of the task."""
    spans = [(j["submit"], j["start"], job_label(j["cmd"])) for j in jobs]
    spans += [(s, e, "land (sb land)") for s, e, cls, cmd in calls if cls == "land" and "sb land" in cmd]
    spans += [(j["start"], j["end"], "check running (heavy job)") for j in jobs]
    spans += [(s, e, "check running (foreground)") for s, e, cls, _ in calls if cls in ("gate", "cargo", "test-rerun")]
    spans += [(a, b, "agent working (model + tools)") for a, b in turns]
    prev = spawn
    for a, b in sorted(turns):
        if a > prev:
            spans.append((prev, a, "agent start" if prev == spawn else gap_label(wakes.get(a, ""))))
        prev = max(prev, b)
    spans.append((prev, end, "idle after its last turn"))
    return paint(spawn, end, spans)


def task_flow(task, views, subjects, on_main_at, heavy):
    """One task's times. task {name, spawn, archived}; views its sessions."""
    sp, ar, name = task["spawn"], task["archived"], task["name"]
    vs = [v for v in views if v["turns"] and sp - 120 <= v["turns"][0][0] <= ar + 120]
    turns = sorted(t for v in vs for t in v["turns"])
    wakes = {k: x for v in vs for k, x in (v.get("wakes") or {}).items()}
    calls = sorted((s, e, cls, cmd_of(a)) for v in vs for s, e, cls, a in v["calls"])
    commits = {h for k in land_keys(c[3] for c in calls) for h in subjects.get(k, [])}
    commits = {h for h in commits if sp - 600 <= on_main_at[h] <= ar + 600}
    r = {"name": name, "spawn": sp, "archived": ar, "commits": len(commits), "landed": None}
    firsts = [c[0] for c in calls if c[2] == "land" and ("sb land" in c[3] or "git commit" in c[3])]
    if not commits:
        return r
    r["landed"] = max(on_main_at[h] for h in commits)
    r["first_commit"] = min(firsts + [min(on_main_at[h] for h in commits)])
    jobs = [j for j in heavy if ("/%s/" % name) in j["cwd"] and j["start"] and j["start"] >= sp - 60 and j["submit"] <= r["landed"]]
    r["split"] = dict(split(sp, r["landed"], turns, wakes, calls, jobs))
    r["split"]["landed, not archived yet"] = max(0, ar - r["landed"])
    return r


def cmd_of(args):
    try:
        d = json.loads(args) if isinstance(args, str) else args
        return str(d.get("arg", "")) if isinstance(d, dict) else str(args)
    except ValueError:
        return str(args)


def pct(v, p):
    v = sorted(v)
    return v[min(len(v) - 1, int(p * len(v)))] if v else None


def summary(rows):
    """Medians and p90s of the steps, and the causes in hours, of the tasks with code on main."""
    L = [r for r in rows if r["landed"]]
    out = {"tasks": len(rows), "on_main": len(L), "steps": {}, "causes_h": {}}
    for k, f in (("spawn -> first commit", lambda r: r["first_commit"] - r["spawn"]),
                 ("spawn -> on main", lambda r: r["landed"] - r["spawn"]),
                 ("on main -> archived", lambda r: r["archived"] - r["landed"]),
                 ("spawn -> archived", lambda r: r["archived"] - r["spawn"])):
        v = [f(r) for r in L]
        out["steps"][k] = {"p50": pct(v, 0.5), "p90": pct(v, 0.9)}
    tot = Counter()
    for r in L:
        tot.update(r["split"])
    out["causes_h"] = {k: round(v / 3600, 1) for k, v in tot.most_common()}
    out["slowest"] = [(r["name"], round((r["landed"] - r["spawn"]) / 3600, 1))
                      for r in sorted(L, key=lambda r: r["spawn"] - r["landed"])[:5]]
    # main's rule (m_35426): a task is dropped in the turn main reads its land;
    # these slipped (over 15 min), the longest first
    late = [r for r in L if r["archived"] - r["landed"] > LATE_DROP]
    out["late_drops"] = [(r["name"], round((r["archived"] - r["landed"]) / 3600, 1))
                         for r in sorted(late, key=lambda r: r["landed"] - r["archived"])]
    return out


LATE_DROP = 15 * 60


# ---- readers ---------------------------------------------------------------

def line_time(e):
    """A journal line's own time, if it has one."""
    for d in (e, e.get("msg"), e.get("report"), e.get("watch")):
        if isinstance(d, dict):
            for k in ("at_ms", "created_ms", "set_at"):
                if isinstance(d.get(k), (int, float)):
                    return d[k] / 1000
    return None


def tasks(journal_lines):
    """[{name, spawn, archived}] of the archived tasks, from the journal's lines (dicts)."""
    out, live, last = [], {}, None
    for e in journal_lines:
        t = line_time(e)
        last = t if t is not None else last
        typ = e.get("type")
        if typ == "task_created":
            live[e.get("name")] = {"name": e.get("name"), "spawn": last}
        elif typ == "renamed" and e.get("name") in live:
            live[e["new_name"]] = dict(live.pop(e["name"]), name=e["new_name"])
        elif typ == "lifecycle" and e.get("lifecycle") == "archived" and e.get("name") in live:
            r = live.pop(e["name"])
            if r["spawn"] is not None and last is not None:
                out.append(dict(r, archived=last))
    return out


def main_history(repo, branch="main", since="2026-10-01"):
    """({subject key: [sha]}, {sha: when main first held it}) from git."""
    def git(*a):
        return subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True).stdout
    hist = [l.split(" ", 2) for l in git("log", branch, "--first-parent", "--since=" + since,
                                          "--format=%H %ct %s").splitlines() if l.count(" ") >= 2]
    idx = {h: i for i, (h, _, _) in enumerate(hist)}
    reached = {}
    for l in git("reflog", "show", branch, "--date=unix", "--format=%H %gd").splitlines():
        h, _, gd = l.partition(" ")
        m = re.search(r"\{(\d+)\}", gd)
        if h in idx and m:
            reached[idx[h]] = min(reached.get(idx[h], int(m.group(1))), int(m.group(1)))
    subjects, on_main_at, best = {}, {}, None
    for i, (h, ct, s) in enumerate(hist):  # the tip first
        if i in reached:
            best = reached[i] if best is None else min(best, reached[i])
        on_main_at[h] = best if best is not None else int(ct)
        subjects.setdefault(subject_key(s), []).append(h)
    return subjects, on_main_at


def flow(journal_lines, views_by_agent, heavy, repo, since):
    """The tasks archived since `since`: their rows and summary."""
    subjects, on_main_at = main_history(repo)
    rows = [task_flow(t, views_by_agent.get(t["name"], []), subjects, on_main_at, heavy)
            for t in tasks(journal_lines) if t["archived"] >= since]
    return {"rows": rows, "summary": summary(rows)}


def self_test():
    assert subject_key("fix(gate): the queue, by rank!") == "fix gate the queue by rank"
    assert land_keys(['sb land "fix(x): a change long enough to match"', "sb land --help",
                      'sb land --here "$(git log -1 --format=%B)"']) == {"fix x a change long enough to match"}
    assert gap_label('<agent_message from="bise" id="m_1">timer #3 fired') == "idle: polled by its own timer"
    assert gap_label('<agent_message from="bise" id="m_1">background 2 ended') == "waiting on a job outside heavy-run"
    assert gap_label('<agent_message from="review-gates" id="m_1">yes') == "sign-off wait (review-gates)"
    assert gap_label('<agent_message from="main" id="m_1">freeze lifted') == "paused by main (freeze for a release)"
    assert gap_label('<agent_message from="main" id="m_1">Gabriel picked B') == "waiting for the user's decision"
    assert gap_label('<agent_message from="pick-assets" id="m_1">done') == "idle until a peer answers"
    # spawn 0, a turn 10..20, a job queued 20..50 and running 50..60, woken by the job at 70, land at 100
    s = split(0, 100, [(10, 20), (70, 100)], {70: '<agent_message from="bise">background 1 ended'},
              [(90, 95, "land", 'sb land "x"')],
              [{"submit": 20, "start": 50, "end": 60, "cmd": "tests/gate.sh full"}])
    assert s == {"agent start": 10, "agent working (model + tools)": 35, "heavy queue: land check": 30,
                 "check running (heavy job)": 10, "waiting on a job outside heavy-run": 10, "land (sb land)": 5}, s
    j = [{"type": "message_sent", "msg": {"created_ms": 1000}}, {"type": "task_created", "name": "a", "at_ms": 2000},
         {"type": "message_sent", "msg": {"created_ms": 9000}}, {"type": "lifecycle", "name": "a", "lifecycle": "archived"},
         {"type": "task_created", "name": "b", "at_ms": 9500}]
    assert tasks(j) == [{"name": "a", "spawn": 2.0, "archived": 9.0}], tasks(j)
    row = {"name": "a", "spawn": 0, "archived": 400, "landed": 300, "first_commit": 100,
           "split": {"agent working (model + tools)": 300, "landed, not archived yet": 100}}
    sm = summary([row, {"name": "b", "spawn": 0, "archived": 5, "landed": None}])
    assert sm["on_main"] == 1 and sm["steps"]["spawn -> on main"]["p50"] == 300, sm
    assert summary([dict(row, archived=300 + 3600)])["late_drops"] == [("a", 1.0)] and sm["late_drops"] == []
    print("flow_time self-test: ok")


if __name__ == "__main__":
    self_test()
