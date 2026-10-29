#!/usr/bin/env python3
"""The Bend runtime resolves a name the way the Rust side and curl do.

Every HTTP call of the Bend runtime (provider calls, MCP, web search, the
plugins over vendor/http) resolved names with its own UDP queries to the
nameservers of /etc/resolv.conf and kept the first A record: a gateway whose
name is an alias (CNAME) failed with "cannot resolve ... check your network
or VPN" while curl, the Rust side and `bise auth check` reached it. It now
asks the OS resolver (getaddrinfo, Wire.lookup in vendor/http/effs/wire.c).

The probe (tests/dns_lookup_probe.bend, compiled native) prints Wire.lookup's
addresses and Dns.resolve's answer per name; they must be the ones Python's
socket.getaddrinfo gives (the libc call Rust's ToSocketAddrs makes), IPv4
kept in order for the runtime, and the error path must say "no address".
Offline names only: localhost, an IPv4 literal, a name under .invalid.

python3 -u tests/dns_lookup.py
"""
import os, shutil, socket, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
NAMES = ["localhost", "127.0.0.1", "nothing.invalid"]


def system(name):
    try:
        out = []
        for a in socket.getaddrinfo(name, None, 0, socket.SOCK_STREAM):
            if a[4][0] not in out:
                out.append(a[4][0])
        return out
    except socket.gaierror:
        return None


def main():
    bend = shutil.which("bend") or os.path.expanduser("~/.bend/bin/bend")
    if not os.path.exists(bend):
        print("SKIP dns_lookup: no bend compiler")
        return 0
    tmp = tempfile.mkdtemp(prefix="sb-dns-lookup-")
    exe = os.path.join(tmp, "probe")
    c = subprocess.run([bend, "dns_lookup_probe.bend", "-o", exe], cwd=HERE, capture_output=True, text=True)
    if not os.path.exists(exe):
        print("FAIL dns_lookup: the probe did not compile\n" + c.stdout[-2000:] + c.stderr[-2000:])
        return 1
    lines = subprocess.run([exe] + NAMES, capture_output=True, text=True, timeout=60).stdout.splitlines()
    shutil.rmtree(tmp, ignore_errors=True)
    got = {}
    for line in lines:
        name, _, rest = line.partition(" ")
        got.setdefault(name, []).append(rest)
    fails = []
    for name in NAMES:
        want = system(name)
        raw, cooked = (got.get(name, []) + ["", ""])[:2]
        if want is None:
            if not raw.startswith("fail 1 ") or not cooked.startswith("resolve: the system resolver has no address for it ("):
                fails.append("%s: want no address (code 1), got %r / %r" % (name, raw, cooked))
            continue
        if raw != "ok " + ",".join(want):
            fails.append("%s: Wire.lookup %r, the system resolver %r" % (name, raw, want))
        v4 = [a for a in want if ":" not in a]
        if cooked != "resolve " + ",".join(v4):
            fails.append("%s: Dns.resolve %r, want the IPv4 ones %r" % (name, cooked, v4))
    for f in fails:
        print("FAIL " + f)
    print("PASS dns_lookup" if not fails else "FAIL dns_lookup")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
