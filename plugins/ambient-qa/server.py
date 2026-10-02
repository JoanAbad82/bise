#!/usr/bin/env python3
"""ambient-qa's MCP server (stdio, JSON-RPC 2.0, one message per line).
The tools are qa.py's functions; a PNG comes back as an image block (made
smaller with sips when big) next to its path."""
import base64
import json
import os
import subprocess
import sys
import tempfile
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qa  # noqa: E402

EV = {"type": "object", "description": "a contract event (docs/ambient-app.md §4): {ev: ..., ...}"}
TOOLS = [
    ("launch", "Start the real bise ambient.app in QA mode. hub=fake (default): a throwaway scripted hub, main answers 'ack: <your words>'; hub=real: the real workspace, read-only (nothing is ever sent). Builds the app at its one path if its sources changed (refused while the user's own app runs, unless force_build).",
     {"hub": {"type": "string", "enum": ["fake", "real"]}, "workspace": {"type": "string"}, "bise": {"type": "string", "description": "a bise with ambient-core (default: found)"},
      "backdrop": {"type": "string", "description": "dark, bright, busy, none, or a picture file"}, "force_build": {"type": "boolean"}, "restart": {"type": "boolean"}}, []),
    ("stop", "Quit the QA app and its fake hub.", {"keep_hub": {"type": "boolean"}}, []),
    ("inject", "An event into the app as if real: a core event (hub, state, phase, heard, level, main, word, sent, error, page) or an app/web one (app_fn, app_key, app_perm, app_shot, app_hidden, app_reduce_motion, app_settings, ui_*).",
     {"ev": EV}, ["ev"]),
    ("fn", "The fn key, through the app's real key path: down (talk starts, the glow, the fake shot), up (send), tap, double (hands-free), cancel.",
     {"state": {"type": "string", "enum": ["down", "up", "tap", "double", "cancel"]}, "key": {"type": "string", "enum": ["fn", "right_option"]}}, ["state"]),
    ("key", "fn + a key, through the app's real key path: space 1-9 i 0 o . enter esc.", {"k": {"type": "string"}}, ["k"]),
    ("say", "Hold fn, say the words (heard partials, a fake voice level, no mic), let go: they go to main on the fake hub; waits for main's answer, then 'speaks' it (phase speaking, word by word). Returns main's text.",
     {"text": {"type": "string"}, "per_word_ms": {"type": "number"}, "wait_answer": {"type": "boolean"}}, ["text"]),
    ("snapshot", "PNGs of the app now: panel (the capsule and its needs-you note on the backdrop, glass composited), screen (the main screen: backdrop, edge glow and corners, the capsule), web (the web view alone), both (panel + screen).",
     {"what": {"type": "string", "enum": ["both", "panel", "screen", "web", "all"]}, "backdrop": {"type": "string"}, "name": {"type": "string"}, "image": {"type": "boolean", "description": "return the panel image inline (default true)"}}, []),
    ("state", "The web UI's model and view (what the capsule shows, its size, the orb's pose, the words) and the app's side (panel frame, shape, hidden, glow).", {}, []),
    ("events", "The last n events in and out (core>app, qa>app, qa>page, page>app, app>core...), levels left out unless asked.",
     {"n": {"type": "integer"}, "levels": {"type": "boolean"}}, []),
    ("scenes", "Play every SPEC §2 state (fakecore.js's scenes plus the extra ones) in the real app, shoot each moment, and return a contact sheet per backdrop. `only`: scene ids; `at`: ms to shoot at instead of the automatic moments.",
     {"only": {"type": "array", "items": {"type": "string"}}, "backdrops": {"type": "array", "items": {"type": "string"}}, "at": {"type": "array", "items": {"type": "number"}},
      "what": {"type": "string", "enum": ["both", "panel", "screen"]}, "image": {"type": "boolean"}}, []),
    ("list_scenes", "The scene ids, their SPEC §2 states and labels.", {}, []),
    ("play", "A custom timeline into the app: events [[ms, ev], ...], shots [{at: ms, what}] (the core is muted while it plays). Files are named <name>@<s>s.",
     {"events": {"type": "array"}, "shots": {"type": "array"}, "name": {"type": "string"}, "backdrop": {"type": "string"}}, ["events"]),
    ("reset", "The pages start over (the model back to its start), the panel shown.", {}, []),
]


