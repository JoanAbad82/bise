#!/usr/bin/env python3
"""Issue 21: a call to a tool bise does not have gets an answer that names
it and says how to do it here, never an empty result. A real repl-live on
the fake provider, on each live wire family (anthropic, openai-chat,
openai-responses):

A) A bare name that is not one of ours (Vibe's read_file, view, a bare
   cat, an invented open_document): the model reads back a failed result
   "unknown tool: <name> — the tools here are <ours>; read a file with
   bash (cat -n, sed -n) ...".
B) An unknown connector name (group.tool) keeps the connector's own
   answer, which names the call.
C) edit's description sends the model to bash, not to a read_file.
D) In `auto`, a bare unknown name asks no approval (it runs nothing).
"""
import json, os, socket, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, HERE)
import fake_provider as F  # noqa: E402
import wait  # noqa: E402

FAILS = []


def check(ok, what):
    print("%s %s" % ("ok  " if ok else "FAIL", what), flush=True)
    if not ok:
        FAILS.append(what)


OURS = ("the tools here are search_tool_functions, bash, run_typescript, skill, apply_patch, write_file, edit; "
        "read a file with bash (`cat -n <path>`, `sed -n '1,200p' <path>`); connector tools run from "
        "run_typescript (find them with search_tool_functions)")
CASES = ["read_file", "view", "cat", "open_document"]
MODELS = [("anthropic/claude-x", "anthropic"), ("mistral/devstral", "openai-chat"),
          ("openai/gpt-x", "openai-responses")]


def main():
    tmp = os.path.realpath(tempfile.mkdtemp(prefix="sb-unknown-"))
    work = os.path.join(tmp, "work")
    os.makedirs(work)
    target = os.path.join(work, "script.sh")
    open(target, "w").write("".join("echo line %d\n" % i for i in range(119)))
    scripts = os.path.join(tmp, "scripts")
    os.makedirs(scripts)
    for n in CASES + ["gmail.frobnicate"]:
        json.dump({"match": "probe-%s " % n, "calls": [{"tool": n, "arg": {"path": target}}], "reply": "seen " + n},
                  open(os.path.join(scripts, n + ".json"), "w"))
    os.environ["FAKE_SCRIPTS"] = scripts
    os.environ["FAKE_BODIES"] = os.path.join(tmp, "bodies.jsonl")
    F.LOG = os.path.join(tmp, "fake.log")
    srv, fport = F.serve()
    base = "http://127.0.0.1:%d/v1" % fport
    models = os.path.join(tmp, "models.toml")
    open(models, "w").write(
        'version = 1\ndefault_model = "anthropic/claude-x"\n\n'
        '[providers.anthropic]\nname = "Anthropic"\napi = "anthropic"\nbase_url = "%s"\nkey_env = ""\n\n'
        '[providers.mistral]\nname = "Mistral"\napi = "openai-chat"\nbase_url = "%s"\nkey_env = ""\n\n'
        '[providers.openai]\nname = "OpenAI"\napi = "openai-responses"\nbase_url = "%s"\nkey_env = ""\n'
        % (base, base, base))
    cfg = os.path.join(tmp, "config.toml")
    open(cfg, "w").write('model = "anthropic/claude-x"\n')
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    env = {k: v for k, v in os.environ.items() if not k.startswith(("BEND_", "SB_", "BISE_"))}
    env.update(HOME=tmp, TMPDIR=tmp, XDG_STATE_HOME=os.path.join(tmp, "state"), BISE_MODELS_FILE=models,
               BEND_CONFIG=cfg, BEND_REPL_PORT=str(port), BEND_SESSION_FILE=os.path.join(tmp, "session.txt"),
               BEND_WIRE_LOG=os.path.join(tmp, "wire.log"), BEND_MCP_INDEX=os.path.join(tmp, "mcp.txt"),
               BEND_SKILLS_INDEX=os.path.join(tmp, "sk.txt"), BEND_BG_ROOT=os.path.join(tmp, "bg"),
               BEND_WORKDIR=work, SB_AGENT="probe", BEND_AGENT_RUN=os.path.join(tmp, "run"))
    # the approvals mode: `yolo` for A-C; D sets `auto`, with no hub to
    # answer: a call that asked would wait for ever (the turn times out)
    mode = os.path.join(tmp, "run", "approvals-mode")
    os.makedirs(os.path.join(tmp, "run"))
    open(mode, "w").write("yolo\n")
    log, err = os.path.join(tmp, "repl.log"), os.path.join(tmp, "repl.err")
    repl = subprocess.Popen([os.path.join(ROOT, "repl-live")], cwd=ROOT, env=env,
                            stdout=open(log, "w"), stderr=open(err, "w"))

    def turn(model, text):
        open(cfg, "w").write('model = "%s"\n' % model)
        sock = socket.create_connection(("127.0.0.1", port), timeout=30)
        sock.sendall(("run " + text + "\n").encode())
        f = sock.makefile("rb")
        out = []
        while True:
            try:
                line = f.readline()
            except socket.timeout:
                out.append("TIMEOUT (a gate waits?)")
                break
            if not line:
                break
            out.append(line.decode(errors="replace").rstrip())
            if line.startswith(b"  obs: turn_done"):
                break
        sock.close()
        return out

    def model_reads():
        """the last tool result of the last request, as its family sent it"""
        last = [json.loads(l) for l in open(os.environ["FAKE_BODIES"])][-1]
        tools = [m["text"] for m in F.CONV[last["family"]](last["body"]) if m["role"] == "tool"]
        return last["family"], (tools[-1] if tools else None)

    try:
        wait.until(lambda: repl.poll() is None and "REPL on" in open(log).read(), 60, "the REPL banner")
        # ---- A: tools from other harnesses ----
        for model, family in MODELS:
            for n in CASES:
                turn(model, "probe-%s %s" % (n, model.replace("/", "-")))
                fam, got = model_reads()
                want = "tool %s failed: unknown tool: %s — %s" % (n, n, OURS)
                check(fam == family and got == want, "%s: %s reads %r" % (family, n, got))
        # ---- B: an unknown connector name: the connector's answer, named ----
        for model, family in MODELS:
            turn(model, "probe-gmail.frobnicate %s" % model.replace("/", "-"))
            fam, got = model_reads()
            check(fam == family and got is not None and got.startswith(
                "tool gmail.frobnicate failed: unknown tool: gmail.frobnicate — ")
                and "the tools here are" not in got,
                "%s: gmail.frobnicate reads %r" % (family, got))
        # ---- C: edit's description names bash, not read_file ----
        last = [r for r in map(json.loads, open(F.LOG)) if r.get("family") == "anthropic" and r.get("tools")][-1]
        desc = dict((t[0], t[1]) for t in last["tools"]).get("edit", "")
        check("Read the file with `bash` first" in desc and "You must `read_file`" not in desc,
              "edit's description sends the model to bash: %r" % desc[:120])
        # ---- D: in `auto`, a tool from another harness asks nobody ----
        open(mode, "w").write("auto\n")
        for model, family in MODELS:
            lines = turn(model, "probe-read_file again %s" % model.replace("/", "-"))
            fam, got = model_reads()
            check(not any(l.startswith("gate ") for l in lines) and fam == family and got is not None
                  and got == "tool read_file failed: unknown tool: read_file — " + OURS,
                  "%s: auto: read_file asks no approval, reads %r" % (family, got))
    finally:
        repl.kill()
        srv.shutdown()
    if FAILS:
        print("FAIL %d check(s); logs in %s" % (len(FAILS), tmp))
        sys.exit(1)
    print("PASS unknown_tool_e2e")


if __name__ == "__main__":
    main()
