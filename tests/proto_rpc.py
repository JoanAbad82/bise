"""What the proto_e2e_<area>.py files share: the hub's JSON-RPC wire as
e2e.Client speaks it (requests, results, errors, notifications), read
in its own words. They drove the released desktop core's typed door
until it went (debt-t3, architect m_23250); the arms they reach are the
same, through their methods (apps/desktop/src/proto/methods.gen.ts)."""

import json
import os
import re
import socket

import e2e
from e2e import check

GEN = os.path.join(e2e.ROOT, "apps", "desktop", "src", "proto", "methods.gen.ts")
FIXTURES = os.path.join(e2e.ROOT, "rust", "proto", "fixtures", "hub_ev.jsonl")


def _table(name):
    """A table of methods.gen.ts (bise_proto::rpc's, generated): method
    -> its row's fields."""
    body = open(GEN).read().split("export const %s = {" % name, 1)[1].split("\n}", 1)[0]
    rows = {}
    for m in re.finditer(r'"([^"]+)": \{([^}]*)\}', body):
        rows[m.group(1)] = {k: (None if v == "null" else v.strip('"')) for k, v in re.findall(r'(\w+): ("[^"]*"|null)', m.group(2))}
    return rows


# notification -> the HubEv tag its params are; method -> its HubCmd tag
NOTE_EV = {m: r["ev"] for m, r in _table("NOTIFICATIONS").items()}
METHOD_CMD = {m: r["cmd"] for m, r in _table("METHODS").items()}


def req(c, method, timeout=30, **params):
    """`method` on this hub (its project filled in): the response."""
    return c.rpc(method, dict(params, project=c.project()), timeout)


def ok(r, what=""):
    """A response's result; an error fails the test."""
    check("error" not in r and "result" in r, "%s answered, not refused: %r" % (what, r))
    return r["result"]


def refused(r, what=""):
    """A response's error ({code, message, data}); a result fails the test."""
    check("error" in r and r["error"].get("message"), "%s refused: %r" % (what, r))
    return r["error"]


def run(c, line, agent="main", **opts):
    """His line through command/run (the hub's one parser): the response."""
    return req(c, "command/run", agent=agent, line=line, **opts)


def notes(c, method):
    """Every `method` notification's params so far, oldest first."""
    return c.notes(method)


def hub_all(c, method):
    """A hub-wide kind's params, from initialize's state on, oldest first."""
    with c.lock:
        return [p for _, m, p in c.note_log if m == method]


def hub_now(c, method):
    """A hub-wide kind's latest params (initialize's state, then its
    notifications); none: never said."""
    got = hub_all(c, method)
    return got[-1] if got else None


def agent_row(c, name):
    """`name`'s row in the latest hub/agents."""
    now = hub_now(c, "hub/agents") or {"agents": []}
    return next((a for a in now["agents"] if a["name"] == name), None)


def idle(c, name, timeout=30):
    """Wait for `name` idle; on a timeout the failure carries its own
    trace: `name`'s hub/agents row (status, phase, since, queued) and the
    last 10 notifications the client got (issue 26, the queued round's
    one 438 s stall that never came back)."""
    try:
        c.wait_idle(name, timeout=timeout)
    except AssertionError as e:
        row = agent_row(c, name) or {}
        keep = {k: row.get(k) for k in ("status", "phase", "since_ms", "since", "queued", "waiting_on")}
        with c.lock:
            last = [(e2.get("method"), json.dumps(e2.get("params"))[:300]) for e2 in c.events if "method" in e2][-10:]
        raise AssertionError("%s\n%s's row: %s\nlast notifications: %s" % (e, name, json.dumps(keep), json.dumps(last, indent=1)))


def entries(c, agent, kind=None):
    """`agent`'s live thread/entry entries of `kind`, oldest first."""
    return [p["entry"] for p in notes(c, "thread/entry") if p["agent"] == agent and (kind is None or p["entry"]["kind"] == kind)]


def subscribe(c, agent, **opts):
    """thread/subscribe: `agent`'s thread (its page of entries)."""
    return ok(req(c, "thread/subscribe", agent=agent, **opts), "thread/subscribe %s" % agent)


def unsubscribe(c, agent):
    ok(req(c, "thread/unsubscribe", agent=agent), "thread/unsubscribe %s" % agent)


def thread_of(c, agent):
    """`agent`'s whole thread now (subscribe, read, unsubscribe)."""
    t = subscribe(c, agent)
    unsubscribe(c, agent)
    return t["entries"]


def transcript(E, agent="main"):
    """`agent`'s transcript lines, without their time stamps."""
    p = os.path.join(E.state, "agents", agent, "transcript.log")
    return [l.split("\t", 1)[1] for l in open(p).read().splitlines() if "\t" in l]


def raw_client(sock_path, first):
    """A raw hub.sock connection whose first line is `first`: every line
    the hub wrote before it closed (or in 3 s)."""
    s = socket.socket(socket.AF_UNIX)
    s.settimeout(3)
    s.connect(sock_path)
    s.sendall((json.dumps(first) + "\n").encode())
    out = []
    try:
        for line in s.makefile("r"):
            out.append(json.loads(line))
            if "id" in out[-1] or "ok" in out[-1]:
                break
    except (socket.timeout, ValueError):
        pass
    s.close()
    return out


def required_keys():
    """Each frozen event's keys as the fixtures show them (its `ev` tag is
    the method on this wire), minus the optional ones (skipped when empty
    on the wire)."""
    optional = {"ev", "before", "project", "cmd", "places", "others", "ended"}
    keys = {}
    for line in open(FIXTURES):
        if line.strip():
            v = json.loads(line)
            k = set(v) - optional
            keys[v["ev"]] = keys.get(v["ev"], k) & k
    return keys


# the kinds whose keys are frozen for the window (the desktop core's
# reads): the others skip an empty field (hub/flow's `flow`)
FROZEN = ("agents", "cards", "entry", "typing", "artifacts", "scheduled", "worktrees", "dev_servers", "merged", "features", "prs", "models", "jobs", "job_end", "notice", "approvals")


def check_keys(c):
    """Every notification so far of a FROZEN kind has its event's keys."""
    need = required_keys()
    with c.lock:
        evs = [e for e in c.events if "method" in e and "id" not in e and NOTE_EV.get(e["method"]) in FROZEN]
    for e in evs:
        ev = NOTE_EV[e["method"]]
        missing = need.get(ev, set()) - set(e.get("params") or {})
        check(not missing, "%s lacks %s: %r" % (e["method"], missing, e))
