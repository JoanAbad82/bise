"""The runtime's obs lines, read in Python tests (issue 38): one reader of
both forms, like bise_proto's `thread::lines::read` on the Rust side.

    obs <kind> :: <json>        the record (issue 38 sha 2b on)
      obs: <kind>: <text>       the older text (what the runtime writes before 2b)

A line may come as bytes, after a `<ms>\\t` (a transcript file) or a
`history ` (a replay). Tests ask what kind it is and its main text, never
its prefix: the switch of the writers (2b) then changes no test.

    python3 tests/obs_lines.py      # its self-test
"""
import json
import re

NEW = "obs "
OLD = "  obs: "
SEP = " :: "

# the text field of each kind's record (what the old line said after its kind)
TEXT = {
    "assistant": "text", "steering_received": "text", "steered": "text",
    "notification_received": "text", "notification_delivered": "text",
    "steering_rejected": "reason", "harness_restarted": "note",
    "candidate_discarded": "cause", "context_compaction_failed": "code",
    "compaction_done": "summary", "turn_stalled": "why", "reload": "text",
}


def _line(line):
    if isinstance(line, bytes):
        line = line.decode("utf-8", "replace")
    line = line.rstrip("\r\n")
    m = re.match(r"\d+\t", line)
    if m:
        line = line[m.end():]
    if line.startswith("history "):
        line = line[len("history "):]
    return line


def read(line):
    """(kind, record) of an obs line, else None. The record of an old text
    line is {"text": <what followed its kind>}; turn_done's is {"end", "why"}
    in both forms."""
    line = _line(line)
    if line.startswith(NEW) and SEP in line:
        kind, js = line[len(NEW):].split(SEP, 1)
        if kind and " " not in kind:
            try:
                rec = json.loads(js)
            except ValueError:
                rec = None
            if isinstance(rec, dict):
                return kind, rec
    if line.startswith(OLD):
        o = line[len(OLD):]
        m = re.match(r"[a-z_]+", o)
        if not m:
            return None
        kind, rest = m.group(0), o[m.end():]
        text = rest[2:] if rest.startswith(": ") else rest.lstrip(": ").strip()
        if kind == "turn_done":
            if text.startswith("failed: interrupted by "):
                return kind, {"end": "interrupted", "why": text[len("failed: interrupted by "):]}
            if text.startswith("failed: "):
                return kind, {"end": "failed", "why": text[len("failed: "):]}
            return kind, {"end": text, "why": ""}
        return kind, {"text": text}
    return None


def kind(line):
    """The obs kind of a line (`turn_done`, `assistant`, ...), else None."""
    r = read(line)
    return r[0] if r else None


def text(line):
    """An obs line's main text (an assistant's words, a steer, a cause...),
    "" when it has none, None when it is no obs line."""
    r = read(line)
    if not r:
        return None
    k, rec = r
    # a record's text field, else an old line's text
    return rec.get(TEXT.get(k, "text"), rec.get("text", ""))


def turn_end(line):
    """How a turn_done line says the turn ended: completed, interrupted,
    failed (or the other word it said); None for any other line."""
    r = read(line)
    return r[1].get("end") if r and r[0] == "turn_done" else None


def _self_test():
    pairs = [
        ("  obs: turn_started", "obs turn_started :: {}", "turn_started", ""),
        ("  obs: assistant: salut", 'obs assistant :: {"text":"salut"}', "assistant", "salut"),
        ("  obs: steered: you sent 1 note", 'obs steered :: {"text":"you sent 1 note"}', "steered", "you sent 1 note"),
        ("  obs: compaction_done: ## Who", 'obs compaction_done :: {"summary":"## Who"}', "compaction_done", "## Who"),
    ]
    for old, new, k, t in pairs:
        for l in (old, new, old.encode(), "123\t" + old, "history " + new):
            assert kind(l) == k, (l, kind(l))
        assert text(old) == t == text(new), (old, text(old), text(new))
    for old, new, end in [
        ("  obs: turn_done: completed", 'obs turn_done :: {"end":"completed","why":""}', "completed"),
        ("  obs: turn_done: failed: interrupted by main", 'obs turn_done :: {"end":"interrupted","why":"main"}', "interrupted"),
        ("  obs: turn_done: failed: provider 500", 'obs turn_done :: {"end":"failed","why":"provider 500"}', "failed"),
    ]:
        assert turn_end(old) == end == turn_end(new), (old, new)
    assert kind("  obs: tool_started #3") == "tool_started"
    assert kind("  obs: reload refused: busy") == "reload"
    assert kind('obs usage :: {"model":"m","input":7}') == "usage"
    for no in ("sb you : hi", "obs nothing here", "tool #1 bash : ls", "", b"--- idle"):
        assert kind(no) is None and text(no) is None, no
    print("ok   obs_lines self-test")


if __name__ == "__main__":
    _self_test()
