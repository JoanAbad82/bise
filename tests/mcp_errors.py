#!/usr/bin/env python3
"""A failed MCP tool call tells the model what to fix: the kind of
failure, the server's own words (bounded, secrets redacted), and, when
its arguments may be the cause, what it sent, the tool's parameters and
a check of the arguments against the tool's input schema
(runtime/mcp-pure.bend's words, runtime/mcp-args.bend's hint).

The user's agent got only "program call failed: Error calling tool
'search_files'" from tools.google_drive_mcp.search_files: the connector
gateway answers a failed tool with isError and those words alone (its
errors are masked), and bise passed them on with nothing else: no tool,
no arguments, no parameters. JSON-RPC errors lost their code and data,
and an HTTP body was cut at 200 characters.

The probe (tests/mcp_retry_probe.bend, compiled native) runs mcp_call
against tests/fake_mcp_http.py, one failure per kind:

1. tool error: isError with masked words, arguments that match the
   schema: the words, what was sent, the parameters, "match its schema"
2. bad arguments (isError): an unknown parameter, a wrong type, a
   missing required one, each named
3. bad arguments (JSON-RPC -32602): the code, the message, its data, the
   parameters
4. auth (HTTP 401): the server's words, a Bearer token in them redacted
5. not found (JSON-RPC -32601)
6. rate limit (HTTP 429): retried, then said
7. server error (HTTP 500): the words, long ones bounded
8. timeout (HTTP 504)
9. network: nothing listens (the kind in front of the old words)
10. a tool error the words call auth (isError "permission denied")

python3 -u tests/mcp_errors.py
"""
import json, os, shutil, socket, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wait  # noqa: E402
from mcp_retry import control, free_port  # noqa: E402
FAILS = []

SEARCH = {"type": "object", "additionalProperties": False, "properties": {
    "query": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "The search query."},
    "page_size": {"anyOf": [{"type": "integer"}, {"type": "null"}]}}}
GET_FILE = {"type": "object", "additionalProperties": False, "required": ["file_id"],
            "properties": {"file_id": {"type": "string", "description": "The file's id."}}}
ECHO = {"type": "object", "properties": {"text": {"type": "string"}}}


def check(cond, what):
    print(("ok   " if cond else "FAIL ") + what)
    if not cond:
        FAILS.append(what)


def call(exe, tmp, url, tool, args):
    home = os.path.join(tmp, "home")
    os.makedirs(home, exist_ok=True)
    index = os.path.join(tmp, "index.txt")
    with open(index, "w") as f:
        for t, schema in (("echo", ECHO), ("search", SEARCH), ("get_file", GET_FILE),
                          ("fail_text", ECHO), ("nope", None)):
            f.write("%s fake %s : #%s%s\n" % (url, t, t, " | input: " + json.dumps(schema) if schema else ""))
    env = {"PATH": os.environ.get("PATH", ""), "HOME": home, "BEND_MCP_INDEX": index,
           "PROBE_TOOL": tool, "PROBE_ARGS": json.dumps(args)}
    out = subprocess.run([exe], env=env, capture_output=True, text=True, timeout=120).stdout
    status, _, text = out.partition("\n")
    return status.strip(), text.strip()


