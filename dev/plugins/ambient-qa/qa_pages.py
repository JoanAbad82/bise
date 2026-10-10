"""ambient-qa: pages on the throwaway hub: publish, notes, meta, the headless Chrome drive, the fixture.
Moved out of qa.py as is (the 1,000-line cap, architect S1); qa.py re-exports every name."""

import json
import os
import subprocess
import time

from qa_core import (  # noqa: E402
    HERE, OUT, QAError, REPO, _http, _hub, _port,
    _wait)


# ---------------------------------------------------------------- pages on the throwaway hub

KIT_EXAMPLE = os.path.join(REPO, "kit", "examples", "weekly-update.html")


def page_publish(file=None, id="weekly-update", title="weekly update", done=None, answers=None, edit=None, timeout=120):
    """The throwaway hub's main publishes a page (`sb page publish` through
    the scripted provider's [[bash: ...]]): `file`, else amb-kit's
    weekly-update example; `edit` {old: new} changes the text first (a v2).
    `done` note ids, `answers` {note id: text}. Returns the page's url,
    version and the page server's port."""
    c, info = _hub()
    src = open(file or KIT_EXAMPLE).read()
    for a, b in (edit or {}).items():
        src = src.replace(a, b)
    before = {p["id"]: p.get("version", 0) for p in (_wait(lambda: c.state, 10, "the hub's state") or {}).get("pages", [])}
    path = os.path.join(info["tmp"], "qa-page-%s-%d.html" % (id, int(time.time() * 1000)))
    with open(path, "w") as f:
        f.write(src)
    cmd = 'sb page publish %s --id %s --title "%s"' % (path, id, title.replace('"', ""))
    if done:
        cmd += " --notes-done " + ",".join(done)
    for nid, text in (answers or {}).items():
        cmd += ' --note-answer %s="%s"' % (nid, text.replace('"', ""))
    if info.get("kind") == "model":
        raise QAError("page_publish scripts the fake main; on a model hub ask main yourself")
    c.say("[[bash: %s]]" % cmd)
    page = _wait(lambda: next((p for p in c.state.get("pages", []) if p["id"] == id and p.get("version", 0) > before.get(id, 0)), None),
                 timeout, "page %s published (main's lines: %s)" % (id, c.lines("main")[-3:]))
    port = _port(info["state"])
    return {"id": id, "version": page.get("version"), "url": page.get("url"), "port": port, "pages_url": "http://127.0.0.1:%d/" % port}


def page_notes(id, notes, send=False):
    """Draft notes on a page through its own API (the token from the page's
    shell, the server's origin), as notes.js would; `send` sends them to
    the page's agent. A note: {block, kind: note|keep|drop|unsure|edit|voice|pin,
    quote?, text?, before?, after?}."""
    _, info = _hub()
    port = _port(info["state"])
    st, body = _http(port, "GET", "/p/%s" % id)
    if st != 200:
        raise QAError("GET /p/%s: %d" % (id, st))
    token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
    h = {"Origin": "http://127.0.0.1:%d" % port, "X-Bise-Token": token}
    st, saved = _http(port, "POST", "/api/p/%s/notes" % id, {"notes": notes}, h)
    if st != 200:
        raise QAError("POST notes: %d %s" % (st, saved))
    out = {"saved": json.loads(saved).get("notes", [])}
    if send:
        st, sent = _http(port, "POST", "/api/p/%s/send" % id, {}, h)
        if st != 200:
            raise QAError("POST send: %d %s" % (st, sent))
        out["sent"] = json.loads(sent)
    return out


def page_meta(id, tries=6):
    """A page's meta; a 404 is retried for a few seconds (ambient-pm m_5639:
    a watcher's republish made one GET miss, and the run stopped there)."""
    _, info = _hub()
    port = _port(info["state"])
    for k in range(tries):
        st, body = _http(port, "GET", "/p/%s/meta" % id)
        if st == 200:
            return json.loads(body)
        if st != 404 or k == tries - 1:
            break
        time.sleep(0.5 * (k + 1))
    raise QAError("GET /p/%s/meta: %d" % (id, st))


def page_drive(id=None, url=None, steps=None, schemes=("light",), name=None, out=None, width=1400, height=900, scale=2):
    """A page in a throwaway headless Chrome (pagedrive.mjs: its own profile,
    no logins, local URLs only), never the user's browser: the page `id` on
    the throwaway hub (or a local `url`), `steps` run in order (eval, key,
    mouse, type, wait, shot), once per color scheme. Returns each run's
    results (evals, shot files) and the page's console."""
    if not url:
        if not id:
            raise QAError("page_drive needs a page id (on the throwaway hub) or a local url")
        _, info = _hub()
        port = _port(info["state"])
        url = "http://127.0.0.1:%d/p/%s" % (port, id)
    if isinstance(schemes, str):
        schemes = [x for x in schemes.split(",") if x]
    out = out or os.path.join(OUT, "pages")
    os.makedirs(out, exist_ok=True)
    name = name or (id or "page")
    runs = []
    for sc in schemes:
        args = {"url": url, "out": os.path.join(out, "%s.%s" % (name, sc)), "steps": steps or [], "scheme": sc,
                "width": width, "height": height, "scale": scale}
        r = subprocess.run(["node", os.path.join(HERE, "pagedrive.mjs"), json.dumps(args)], capture_output=True, text=True, timeout=600)
        try:
            res = json.loads(r.stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            raise QAError("pagedrive failed: " + (r.stderr or r.stdout)[-800:])
        if res.get("error"):
            raise QAError("pagedrive: %s" % res["error"])
        runs.append(dict(res, scheme=sc))
    return {"url": url, "runs": runs}


def page_fixture(id="weekly-update"):
    """ambient's fixture (m_4872): v1, three notes sent (a note, a voice
    note, an edit), then v2 answering them: one done, one answered, the
    edit kept as an open draft-free sent note; a fourth note on a block v2
    removes shows as moved. Returns the urls of v1 and v2 and the notes."""
    v1 = page_publish(id=id)
    notes = [
        {"block": "p1", "quote": "dark mode ships on the settings page monday", "kind": "note", "text": "say which monday"},
        {"block": "p2", "kind": "voice", "text": "can we add who owns the release"},
        {"block": "p1", "kind": "edit", "before": "half the size", "after": "a third of the size"},
        {"block": "c1", "kind": "unsure"},
    ]
    sent = page_notes(id, notes, send=True)
    ids = [n["id"] for n in sent["saved"]]
    # the notes made main take a turn: v2 goes after it (else it waits behind it)
    c, _ = _hub()
    c.wait_line("main", "you sent 4 notes", 120)
    c.wait_idle("main", timeout=180)
    v2 = page_publish(id=id, edit={"dark mode ships on the settings page monday": "dark mode ships on the settings page on monday 14",
                                   '<section data-kit="callout" data-id="c1">': '<section data-kit="callout" data-id="c1b">'},
                      done=ids[:1], answers={ids[1]: "release is owned by perf until the 20th"})
    return {"v1": v1, "v2": v2, "notes": page_meta(id).get("notes", [])}
