# bend/tests/agents-split-check.bend — the agents split's two facts that
# are not laws (bend/laws/agents.bend's header, architect m_34135): after
# every event of a journal, St.agents' names come in St.order's order (a
# subsequence of it), and every name of both sides is in St.order.
# SPLIT_JOURNAL=<journal.jsonl> replays it from M.init (each line through
# the journal codec, as replay_many) and prints `events <n> bad <k>`, then
# the first bad event's index and the names out of place.
# tests/agents_split_check.py runs it on a generated journal (archives,
# restores, renames, a reused archived name) and on a copy of a real one.

import Base
import ../vendor/json.bend as J
import ../hub/model.bend as M
import ../hub/gen/state.bend as S
import ../hub/gen/journal.bend as GJ
import ../hub/agents.bend as AG
import ../hub/lazy.bend as LZ
import ../runtime/persist.bend as P

# `xs` comes in `ord`'s order, each name once
def sub(xs: List<&2, String>, ord: List<&2, String>) -> Bool:
  match xs ord:
    case Nil{} _:
      True{}
    case Con{_, _} Nil{}:
      False{}
    case Con{+x, +t} Con{+o, +r}:
      LZ.pick(Bool, String.eq(x, o), u => sub(t, r), u => sub(x <> t, r))

def all_in(xs: List<&2, String>, +ord: List<&2, String>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{+x, +t}:
      LZ.and(M.str_in(ord, x), u => all_in(t, ord))

def ok(+s: S.St) -> Bool:
  sub(AG.names(S.St.agents(s)), S.St.order(s)) && all_in(AG.names(S.St.arch(s)), S.St.order(s))

type Acc is Data:
  Acc{st: S.St, n: Nat, bad: Nat, first: String}

def step.note(good: Bool, +a: Acc) -> Acc:
  match good a:
    case True{} _:
      a
    case False{} Acc{+st, +n, +bad, +first}:
      Acc{st, n, 1n+bad, Bool.pick(String, String.is_empty(first),
        String.concat(["event ", Nat.show(n), ": agents ", String.join(AG.names(S.St.agents(st)), ","), " arch ", String.join(AG.names(S.St.arch(st)), ","), " order ", String.join(S.St.order(st), ",")]), first)}

def step.ev(m: Maybe<&2, M.Ev>, a: Acc) -> Acc:
  match m a:
    case None{} Acc{+st, +n, +bad, +first}:
      Acc{st, 1n+n, bad, first}
    case Some{+e} Acc{+st, +n, +bad, +first}:
      +st2 = M.apply(st, e)
      step.note(ok(st2), Acc{st2, 1n+n, bad, first})

def step.line(r: Result<&2, &2, String, J.Json>, a: Acc) -> Acc:
  match r:
    case Done{+j}:
      step.ev(GJ.of(j), a)
    case Fail{_}:
      a

def run(ls: List<&2, String>, +a: Acc) -> Acc:
  match ls:
    case Nil{}:
      a
    case Con{+l, +t}:
      run(t, Bool.pick(Acc, String.is_empty(String.trim(l)), a, step.line(J.parse(l), a)))

def report(a: Acc) -> String:
  match a:
    case Acc{_, +n, +bad, +first}:
      String.concat(["events ", Nat.show(n), " bad ", Nat.show(bad), "\n", first])

def go(m: Maybe<&2, String>) -> IO(Unit):
  match m:
    case None{}:
      IO.print("UNREADABLE")
    case Some{+s}:
      IO.print(report(run(String.split(s, '\n'), Acc{M.init("/w"), 0n, 0n, ""})))

def main() -> IO(Unit):
  do IO<Unit>:
    r : Result<&1, &1, U32 & String, String> <- IO.get_env("SPLIT_JOURNAL")
    +path : String <- IO.pure(String, P.env_or(r, ""))
    m : Maybe<&2, String> <- P.read_file(path)
    go(m)
