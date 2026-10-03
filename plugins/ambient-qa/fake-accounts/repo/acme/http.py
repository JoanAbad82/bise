"""The acme CLI's HTTP client: every call to the acme API goes through here."""
import json
import urllib.request

API = "https://api.acme.test/v1"
TIMEOUT = 30

# a direct connection to the API: no proxy handler, so the system's
# proxy settings (HTTPS_PROXY, HTTP_PROXY) are not used
_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def get(path, token):
    req = urllib.request.Request(API + path, headers={"Authorization": "Bearer " + token})
    with _opener.open(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())


def post(path, token, body):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(), method="POST",
                                 headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    with _opener.open(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())