def run(exe, tmp, port):
    url = "http://127.0.0.1:%d/mcp" % port
    host = "127.0.0.1:%d" % port

    # 1. the screenshot's case: masked words, arguments that fit
    st, text = call(exe, tmp, url, "fake.search", {"query": "title contains 'x'", "page_size": 8})
    print("     " + text)
    check(st == "err" and text.startswith(
        "mcp tool error (tool error): fake.search (%s) answered: Error calling tool 'search'. "
        "sent: {\"query\": \"title contains 'x'\", \"page_size\": 8}. "
        "its parameters: page_size (integer|null); query (string|null): The search query. "
        "your arguments match its schema: look at their values" % host),
        "tool error: kind, words, sent, parameters, the check %r" % text)

    # 2. bad arguments the check finds (isError)
    st, text = call(exe, tmp, url, "fake.search", {"q": "x", "page_size": "8"})
    print("     " + text)
    check(st == "err" and text.startswith("mcp tool error (bad arguments): fake.search"),
          "bad arguments (isError): the kind %r" % text)
    check("page_size is string, it wants integer|null" in text and "unknown parameter q" in text,
          "bad arguments (isError): the wrong type and the unknown parameter named %r" % text)
    st, text = call(exe, tmp, url, "fake.get_file", {})
    check(st == "err" and "missing required file_id" in text
          and "file_id (string, required): The file's id." in text,
          "bad arguments (isError): the missing required one, and its parameter %r" % text)

    # 3. bad arguments (JSON-RPC -32602 with data)
    control(port, "fail_call", count=1, rpc={"code": -32602, "message": "Invalid params",
                                             "data": {"page_size": "must be <= 100"}})
    st, text = call(exe, tmp, url, "fake.search", {"query": "x", "page_size": 500})
    print("     " + text)
    check(st == "err" and text.startswith(
        "mcp call failed (bad arguments): fake.search (%s), tools/call: %s answered an error (code -32602): "
        "Invalid params data: {\"page_size\":\"must be <= 100\"}." % (host, host)),
        "bad arguments (rpc): code, message, data %r" % text)
    check("its parameters: page_size (integer|null)" in text and "match its schema" in text,
          "bad arguments (rpc): the parameters and the check %r" % text)

    # 4. auth: the words, a token in them redacted
    control(port, "fail_call", count=1, status=401,
            body=json.dumps({"error": {"message": "token expired for Bearer sk-abcdefghijklmnopqrstuvwxyz0123 (api_key=hunter2hunter2)"}}))
    st, text = call(exe, tmp, url, "fake.echo", {"text": "a"})
    print("     " + text)
    check(st == "err" and text.startswith(
        "mcp call failed (auth): fake.echo (%s), tools/call: %s answered HTTP 401: token expired for Bearer [redacted] (api_key=[redacted]" % (host, host)),
        "auth: kind, words, redacted %r" % text)
    check("sk-abc" not in text and "hunter2" not in text and "its parameters" not in text,
          "auth: no secret, no parameters %r" % text)

    # 5. not found
    control(port, "fail_call", count=1, rpc={"code": -32601, "message": "Unknown tool: echo"})
    st, text = call(exe, tmp, url, "fake.echo", {"text": "a"})
    check(st == "err" and text.startswith("mcp call failed (not found): fake.echo (%s), tools/call: %s answered an error (code -32601): Unknown tool: echo." % (host, host)),
          "not found: %r" % text)

    # 6. rate limit: retried (it never ran), then said
    control(port, "fail_call", count=3, status=429, body='{"error":"Too many requests, retry in 30 s"}')
    st, text = call(exe, tmp, url, "fake.echo", {"text": "a"})
    check(st == "err" and text.startswith("mcp call failed (rate limit): fake.echo (%s), tools/call: %s answered HTTP 429: Too many requests, retry in 30 s." % (host, host))
          and "retried 2 times" in text, "rate limit: %r" % text)

    # 7. server error: the words whole up to 1500 characters, then cut
    long = "boom " * 600
    control(port, "fail_call", count=1, status=500, body=json.dumps({"message": long}))
    st, text = call(exe, tmp, url, "fake.echo", {"text": "a"})
    said = text.split("answered HTTP 500: ", 1)[-1]
    check(st == "err" and text.startswith("mcp call failed (server error): fake.echo") and said.startswith("boom boom"),
          "server error: kind and words %r" % text[:200])
    check("…" in said and 1400 < len(said.split("…")[0]) <= 1500, "server error: the words bounded at 1500 (%d)" % len(said.split("…")[0]))

    # 8. timeout
    control(port, "fail_call", count=1, status=504, body='{"error":"upstream timed out"}')
    st, text = call(exe, tmp, url, "fake.echo", {"text": "a"})
    check(st == "err" and text.startswith("mcp call failed (timeout): fake.echo (%s), tools/call: %s answered HTTP 504: upstream timed out." % (host, host)),
          "timeout: %r" % text)

    # 9. network: nothing listens
    dead = free_port()
    st, text = call(exe, tmp, "http://127.0.0.1:%d/mcp" % dead, "fake.echo", {"text": "a"})
    check(st == "err" and text.startswith("mcp call failed (network): fake.echo (127.0.0.1:%d), initialize: cannot reach" % dead),
          "network: %r" % text)

    # 10. a tool's own words tell the kind
    st, text = call(exe, tmp, url, "fake.fail_text", {"text": "Permission denied: the file is private"})
    check(st == "err" and text.startswith("mcp tool error (auth): fake.fail_text (%s) answered: Permission denied: the file is private." % host),
          "tool error told auth by its words %r" % text)

    # a call that works is untouched
    st, text = call(exe, tmp, url, "fake.echo", {"text": "hi"})
    check(st == "ok" and text.startswith("echo:hi"), "a good call answers as before %r" % text)

    print("PASS mcp_errors" if not FAILS else "FAIL mcp_errors (%d)" % len(FAILS))
    return 1 if FAILS else 0


def main():
    bend = shutil.which("bend") or os.path.expanduser("~/.bend/bin/bend")
    if not os.path.exists(bend):
        print("SKIP mcp_errors: no bend compiler")
        return 0
    tmp = tempfile.mkdtemp(prefix="sb-mcp-errors-")
    exe = os.path.join(tmp, "probe")
    c = subprocess.run([bend, "mcp_retry_probe.bend", "-o", exe], cwd=HERE, capture_output=True, text=True)
    if not os.path.exists(exe):
        print("FAIL mcp_errors: the probe did not compile\n" + c.stdout[-2000:] + c.stderr[-2000:])
        return 1
    port_file = os.path.join(tmp, "port")
    srv = subprocess.Popen([sys.executable, os.path.join(HERE, "fake_mcp_http.py"), "--mode", "streamable",
                            "--port-file", port_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        port = int(wait.until(lambda: open(port_file).read().strip(), 10, "the fake server's port file"))
        return run(exe, tmp, port)
    finally:
        srv.kill()
        srv.wait()
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
