#!/usr/bin/env python3
"""/debug completion shows the body sent, byte for byte (debug-cmd,
architect m_34601).

A real repl-live on the fake provider, once per family (anthropic,
openai-chat, openai-responses), with its request ring in a folder
(BEND_WIRE_DUMP, bend/runtime/reqlog.bend). One turn whose message holds
non-ASCII text, then:

A) the ring holds the call: a slot whose .meta is there and whose
   lengths match its .json and .wire (bise_session::reqlog's rule);
B) the slot's .json is the body the provider received, byte for byte
   (the fake writes each body's bytes to $FAKE_RAW);
C) the render mode (BISE_RENDER, bend/runtime/render.bend) on that
   slot's .wire, for the same model, writes the same bytes: the body
   /debug completion <provider> shows comes out of Pv.request_body,
   never a second encoder;
D) the same .wire rendered for another family's model is that family's
   body (its own top-level keys), with no call made.
"""
import json, os, socket, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, HERE)
import fake_provider as F  # noqa: E402
import wait  # noqa: E402

FAILS = []
FAMILIES = {"anthropic": "fake/claude-x", "openai-chat": "fakechat/gpt-x", "openai-responses": "fakeresp/gpt-r"}
# a top-level key only that family's body has
OWN_KEY = {"anthropic": "system", "openai-chat": "messages", "openai-responses": "input"}


def check(ok, what):
    print("%s %s" % ("ok  " if ok else "FAIL", what), flush=True)
    if not ok:
        FAILS.append(what)


def models_toml(fport):
    out = ['version = 1\ndefault_model = "fake/claude-x"\n']
    for fam, full in FAMILIES.items():
        prov, model = full.split("/")
        out.append('[providers.%s]\nname = "%s"\napi = "%s"\nbase_url = "http://127.0.0.1:%d/v1"\nkey_env = ""\n'
                   '[models."%s"]\nwindow = 200000\n' % (prov, prov, fam, fport, full))
    return "\n".join(out)


def slots(d):
    """the ready slots of a ring folder: (n, meta), in write order"""
    out = []
    for name in os.listdir(d):
        if not name.endswith(".meta"):
            continue
        n = name[:-5]
        p = os.path.join(d, name)
        try:
            m = json.loads(open(p).read())
        except ValueError:
            continue
        j, w = os.path.join(d, n + ".json"), os.path.join(d, n + ".wire")
        if os.path.getsize(j) == m["json_len"] and os.path.getsize(w) == m["wire_len"]:
            out.append((os.path.getmtime(p), n, m))
    return [(n, m) for _, n, m in sorted(out)]


def main():
    tmp = tempfile.mkdtemp(prefix="sb-reqlog-")
    F.LOG = os.path.join(tmp, "fake.log")
    open(F.LOG, "w").close()
    raw = os.path.join(tmp, "raw")
    os.makedirs(raw)
    os.environ["FAKE_RAW"] = raw
    srv, fport = F.serve()
    models = os.path.join(tmp, "models.toml")
    open(models, "w").write(models_toml(fport))
    base = {k: v for k, v in os.environ.items() if not k.startswith(("BEND_", "SB_", "BISE_"))}
    procs = []
    try:
        for fam, full in FAMILIES.items():
            ring = os.path.join(tmp, "ring-" + fam) + "/"
            os.makedirs(ring)
            cfg = os.path.join(tmp, fam + ".toml")
            open(cfg, "w").write('model = "%s"\n' % full)
            s = socket.socket()
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
            s.close()
            env = dict(base, HOME=tmp, XDG_STATE_HOME=os.path.join(tmp, "state"), BISE_MODELS_FILE=models,
                       BEND_CONFIG=cfg, BEND_REPL_PORT=str(port),
                       BEND_SESSION_FILE=os.path.join(tmp, fam + "-session.txt"),
                       BEND_WIRE_LOG=os.path.join(tmp, fam + "-wire.log"), BEND_MCP_INDEX=os.path.join(tmp, "mcp.txt"),
                       BEND_SKILLS_INDEX=os.path.join(tmp, "sk.txt"), BEND_BG_ROOT=os.path.join(tmp, "bg"),
                       SB_AGENT="probe", TMPDIR=tmp, BEND_WIRE_DUMP=ring)
            log, err = os.path.join(tmp, fam + ".log"), os.path.join(tmp, fam + ".err")
            p = subprocess.Popen([os.path.join(ROOT, "repl-live")], cwd=ROOT, env=env,
                                 stdout=open(log, "a"), stderr=open(err, "a"))
            procs.append(p)

            def banner():
                assert p.poll() is None, "FAIL the REPL exited: %s" % open(err).read()[-500:]
                return "REPL on" in open(log).read()
            wait.until(banner, 60, "the REPL banner (%s)" % fam)
            before = set(os.listdir(raw))
            sock = socket.create_connection(("127.0.0.1", port), timeout=60)
            sock.sendall("say café → naïve ✓ say hi\n".encode())
            f = sock.makefile("rb")
            while True:
                line = f.readline()
                if not line or line.startswith(b"  obs: turn_done"):
                    break
            sock.close()
            p.terminate()

            got = slots(ring)
            check(len(got) >= 1, "%s A) the ring holds the call: %s" % (fam, [n for n, _ in got]))
            if not got:
                continue
            n, meta = got[-1]
            check(meta["model"] == full and meta["kind"] == "turn",
                  "%s A) the slot's meta names the model and the kind: %s" % (fam, meta))
            body = open(os.path.join(ring, n + ".json"), "rb").read()
            sent = sorted(set(os.listdir(raw)) - before)
            last = open(os.path.join(raw, sent[-1]), "rb").read() if sent else b""
            check(body == last and "café → naïve ✓".encode() in body,
                  "%s B) the slot's .json is the body received, byte for byte (%d bytes)" % (fam, len(body)))

            def render(model, out):
                r = subprocess.run([os.path.join(ROOT, "repl-live")], cwd=ROOT, capture_output=True, text=True,
                                   timeout=60, env=dict(env, BISE_RENDER=os.path.join(ring, n + ".wire"),
                                                        BISE_RENDER_OUT=out, BISE_MODEL=model))
                return r.stdout.strip().splitlines()[-1:] == ["RENDER_OK"], r
            out = os.path.join(tmp, fam + "-render.json")
            calls = len(os.listdir(raw))
            ok, r = render(full, out)
            check(ok and open(out, "rb").read() == body,
                  "%s C) render on the slot's .wire for its own model == the body sent: %s" % (fam, r.stdout[-200:]))
            other = [f for f in FAMILIES if f != fam][0]
            out2 = os.path.join(tmp, fam + "-as-" + other + ".json")
            ok2, r2 = render(FAMILIES[other], out2)
            shape = json.loads(open(out2).read()) if ok2 else {}
            check(ok2 and OWN_KEY[other] in shape and len(os.listdir(raw)) == calls,
                  "%s D) rendered for %s: that family's body, no call made (%s)" % (fam, other, sorted(shape)))
    finally:
        for p in procs:
            if p.poll() is None:
                p.kill()
        srv.shutdown()
    print("PASS" if not FAILS else "FAIL %d: %s" % (len(FAILS), FAILS))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
