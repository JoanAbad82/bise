"""A dependency-free stdio MCP server for the hello-plugin fixture.

One tool, `shout`: returns the text upper-cased with a marker, and
counts the calls in $HELLO_STATE (under ${PLUGIN_DATA}).

The tools cache's fakes (bend_plugins::tools_cache): more tools named in
$HELLO_TOOLS (its list depends on an env value) and in the file
$HELLO_TOOLS_FILE (read at each list and call: a list that changes under
a cache); $HELLO_GROW: after a call, a tool `grown` for this session and
a `notifications/tools/list_changed`. A call to a tool it does not list,
or without `text`, is answered -32602 (InvalidParams), like the SDKs.
"""
import json
import os
import sys


def send(msg):
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()


TOOL = {
    "name": "shout",
    "description": "Upper-case a text and tag it with the hello-plugin marker.",
    "inputSchema": {
        "type": "object",
        "properties": {"text": {"type": "string"}},
        "required": ["text"],
    },
}

grown = False


def names_of(text):
    return [n.strip() for n in text.split(",") if n.strip()]


def tools():
    names = names_of(os.environ.get("HELLO_TOOLS", ""))
    path = os.environ.get("HELLO_TOOLS_FILE")
    if path:
        try:
            with open(path) as f:
                names += names_of(f.read())
        except OSError:
            pass
    if grown:
        names.append("grown")
    return [TOOL] + [dict(TOOL, name=n, description="Like shout: " + n) for n in names]


for line in sys.stdin:
    try:
        msg = json.loads(line)
    except ValueError:
        continue
    mid, method = msg.get("id"), msg.get("method")
    if mid is None:
        continue
    if method == "initialize":
        send({"jsonrpc": "2.0", "id": mid, "result": {
            "protocolVersion": msg.get("params", {}).get("protocolVersion", "2025-06-18"),
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "hello-plugin-echo", "version": "0.1.0"}}})
    elif method == "tools/list":
        send({"jsonrpc": "2.0", "id": mid, "result": {"tools": tools()}})
    elif method == "tools/call":
        params = msg.get("params", {})
        name = params.get("name")
        if name not in [t["name"] for t in tools()]:
            send({"jsonrpc": "2.0", "id": mid,
                  "error": {"code": -32602, "message": "Unknown tool: " + str(name)}})
            continue
        if "text" not in params.get("arguments", {}):
            send({"jsonrpc": "2.0", "id": mid,
                  "error": {"code": -32602, "message": "Invalid arguments: text is required"}})
            continue
        # HELLO_NAP: seconds a call takes (the bridge's tool_timeout_sec tests)
        if os.environ.get("HELLO_NAP"):
            import time
            time.sleep(float(os.environ["HELLO_NAP"]))
        text = str(msg.get("params", {}).get("arguments", {}).get("text", ""))
        state = os.environ.get("HELLO_STATE")
        n = 0
        if state:
            try:
                with open(state) as f:
                    n = int(f.read().strip() or 0)
            except (OSError, ValueError):
                n = 0
            n += 1
            with open(state, "w") as f:
                f.write(str(n))
        send({"jsonrpc": "2.0", "id": mid, "result": {
            "content": [{"type": "text", "text": "HELLO-PLUGIN:" + text.upper() + " (call " + str(n) + ")"}],
            "isError": False}})
        if os.environ.get("HELLO_GROW") and not grown:
            grown = True
            send({"jsonrpc": "2.0", "method": "notifications/tools/list_changed"})
    else:
        send({"jsonrpc": "2.0", "id": mid,
              "error": {"code": -32601, "message": "unknown method " + str(method)}})
