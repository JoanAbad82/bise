#!/usr/bin/env python3
"""The world's `gh` (ambient-lead m_10397): first on the world hubs' PATH, so the hub's PR poller
(rust/switchboard/src/forge/github.rs) reads fake PRs and never his gh, his login or the network.

    fake_gh.py <world> <gh args...>      (world.py writes <world>/bin/gh calling it)

It answers what the hub asks, with the exact shapes github.rs parses:
  gh auth status --hostname <host>          logged in (exit 0)
  gh api graphql -f query=<query>           the PR query (aliases b0, b1... per branch) or a PR's
                                            activity query (pullRequest(number: N))
  gh run view <id> --log-failed -R <repo>   a failed job's log lines (job<TAB>step<TAB>line)
  gh api repos/<o>/<n>/branches/<b> ...     not protected ('false'); .../rules/branches/<b>: none
Anything else (pr merge included) exits 1 and says so. Every call is logged to <world>/gh.log.
The PRs of repo owner/name are <world>/prs-<project>.json (world.fake_gh writes one per project
with an origin): {"owner", "name", "prs": [{number, branch, title, draft, review, rollup, checks:
[{name, status, conclusion, log?}], reviews: [{state, author, body}]}]}; a repo it doesn't know
has no PRs.
"""
import glob
import json
import os
import re
import sys
import time


def node(pr, owner):
    """A pullRequests node as github.rs FIELDS asks it."""
    contexts = [{"__typename": "CheckRun", "name": c["name"], "status": c.get("status", "COMPLETED"),
                 "conclusion": c.get("conclusion")} for c in pr.get("checks", [])]
    reviews = [{"state": r["state"], "author": {"login": r["author"]}} for r in pr.get("reviews", [])]
    return {
        "number": pr["number"], "url": "https://github.com/%s/pull/%d" % (owner, pr["number"]),
        "state": "OPEN", "isDraft": bool(pr.get("draft")), "reviewDecision": pr.get("review"),
        # head and merge_state: a ready-to-merge PR (as-he-does' merge card: its place's tip, CLEAN)
        "headRefName": pr["branch"], "headRefOid": pr.get("head", "0" * 40), "updatedAt": pr.get("updated", "2026-10-07T08:00:00Z"),
        "headRepositoryOwner": {"login": owner.split("/")[0]}, "title": pr.get("title", ""),
        "additions": pr.get("additions", 12), "deletions": pr.get("deletions", 3),
        "mergeStateStatus": pr.get("merge_state", "BLOCKED"), "total": {"totalCount": pr.get("commits", 1)},
        "latestReviews": {"nodes": reviews},
        "commits": {"nodes": [{"commit": {"statusCheckRollup": {"state": pr.get("rollup"), "contexts": {
            "totalCount": len(contexts), "nodes": contexts}} if pr.get("rollup") else None}}]},
    }


def prs_query(q, data):
    repo = {"squashMergeAllowed": True, "mergeCommitAllowed": True, "rebaseMergeAllowed": False}
    by = {p["branch"]: p for p in data["prs"]}
    owner = "%s/%s" % (data["owner"], data["name"])
    for alias, branch in re.findall(r'(b\d+): pullRequests\(headRefName: ("(?:[^"\\]|\\.)*")', q):
        b = json.loads(branch)
        repo[alias] = {"nodes": [node(by[b], owner)] if b in by else []}
    return {"data": {"repository": repo}}


def activity_query(n, data):
    pr = next((p for p in data["prs"] if p["number"] == n), None)
    if pr is None:
        return {"data": {"repository": {"pullRequest": None}}}
    who = lambda a: {"authorAssociation": "MEMBER", "author": {"login": a, "__typename": "User"}}  # noqa: E731
    reviews = [dict(who(r["author"]), databaseId=9000 + i, state=r["state"], body=r.get("body", ""),
                    submittedAt="2026-10-07T08:%02d:00Z" % i, commit={"oid": "0" * 40})
               for i, r in enumerate(pr.get("reviews", []))]
    checks = [{"__typename": "CheckRun", "name": c["name"], "conclusion": c.get("conclusion"),
               "detailsUrl": "https://github.com/%s/%s/actions/runs/%d" % (data["owner"], data["name"], 7000 + pr["number"]),
               "checkSuite": {"workflowRun": {"databaseId": 7000 + pr["number"]}}} for c in pr.get("checks", [])]
    return {"data": {"repository": {"pullRequest": {
        "reviews": {"nodes": reviews}, "reviewThreads": {"nodes": []}, "comments": {"nodes": []},
        "commits": {"nodes": [{"commit": {"statusCheckRollup": {"contexts": {"nodes": checks}}}}]}}}}}


def run_log(run, data):
    pr = next((p for p in data["prs"] if 7000 + p["number"] == run), None)
    out = []
    for c in (pr or {}).get("checks", []):
        if c.get("conclusion") == "FAILURE":
            out += ["%s\trun tests\t%s" % (c["name"], line) for line in c.get("log", ["FAIL: 1 test failed"])]
    return "\n".join(out) + ("\n" if out else "")


def repo_data(world, q, args):
    """The PRs of the repo the call is about: the query's repository(owner, name), or run view's -R."""
    m = re.search(r'repository\(owner: ("(?:[^"\\]|\\.)*"), name: ("(?:[^"\\]|\\.)*")\)', q)
    owner, name = (json.loads(m.group(1)), json.loads(m.group(2))) if m else (None, None)
    if "-R" in args and args.index("-R") + 1 < len(args):
        parts = args[args.index("-R") + 1].strip("/").split("/")     # [host/]owner/name
        if len(parts) >= 2:
            owner, name = parts[-2], parts[-1]
    for f in sorted(glob.glob(os.path.join(world, "prs-*.json"))):
        d = json.load(open(f))
        if d["owner"] == owner and d["name"] == name:
            return d
    return {"owner": owner or "", "name": name or "", "prs": []}


def main(argv):
    world, args = argv[1], argv[2:]
    with open(os.path.join(world, "gh.log"), "a") as f:
        f.write("%s %s\n" % (time.strftime("%H:%M:%S"), json.dumps([a[:160] for a in args])))
    if args[:2] == ["auth", "status"]:
        return 0
    q = next((a[len("query="):] for a in args if a.startswith("query=")), "")
    if args[:2] == ["api", "graphql"]:
        data = repo_data(world, q, args)
        m = re.search(r"pullRequest\(number: (\d+)\)", q)
        print(json.dumps(activity_query(int(m.group(1)), data) if m else prs_query(q, data)))
        return 0
    if args[:1] == ["api"] and len(args) > 1 and args[1].startswith("repos/"):
        # the hub's flow detection (devflow): main isn't protected and has no rules
        if "/rules/branches/" in args[1]:
            return 0
        if "/branches/" in args[1]:
            print("false")
            return 0
    if args[:2] == ["run", "view"] and len(args) > 2:
        sys.stdout.write(run_log(int(args[2]), repo_data(world, q, args)))
        return 0
    sys.stderr.write("the world's fake gh doesn't do: gh %s\n" % " ".join(args[:3]))
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
