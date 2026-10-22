# hub/land.bend — what `sb land` takes and names, and its line (issue 37
# #3, dev-flow §5, issue 12 for the pick). Pure.
# git stays in Rust (status, commit, rebase, push): it gives the facts (a
# place's changes against its tip, the agent's claims, conflict blocks
# found in the files it would take); this module owns what a land takes,
# what it names, its refusals before its turn, and the line of lands per
# target. The land check (issue 28, land_check.rs) is not moved here: sb
# land loses it (Gabriel, main m_37342).
#
# The line and the claims are runtime state (R): fresh at boot, never
# journaled nor photographed. No land input changes St or writes a
# journal line. After a core restart the shell gives them back
# (land_live) before any other land input.
import Base

import ../vendor/json.bend as J
import ./gen/kit.bend as K

import ./lazy.bend as LZ
import ./model.bend as M
import ./feature.bend as FT
import ./gen/state.bend as S

# More unclaimed changes than this in a worktree are not swept in on
# their own (build output git does not ignore): the land says so.
def SWEEP_MAX() -> Nat:
  200n

# ---- a change of `git status` against the tip: {path, from, recent} ----
# path relative to the place's folder, a nested repo ends with `/`; from:
# a staged rename's old path ("" none); recent: written since the agent
# started (a deleted file, an unknown time: yes).

def c.path(+c: J.Json) -> String:
  K.get_s(c, "path")

def c.repo(+c: J.Json) -> Bool:
  String.ends_with(c.path(c), "/")

def c.recent(+c: J.Json) -> Bool:
  K.get_b(c, "recent")

def c.paths.of(+p: String, +f: String) -> List<&2, String>:
  Bool.pick(List<&2, String>, String.is_empty(f), [p], [p, f])

def c.paths(+c: J.Json) -> List<&2, String>:
  c.paths.of(c.path(c), K.get_s(c, "from"))

