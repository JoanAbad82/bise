"""`acme sync`: pulls the team's plans from the API into the local cache."""
import json
import os

from acme import http

CACHE = os.path.expanduser("~/.acme/cache.json")


def sync(token):
    plans = http.get("/plans", token)
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with open(CACHE, "w") as f:
        json.dump(plans, f)
    return len(plans.get("items", []))