def image_block(path, max_px=1800):
    """The PNG as an MCP image, made smaller (sips, no copy kept) when big."""
    src = path
    tmp = None
    try:
        if os.path.getsize(path) > 900_000:
            tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
            subprocess.run(["sips", "-Z", str(max_px), path, "--out", tmp], capture_output=True, check=True)
            src = tmp
        with open(src, "rb") as f:
            return {"type": "image", "data": base64.b64encode(f.read()).decode(), "mimeType": "image/png"}
    except (OSError, subprocess.CalledProcessError):
        return None
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except OSError:
                pass


def run(name, a):
    images = []
    if name == "launch":
        r = qa.launch(a.get("hub", "fake"), a.get("workspace"), a.get("bise"), None, a.get("backdrop", "dark"), a.get("force_build", False), a.get("restart", False))
    elif name == "stop":
        r = qa.stop(a.get("keep_hub", False))
    elif name == "inject":
        r = qa.inject(a["ev"])
    elif name == "fn":
        r = qa.fn(a["state"], a.get("key", "fn"))
    elif name == "key":
        r = qa.key(a["k"])
    elif name == "say":
        r = qa.say(a["text"], a.get("per_word_ms", 240), a.get("wait_answer", True))
    elif name == "snapshot":
        r = qa.snapshot(a.get("what", "both"), a.get("backdrop"), a.get("name"))
        if a.get("image", True):
            for k in ("panel", "web", "screen"):
                if r.get(k):
                    images.append(r[k])
                    break
    elif name == "state":
        r = qa.state()
    elif name == "events":
        r = qa.events(a.get("n", 50), a.get("levels", False))
    elif name == "scenes":
        r = qa.scenes(a.get("only"), a.get("backdrops") or ["dark"], None, a.get("at"), a.get("what", "both"))
        if a.get("image", True) and r["sheets"]:
            images.append(r["sheets"][0])
        r = {"dir": r["dir"], "sheets": r["sheets"],
             "scenes": [{"id": s["id"], "backdrop": s["backdrop"], "shots": [sh.get("panel") or sh.get("screen") for sh in s["shots"]]} for s in r["scenes"]]}
    elif name == "list_scenes":
        sc, _ = qa.all_scenes()
        r = [{"id": s["id"], "spec": s["spec"], "label": s["label"]} for s in sc]
    elif name == "play":
        r = qa.play(a["events"], a.get("shots", []), a.get("name", "play"), a.get("backdrop"))
    elif name == "reset":
        r = qa.reset()
    else:
        raise qa.QAError("unknown tool %s" % name)
    content = [{"type": "text", "text": json.dumps(r, ensure_ascii=False)}]
    for p in images:
        b = image_block(p)
        if b:
            content.append(b)
    return content


def reply(id_, result=None, error=None):
    m = {"jsonrpc": "2.0", "id": id_}
    if error is not None:
        m["error"] = error
    else:
        m["result"] = result
    sys.stdout.write(json.dumps(m) + "\n")
    sys.stdout.flush()


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        method, id_ = msg.get("method"), msg.get("id")
        if id_ is None:
            continue   # a notification (initialized, cancelled)
        if method == "initialize":
            reply(id_, {"protocolVersion": msg.get("params", {}).get("protocolVersion", "2025-06-18"),
                        "capabilities": {"tools": {}}, "serverInfo": {"name": "ambient-qa", "version": "0.1.0"}})
        elif method == "ping":
            reply(id_, {})
        elif method == "tools/list":
            reply(id_, {"tools": [{"name": n, "description": d, "inputSchema": {"type": "object", "properties": p, "required": r}} for n, d, p, r in TOOLS]})
        elif method == "tools/call":
            p = msg.get("params", {})
            try:
                reply(id_, {"content": run(p.get("name"), p.get("arguments") or {})})
            except qa.QAError as e:
                reply(id_, {"content": [{"type": "text", "text": "ambient-qa: %s" % e}], "isError": True})
            except Exception as e:   # noqa: BLE001 - one tool's bug must not kill the server
                reply(id_, {"content": [{"type": "text", "text": "ambient-qa: %s\n%s" % (e, traceback.format_exc()[-1500:])}], "isError": True})
        else:
            reply(id_, error={"code": -32601, "message": "no method %s" % method})


if __name__ == "__main__":
    main()