# any of `xs` in `ys`
def any_in(xs: List<&2, String>, +ys: List<&2, String>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(M.str_in(ys, h), u => any_in(t, ys))

# another agent of the place claims `p` (others: {name, files})
def theirs(os: List<&2, J.Json>, +p: String) -> Bool:
  match os:
    case Nil{}:
      False{}
    case Con{+o, +t}:
      LZ.or(M.str_in(K.get_ss(o, "files"), p), u => theirs(t, p))

def any_theirs(ps: List<&2, String>, +os: List<&2, J.Json>) -> Bool:
  match ps:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(theirs(os, h), u => any_theirs(t, os))

# the names of the other agents that claim `f`
def who(os: List<&2, J.Json>, +f: String) -> List<&2, String>:
  match os:
    case Nil{}:
      Nil{}
    case Con{+o, +t}:
      +r = who(t, f)
      Bool.pick(List<&2, String>, M.str_in(K.get_ss(o, "files"), f), K.get_s(o, "name") <> r, r)

# `p` less its trailing `/`s
def trim_slash.go(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{+h, +t}:
      LZ.pick(String, Char.is_eq(h, '/'), u => trim_slash.go(t), u => SCon{h, t})

def trim_slash(s: String) -> String:
  String.reverse(trim_slash.go(String.reverse(s)))

def under(ps: List<&2, String>, +p: String) -> Bool:
  match ps:
    case Nil{}:
      False{}
    case Con{+x, +t}:
      LZ.or(String.eq(p, ".") || String.starts_with(x, String.concat([p, "/"])), u => under(t, p))

# `sb land --add <rel>` takes change `c`: its path exactly, or a change
# under that folder no other agent claims (`.`: every one); never a repo
def adds(+c: J.Json, +rel: String, +os: List<&2, J.Json>) -> Bool:
  +p = trim_slash(rel)
  Bool.not(c.repo(c)) && (M.str_in(c.paths(c), p) || (under(c.paths(c), p) && Bool.not(any_theirs(c.paths(c), os))))

def adds_any(as: List<&2, J.Json>, +c: J.Json, +os: List<&2, J.Json>) -> Bool:
  match as:
    case Nil{}:
      False{}
    case Con{+a, +t}:
      LZ.or(adds(c, K.get_s(a, "rel"), os), u => adds_any(t, c, os))

def claimed(+c: J.Json, +files: List<&2, String>, +as: List<&2, J.Json>, +os: List<&2, J.Json>) -> Bool:
  LZ.or(any_in(c.paths(c), files), u => adds_any(as, c, os))

def hits(cs: List<&2, J.Json>, +rel: String, +os: List<&2, J.Json>) -> Bool:
  match cs:
    case Nil{}:
      False{}
    case Con{+c, +t}:
      LZ.or(adds(c, rel, os), u => hits(t, rel, os))

# the first --add that takes no change: its words
def bad_add(as: List<&2, J.Json>, +cs: List<&2, J.Json>, +os: List<&2, J.Json>) -> Maybe<&2, String>:
  match as:
    case Nil{}:
      None{}
    case Con{+a, +t}:
      LZ.pick(Maybe<&2, String>, hits(cs, K.get_s(a, "rel"), os),
        u => bad_add(t, cs, os),
        u => Some{String.concat(["--add ", K.get_s(a, "arg"), ": no new or changed file there"])})

# ---- the three lists of a pick, in the changes' order ----

# the claimed changes' paths (a rename: both)
def mine0(cs: List<&2, J.Json>, +files: List<&2, String>, +as: List<&2, J.Json>, +os: List<&2, J.Json>) -> List<&2, String>:
  match cs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      +r = mine0(t, files, as, os)
      Bool.pick(List<&2, String>, Bool.not(c.repo(c)) && claimed(c, files, as, os), List.append(&2, String, c.paths(c), r), r)

# the changes nobody claims: not a repo, not claimed, no other agent's
def unclaimed(cs: List<&2, J.Json>, +files: List<&2, String>, +as: List<&2, J.Json>, +os: List<&2, J.Json>) -> List<&2, J.Json>:
  match cs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      +r = unclaimed(t, files, as, os)
      Bool.pick(List<&2, J.Json>, Bool.not(c.repo(c)) && Bool.not(claimed(c, files, as, os)) && Bool.not(any_theirs(c.paths(c), os)), c <> r, r)

# the nested repos named: alone every one, else the recent ones
def repos(cs: List<&2, J.Json>, +alone: Bool) -> List<&2, String>:
  match cs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      +r = repos(t, alone)
      Bool.pick(List<&2, String>, c.repo(c) && (alone || c.recent(c)), c.path(c) <> r, r)

def all_paths(cs: List<&2, J.Json>) -> List<&2, String>:
  match cs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      List.append(&2, String, c.paths(c), all_paths(t))

def recent_paths(cs: List<&2, J.Json>) -> List<&2, String>:
  match cs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      +r = recent_paths(t)
      Bool.pick(List<&2, String>, c.recent(c), c.path(c) <> r, r)

def first_paths(n: Nat, cs: List<&2, J.Json>) -> List<&2, String>:
  match n cs:
    case 0n _:
      Nil{}
    case 1n+p Nil{}:
      Nil{}
    case 1n+p Con{+c, +t}:
      c.path(c) <> first_paths(p, t)

# `xs` less its repeats, the first kept
def nub.go(xs: List<&2, String>, +seen: List<&2, String>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      LZ.pick(List<&2, String>, M.str_in(seen, h), u => nub.go(t, seen), u => h <> nub.go(t, h <> seen))

def nub(xs: List<&2, String>) -> List<&2, String>:
  nub.go(xs, Nil{})

# the first file of `mine` another agent claims too: the refusal
def shared(mine: List<&2, String>, +os: List<&2, J.Json>) -> Maybe<&2, String>:
  match mine:
    case Nil{}:
      None{}
    case Con{+f, +t}:
      +ws = who(os, f)
      LZ.pick(Maybe<&2, String>, Nat.is_eq(List.length(&2, String, ws), 0n),
        u => shared(t, os),
        u => Some{String.concat([f, " is also changed by @", String.join(ws, ", @"), ": not landed, main decides who lands it"])})

def SWEEP_WORDS(+n: Nat, +first: List<&2, String>) -> String:
  String.concat([Nat.show(n), " new or changed files not ignored in the worktree (first: ", String.join(first, ", "), "): add them to .gitignore, or land the ones you want with --add <path>"])

# ---- the answer: {ok, mine, left_out, why} ----

def picked(+mine: List<&2, String>, +left_out: List<&2, String>) -> J.Json:
  J.JObj{[("ok", J.JBool{True{}}), ("mine", J.JArr{K.jstrs(mine)}), ("left_out", J.JArr{K.jstrs(left_out)}), ("why", J.JStr{""})]}

def refused(+why: String) -> J.Json:
  J.JObj{[("ok", J.JBool{False{}}), ("mine", J.JArr{Nil{}}), ("left_out", J.JArr{Nil{}}), ("why", J.JStr{why})]}

def pick.done(m: Maybe<&2, String>, +mine: List<&2, String>, +left_out: List<&2, String>) -> J.Json:
  match m:
    case None{}:
      picked(mine, left_out)
    case Some{+why}:
      refused(why)

# mine is checked against the others' claims last
def pick.mine(+mine: List<&2, String>, +left_out: List<&2, String>, +os: List<&2, J.Json>) -> J.Json:
  pick.done(shared(mine, os), mine, left_out)

def pick.lists(+cs: List<&2, J.Json>, +files: List<&2, String>, +as: List<&2, J.Json>, +os: List<&2, J.Json>, +alone: Bool) -> J.Json:
  +un = unclaimed(cs, files, as, os)
  +n = List.length(&2, J.Json, un)
  LZ.pick(J.Json, alone,
    u => LZ.pick(J.Json, Nat.is_gt(n, SWEEP_MAX()),
      v => refused(SWEEP_WORDS(n, first_paths(3n, un))),
      v => pick.mine(nub(List.append(&2, String, mine0(cs, files, as, os), all_paths(un))), repos(cs, alone), os)),
    u => pick.mine(nub(mine0(cs, files, as, os)), List.append(&2, String, recent_paths(un), repos(cs, alone)), os))

def pick.go(m: Maybe<&2, String>, +cs: List<&2, J.Json>, +files: List<&2, String>, +as: List<&2, J.Json>, +os: List<&2, J.Json>, +alone: Bool) -> J.Json:
  match m:
    case Some{+why}:
      refused(why)
    case None{}:
      pick.lists(cs, files, as, os, alone)

# What a land takes and what it names (issue 12): `cs` the place's whole
# `git status` against its tip; `files` the agent's file-tool files; `as`
# its --add ({arg, rel}); `os` the place's other agents ({name, files});
# `alone`: a worktree no other agent shares. Alone, every change no other
# agent claims is its own (at most SWEEP_MAX unclaimed); elsewhere only
# what it claimed, the other recent changes named. Nested repos are never
# taken, a file another agent claims too is refused.
def pick(+cs: List<&2, J.Json>, +files: List<&2, String>, +as: List<&2, J.Json>, +os: List<&2, J.Json>, +alone: Bool) -> J.Json:
  pick.go(bad_add(as, cs, os), cs, files, as, os, alone)

# a fixture line's input ({changes, files, add, others, alone})
def pick_of(+i: J.Json) -> J.Json:
  pick(K.get_js(i, "changes"), K.get_ss(i, "files"), K.get_js(i, "add"), K.get_js(i, "others"), K.get_b(i, "alone"))

# ---- claims: one land of a place at a time (land-wait) ----
# a claim: {key, since}; key = place, or "place agent" for a --here

def claim_key(+place: String, +agent: String, +here: Bool) -> String:
  Bool.pick(String, here, String.concat([place, " ", agent]), place)

# since when the land of `key` runs, if one does
def in_line(cs: List<&2, J.Json>, +key: String) -> Maybe<&2, Nat>:
  match cs:
    case Nil{}:
      None{}
    case Con{+c, +t}:
      LZ.pick(Maybe<&2, Nat>, String.eq(K.get_s(c, "key"), key), u => Some{K.get_n(c, "since")}, u => in_line(t, key))

def claim(+key: String, +since: Nat) -> J.Json:
  J.JObj{[("key", J.JStr{key}), ("since", J.JNum{since})]}

def unclaim(cs: List<&2, J.Json>, +key: String) -> List<&2, J.Json>:
  match cs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      +r = unclaim(t, key)
      Bool.pick(List<&2, J.Json>, String.eq(K.get_s(c, "key"), key), r, c <> r)

# R's lands: {claims, line}; none at boot
def lands(+claims: List<&2, J.Json>, +line: List<&2, J.Json>) -> J.Json:
  J.JObj{[("claims", J.JArr{claims}), ("line", J.JArr{line})]}

def NONE() -> J.Json:
  lands(Nil{}, Nil{})

def ago(+s: Nat) -> String:
  Bool.pick(String, Nat.is_lt(s, 60n), String.concat([Nat.show(s), " s"]), String.concat([Nat.show(Nat.div(s, 60n)), " min"]))

# the refusal of a second land of a place, its first started at `since`
# (ms; architect m_29755: the words say what an agent runs it again for)
def busy(+since: Nat, +now: Nat) -> String:
  String.concat(["a land of this place is in line or checking (since ", ago(Nat.div(Nat.sub(now, since), 1000n)), "): its result comes to you. Changes you made after it started land with your next sb land, once it ends."])

# ---- the line: tickets {ticket, target, place, go}, in arrival order ----

def t.ticket(+t: J.Json) -> Nat:
  K.get_n(t, "ticket")

def t.target(+t: J.Json) -> String:
  K.get_s(t, "target")

def t.go(+t: J.Json) -> Bool:
  K.get_b(t, "go")

# agent: whose land; trunk: where it lands when its feature ended
def ticket(+n: Nat, +target: String, +place: String, +agent: String, +trunk: String, +go: Bool) -> J.Json:
  J.JObj{[("ticket", J.JNum{n}), ("target", J.JStr{target}), ("place", J.JStr{place}), ("agent", J.JStr{agent}), ("trunk", J.JStr{trunk}), ("go", J.JBool{go})]}

def t.with(+t: J.Json, +target: String, +go: Bool) -> J.Json:
  ticket(t.ticket(t), target, K.get_s(t, "place"), K.get_s(t, "agent"), K.get_s(t, "trunk"), go)

def t.with_go(+t: J.Json) -> J.Json:
  t.with(t, t.target(t), True{})

# a ticket of `target` holds go
def held(ls: List<&2, J.Json>, +target: String) -> Bool:
  match ls:
    case Nil{}:
      False{}
    case Con{+t, +r}:
      LZ.or(String.eq(t.target(t), target) && t.go(t), u => held(r, target))

# the first ticket of `target` gets go (when none holds it); its number
def first_of(ls: List<&2, J.Json>, +target: String) -> Maybe<&2, Nat>:
  match ls:
    case Nil{}:
      None{}
    case Con{+t, +r}:
      LZ.pick(Maybe<&2, Nat>, String.eq(t.target(t), target), u => Some{t.ticket(t)}, u => first_of(r, target))

def set_go(ls: List<&2, J.Json>, +n: Nat) -> List<&2, J.Json>:
  match ls:
    case Nil{}:
      Nil{}
    case Con{+t, +r}:
      LZ.pick(List<&2, J.Json>, Nat.is_eq(t.ticket(t), n), u => t.with_go(t) <> r, u => t <> set_go(r, n))

def grant.go(m: Maybe<&2, Nat>, +ls: List<&2, J.Json>) -> List<&2, J.Json> & Maybe<&2, Nat>:
  match m:
    case None{}:
      (ls, None{})
    case Some{+n}:
      (set_go(ls, n), Some{n})

# the line after go is given on `target` if no ticket of it holds it, and
# the ticket that got it (law one_go_per_target)
def grant(+ls: List<&2, J.Json>, +target: String) -> List<&2, J.Json> & Maybe<&2, Nat>:
  LZ.pick(List<&2, J.Json> & Maybe<&2, Nat>, held(ls, target), u => (ls, None{}), u => grant.go(first_of(ls, target), ls))

# ticket `n` joins the line of `target`
def join(+ls: List<&2, J.Json>, +n: Nat, +target: String, +place: String, +agent: String, +trunk: String) -> List<&2, J.Json> & Maybe<&2, Nat>:
  grant(List.append(&2, J.Json, ls, [ticket(n, target, place, agent, trunk, False{})]), target)

def target_of(ls: List<&2, J.Json>, +n: Nat) -> Maybe<&2, String>:
  match ls:
    case Nil{}:
      None{}
    case Con{+t, +r}:
      LZ.pick(Maybe<&2, String>, Nat.is_eq(t.ticket(t), n), u => Some{t.target(t)}, u => target_of(r, n))

def drop(ls: List<&2, J.Json>, +n: Nat) -> List<&2, J.Json>:
  match ls:
    case Nil{}:
      Nil{}
    case Con{+t, +r}:
      +rest = drop(r, n)
      Bool.pick(List<&2, J.Json>, Nat.is_eq(t.ticket(t), n), rest, t <> rest)

def end.go(m: Maybe<&2, String>, +ls: List<&2, J.Json>) -> List<&2, J.Json> & Maybe<&2, Nat>:
  match m:
    case None{}:
      (ls, None{})
    case Some{+target}:
      grant(ls, target)

# ticket `n` leaves the line (its land ended); the next of its target gets
# go. A ticket the line does not know: nothing (law unknown_end_noop)
def end(+ls: List<&2, J.Json>, +n: Nat) -> List<&2, J.Json> & Maybe<&2, Nat>:
  end.go(target_of(ls, n), drop(ls, n))

# ---- ranks and lids (pr-design §4.1): the views' `landing` ----

def ordinal(+n: Nat) -> String:
  +a = Nat.mod(n, 10n)
  +b = Nat.mod(n, 100n)
  String.concat([Nat.show(n),
    Bool.pick(String, Nat.is_eq(a, 1n) && Bool.not(Nat.is_eq(b, 11n)), "st",
      Bool.pick(String, Nat.is_eq(a, 2n) && Bool.not(Nat.is_eq(b, 12n)), "nd",
        Bool.pick(String, Nat.is_eq(a, 3n) && Bool.not(Nat.is_eq(b, 13n)), "rd", "th")))])

def lid(+rank: Nat) -> String:
  Bool.pick(String, Nat.is_le(rank, 1n), "landing", String.concat(["waits to land · ", ordinal(rank)]))

# the rank of ticket `n`'s place, 1-based in its target's line
def rank_in(ls: List<&2, J.Json>, +target: String, +place: String, +k: Nat) -> Nat:
  match ls:
    case Nil{}:
      k
    case Con{+t, +r}:
      LZ.pick(Nat, String.eq(t.target(t), target),
        u => LZ.pick(Nat, String.eq(K.get_s(t, "place"), place), v => 1n+k, v => rank_in(r, target, place, 1n+k)),
        u => rank_in(r, target, place, k))

# ---- the steps (the shell's land thread asks, sb-core answers) ----
# each: R's lands before -> lands after & the fx (kv lists, gen/fx.bend)

def ls.claims(+l: J.Json) -> List<&2, J.Json>:
  K.get_js(l, "claims")

def ls.line(+l: J.Json) -> List<&2, J.Json>:
  K.get_js(l, "line")

# each place's rank in its target's line (its first ticket), {place: n}
def ranks.go(ts: List<&2, J.Json>, +all: List<&2, J.Json>, +seen: List<&2, String>) -> List<&2, Sigma<&2, &2, String, _ => J.Json>>:
  match ts:
    case Nil{}:
      Nil{}
    case Con{+t, +r}:
      +p = K.get_s(t, "place")
      LZ.pick(List<&2, Sigma<&2, &2, String, _ => J.Json>>, M.str_in(seen, p),
        u => ranks.go(r, all, seen),
        u => (p, J.JNum{rank_in(all, t.target(t), p, 0n)}) <> ranks.go(r, all, p <> seen))

def ranks(+line: List<&2, J.Json>) -> J.Json:
  J.JObj{ranks.go(line, line, Nil{})}

# ---- the words of a land's answer ----

def files_of(xs: List<&2, String>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +r = files_of(t)
      Bool.pick(List<&2, String>, String.ends_with(h, "/"), r, h <> r)

def repos_of(xs: List<&2, String>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +r = repos_of(t)
      Bool.pick(List<&2, String>, String.ends_with(h, "/"), h <> r, r)

def take(n: Nat, xs: List<&2, String>) -> List<&2, String>:
  match n xs:
    case 0n _:
      Nil{}
    case 1n+p Nil{}:
      Nil{}
    case 1n+p Con{+h, +t}:
      h <> take(p, t)

def note.files(+fs: List<&2, String>) -> List<&2, String>:
  +n = List.length(&2, String, fs)
  +one = Nat.is_eq(n, 1n)
  Bool.pick(List<&2, String>, Nat.is_eq(n, 0n), Nil{},
    [String.concat(["left out ", Nat.show(n), " file", Bool.pick(String, one, "", "s"),
      " no agent claimed (changed or new since you started): ", String.join(take(8n, fs), ", "),
      Bool.pick(String, Nat.is_gt(n, 8n), String.concat([" (+", Nat.show(Nat.sub(n, 8n)), " more)"]), ""),
      ". yours (bash, a script, cargo)? land ", Bool.pick(String, one, "it", "them"),
      ": sb land --here --add <file or folder> \"<message>\""])])

def note.repos(+rs: List<&2, String>) -> List<&2, String>:
  +n = List.length(&2, String, rs)
  Bool.pick(List<&2, String>, Nat.is_eq(n, 0n), Nil{},
    [Bool.pick(String, Nat.is_eq(n, 1n), String.concat([String.join(rs, ", "), " is its own repo: not landed"]),
      String.concat([String.join(rs, ", "), " are their own repos: not landed"]))])

# the land's word on what it left out: the changes no agent claimed
# (which, and how to land them), the nested repos. "" when none.
def left_out_note(+lo: List<&2, String>) -> String:
  String.join(List.append(&2, String, note.files(files_of(lo)), note.repos(repos_of(lo))), "; ")

# the conflict blocks ({path, a, b}, git's facts on the changed files)
# in the files the land takes: "p:a-b"
def conflict_hits(cs: List<&2, J.Json>, +mine: List<&2, String>) -> List<&2, String>:
  match cs:
    case Nil{}:
      Nil{}
    case Con{+c, +t}:
      +r = conflict_hits(t, mine)
      Bool.pick(List<&2, String>, M.str_in(mine, K.get_s(c, "path")),
        String.concat([K.get_s(c, "path"), ":", Nat.show(K.get_n(c, "a")), "-", Nat.show(K.get_n(c, "b"))]) <> r, r)

def conflict_refusal(+hs: List<&2, String>) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, Nat.is_eq(List.length(&2, String, hs), 0n), None{},
    Some{String.concat(["not landed: git conflict markers (<<<<<<< … ======= … >>>>>>>) in ", String.join(hs, ", "), ". resolve them, then land again"])})

def PR_WORDS() -> String:
  "this repo ships through pull requests: commit with `sb land --here`, then open a PR"

def NO_MESSAGE() -> String:
  "sb land needs a commit message: sb land [--here] \"<message>\""

def UNCOMMITTED() -> String:
  "you have changes not committed: give a message (sb land \"<message>\"), or commit them with sb land --here first"

def nothing_mine(+note: String) -> String:
  String.concat(["nothing of yours to land: the files you changed match the branch", Bool.pick(String, String.is_empty(note), "", String.concat(["; ", note]))])

# a worktree's files not committed after its own commit (git's facts)
def dirty_refusal(+fs: List<&2, String>) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, Nat.is_eq(List.length(&2, String, fs), 0n), None{},
    Some{String.concat(["the worktree has changes not committed (", String.join(take(5n, fs), ", "), "): each agent lands its own with sb land --here first"])})

# ---- the pick step: what a land takes, or its refusal before its turn,
# in today's order: PR mode, the pick, conflict blocks, then a worktree's
# uncommitted files without a message, or a --here/shared land's nothing
# of its own and its missing message ----

def answer(+ok: Bool, +mine: List<&2, String>, +lo: List<&2, String>, +why: String) -> J.Json:
  J.JObj{[("ok", J.JBool{ok}), ("mine", J.JArr{K.jstrs(mine)}), ("left_out", J.JArr{K.jstrs(lo)}), ("note", J.JStr{left_out_note(lo)}), ("why", J.JStr{why})]}

def no(+why: String) -> J.Json:
  answer(False{}, Nil{}, Nil{}, why)

def decide.after(+mine: List<&2, String>, +lo: List<&2, String>, +branch: Bool, +message: String) -> J.Json:
  +none = Nat.is_eq(List.length(&2, String, mine), 0n)
  +blank = String.is_empty(String.trim(message))
  LZ.pick(J.Json, branch,
    u => Bool.pick(J.Json, Bool.not(none) && blank, no(UNCOMMITTED()), answer(True{}, mine, lo, "")),
    u => LZ.pick(J.Json, none, v => no(nothing_mine(left_out_note(lo))),
      v => Bool.pick(J.Json, blank, no(NO_MESSAGE()), answer(True{}, mine, lo, ""))))

def decide.conflicts(m: Maybe<&2, String>, +mine: List<&2, String>, +lo: List<&2, String>, +branch: Bool, +message: String) -> J.Json:
  match m:
    case Some{+why}:
      no(why)
    case None{}:
      decide.after(mine, lo, branch, message)

def decide.picked(+p: J.Json, +conflicts: List<&2, J.Json>, +branch: Bool, +message: String) -> J.Json:
  +mine = K.get_ss(p, "mine")
  LZ.pick(J.Json, K.get_b(p, "ok"),
    u => decide.conflicts(conflict_refusal(conflict_hits(conflicts, mine)), mine, K.get_ss(p, "left_out"), branch, message),
    u => no(K.get_s(p, "why")))

# input land_pick's fields, as decide reads them
def pick_input(+changes: J.Json, +files: J.Json, +add: J.Json, +others: J.Json, +conflicts: J.Json, +alone: Bool, +worktree: Bool, +here: Bool, +pr_mode: Bool, +message: String) -> J.Json:
  J.JObj{[("changes", changes), ("files", files), ("add", add), ("others", others), ("conflicts", conflicts),
    ("alone", J.JBool{alone}), ("worktree", J.JBool{worktree}), ("here", J.JBool{here}), ("pr_mode", J.JBool{pr_mode}), ("message", J.JStr{message})]}

# `branch`: a worktree land that is not --here (its branch lands)
def decide(+i: J.Json) -> J.Json:
  +branch = Bool.not(K.get_b(i, "here")) && K.get_b(i, "worktree")
  LZ.pick(J.Json, branch && K.get_b(i, "pr_mode"),
    u => no(PR_WORDS()),
    u => decide.picked(pick(K.get_js(i, "changes"), K.get_ss(i, "files"), K.get_js(i, "add"), K.get_js(i, "others"), K.get_b(i, "alone")),
      K.get_js(i, "conflicts"), branch, K.get_s(i, "message")))

# ---- where a land queues (feature-retire): its feature's line while
# its agent still lands on that feature, else the trunk's ----

def feature_name(+target: String) -> String:
  Bool.pick(String, String.starts_with(target, "refs/heads/"), String.drop(target, 11n), target)

# an agent sb-core does not know (a feature's own merge or retire, no
# agent, a land whose agent is gone) keeps its land's target: it stays
# in that line (architect m_37473)
def onto.of(m: Maybe<&2, S.Agent>, +target: String, +trunk: String) -> String:
  match m:
    case None{}:
      target
    case Some{+a}:
      Bool.pick(String, FT.lands_on(S.Agent.ws(a), feature_name(target)), target, trunk)

def onto(+st: S.St, +agent: String, +target: String, +trunk: String) -> String:
  LZ.pick(String, String.eq(target, trunk), u => trunk, u => onto.of(M.get_agent(st, agent), target, trunk))

# the tickets of feature line `target` whose agent no longer lands on it
# go to the end of their trunk's line, in their order (law
# no_go_on_ended_feature); the others stay where they are
def stays(ls: List<&2, J.Json>, +st: S.St, +target: String) -> List<&2, J.Json>:
  match ls:
    case Nil{}:
      Nil{}
    case Con{+t, +r}:
      +rest = stays(r, st, target)
      Bool.pick(List<&2, J.Json>, String.eq(t.target(t), target) && Bool.not(String.eq(onto(st, K.get_s(t, "agent"), target, K.get_s(t, "trunk")), target)), rest, t <> rest)

def moved(ls: List<&2, J.Json>, +st: S.St, +target: String) -> List<&2, J.Json>:
  match ls:
    case Nil{}:
      Nil{}
    case Con{+t, +r}:
      +trunk = K.get_s(t, "trunk")
      +rest = moved(r, st, target)
      Bool.pick(List<&2, J.Json>, String.eq(t.target(t), target) && Bool.not(String.eq(onto(st, K.get_s(t, "agent"), target, trunk), target)), t.with(t, trunk, False{}) <> rest, rest)

def retarget(+ls: List<&2, J.Json>, +st: S.St, +target: String) -> List<&2, J.Json>:
  List.append(&2, J.Json, stays(ls, st, target), moved(ls, st, target))

def maybe_list(m: Maybe<&2, Nat>) -> List<&2, Nat>:
  match m:
    case None{}:
      Nil{}
    case Some{+n}:
      [n]

def grants.fin(p: List<&2, J.Json> & Maybe<&2, Nat>, +g1: List<&2, Nat>) -> List<&2, J.Json> & List<&2, Nat>:
  (l2, g2) = p
  (l2, List.append(&2, Nat, g1, maybe_list(g2)))

def grants.two(p: List<&2, J.Json> & Maybe<&2, Nat>, +trunk: String) -> List<&2, J.Json> & List<&2, Nat>:
  (l1, g1) = p
  grants.fin(grant(l1, trunk), maybe_list(g1))

# go on `target` and on its tickets' trunk once retargeted: the tickets
# that got it
def grants(+ls: List<&2, J.Json>, +st: S.St, +target: String, +trunk: String) -> List<&2, J.Json> & List<&2, Nat>:
  grants.two(grant(retarget(ls, st, target), target), trunk)

# ticket `n`
def find(ls: List<&2, J.Json>, +n: Nat) -> Maybe<&2, J.Json>:
  match ls:
    case Nil{}:
      None{}
    case Con{+t, +r}:
      LZ.pick(Maybe<&2, J.Json>, Nat.is_eq(t.ticket(t), n), u => Some{t}, u => find(r, n))

def p.line(p: List<&2, J.Json> & Maybe<&2, Nat>) -> List<&2, J.Json>:
  (l, g) = p
  l

def p.got(p: List<&2, J.Json> & Maybe<&2, Nat>) -> List<&2, Nat>:
  (l, g) = p
  maybe_list(g)

def grant_all.go(ts: List<&2, J.Json>, +ls: List<&2, J.Json>, +gs: List<&2, Nat>) -> List<&2, J.Json> & List<&2, Nat>:
  match ts:
    case Nil{}:
      (ls, gs)
    case Con{+t, +r}:
      grant_all.go(r, p.line(grant(ls, t.target(t))), List.append(&2, Nat, gs, p.got(grant(ls, t.target(t)))))

# go on each target of `ts` that no ticket holds (land_live: a holder
# given back keeps it, law live_keeps_holder): the line and who got it
def grant_all(ts: List<&2, J.Json>, +ls: List<&2, J.Json>) -> List<&2, J.Json> & List<&2, Nat>:
  grant_all.go(ts, ls, Nil{})
