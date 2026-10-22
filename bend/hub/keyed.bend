# hub/keyed.bend - keyed lists: a list of entries, at most one per key
# (the runtime lists' helpers: steered ids, counters, key/value and
# key/number lists). Pure; moved as is from core.bend (feature-retire,
# architect m_20565), which imports it as KL.
import Base

import ./model.bend as M

import ./cx.bend as X

import ./lazy.bend as LZ

# the entries whose key is not `n`
def del_key(~A: Data, ~key: A -> String, xs: List<&2, A>, +n: String) -> List<&2, A>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = del_key(~A, ~key, t, n)
      Bool.pick(List<&2, A>, String.eq(key(h), n), rest, h <> rest)

# the value of the first entry whose key is `n`, or `dflt`
def get_key(~A: Data, ~B: Data, ~key: A -> String, ~val: A -> B, xs: List<&2, A>, +n: String, +dflt: B) -> B:
  match xs:
    case Nil{}:
      dflt
    case Con{+h, +t}:
      LZ.pick(B, String.eq(key(h), n), u => val(h), u => get_key(~A, ~B, ~key, ~val, t, n, dflt))

def steer_get(xs: List<&2, X.Steer>, +n: String) -> List<&2, Nat>:
  get_key(~X.Steer, ~List<&2, Nat>, ~X.Steer.agent, ~X.Steer.ids, xs, n, Nil{})

# how many of an agent's steered ids a receipt already reported
def steer_seen(xs: List<&2, X.Steer>, +n: String) -> Nat:
  get_key(~X.Steer, ~Nat, ~X.Steer.agent, ~X.Steer.seen, xs, n, 0n)

# how many of an agent's steered ids a received receipt already reported
def steer_rx_seen(xs: List<&2, X.Steer>, +n: String) -> Nat:
  get_key(~X.Steer, ~Nat, ~X.Steer.agent, ~X.Steer.rx_seen, xs, n, 0n)

def cnt_get(xs: List<&2, X.Cnt>, +n: String) -> X.Cnt:
  get_key(~X.Cnt, ~X.Cnt, ~X.Cnt.agent, ~(c => c), xs, n, X.Cnt{n, 0n, 0n})

def cnt_del(xs: List<&2, X.Cnt>, +n: String) -> List<&2, X.Cnt>:
  del_key(~X.Cnt, ~X.Cnt.agent, xs, n)

def kv_get(xs: List<&2, X.Kv>, +n: String) -> String:
  get_key(~X.Kv, ~String, ~X.Kv.key, ~X.Kv.val, xs, n, "")

def kv_del(xs: List<&2, X.Kv>, +n: String) -> List<&2, X.Kv>:
  del_key(~X.Kv, ~X.Kv.key, xs, n)

def kn_get(xs: List<&2, X.Kn>, +n: String) -> Nat:
  get_key(~X.Kn, ~Nat, ~X.Kn.key, ~X.Kn.n, xs, n, 0n)

def kn_del(xs: List<&2, X.Kn>, +n: String) -> List<&2, X.Kn>:
  del_key(~X.Kn, ~X.Kn.key, xs, n)

def steer_del(xs: List<&2, X.Steer>, +n: String) -> List<&2, X.Steer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = steer_del(t, n)
      Bool.pick(List<&2, X.Steer>, String.eq(X.Steer.agent(h), n), rest, h <> rest)

def steer_add(+xs: List<&2, X.Steer>, +n: String, +ids: List<&2, Nat>) -> List<&2, X.Steer>:
  M.snoc(X.Steer, steer_del(xs, n), X.Steer{n, List.append(&2, Nat, steer_get(xs, n), ids), steer_seen(xs, n), steer_rx_seen(xs, n)})

def steer_rename(xs: List<&2, X.Steer>, +old: String, +new: String) -> List<&2, X.Steer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(X.Steer, String.eq(X.Steer.agent(h), old), X.Steer{new, X.Steer.ids(h), X.Steer.seen(h), X.Steer.rx_seen(h)}, h) <> steer_rename(t, old, new)

# an agent's steered list with `seen` set to `k` (the list itself kept;
# moved from core.bend, issue 37 #3)
def steer_mark(xs: List<&2, X.Steer>, +n: String, +k: Nat) -> List<&2, X.Steer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(X.Steer, String.eq(X.Steer.agent(h), n), X.Steer{n, X.Steer.ids(h), k, X.Steer.rx_seen(h)}, h) <> steer_mark(t, n, k)

# an agent's steered list with `rx_seen` set to `k` (the list and `seen`
# kept)
def steer_rx_mark(xs: List<&2, X.Steer>, +n: String, +k: Nat) -> List<&2, X.Steer>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(X.Steer, String.eq(X.Steer.agent(h), n), X.Steer{n, X.Steer.ids(h), X.Steer.seen(h), k}, h) <> steer_rx_mark(t, n, k)
