#!/usr/bin/env python3
"""try_procs: a try home's hubs and processes (their sockets, stop_hub on one, every pid under the
home). Split out of scripts/desktop_try.py (its line cap); desktop_try imports them."""
import os
import socket
import subprocess


def hub_socks(tryh):
    hubs = os.path.join(tryh, "hubs")
    return [os.path.join(hubs, d, "hub.sock") for d in sorted(os.listdir(hubs))] if os.path.isdir(hubs) else []


def stop_hub(sock, timeout=2.0):
    try:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect(sock)
        s.sendall(b'{"op":"hello"}\n{"op":"stop_hub"}\n')
        s.close()
        return True
    except OSError:
        return False


def try_pids(tryh):
    """Every process of the try home: its args name a path under it (its hubs' sbd --workspace,
    the app's core), found by pid, never by name."""
    out = subprocess.run(["ps", "-axww", "-o", "pid=,args="], capture_output=True, text=True).stdout
    me = os.getpid()
    pids = []
    for l in out.splitlines():
        pid, _, args = l.strip().partition(" ")
        if pid.isdigit() and int(pid) != me and (tryh + "/") in args and "desktop_try" not in args:
            pids.append(int(pid))
    return pids
