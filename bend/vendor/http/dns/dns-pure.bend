# The pure half of dns.bend: no effect, so laws can check it.
import Base

# What the OS resolver answered, as the IPv4 addresses to try in order or a
# Miss; the words a miss shows; and the loop that tries the addresses.
#   import ./dns/dns-pure.bend as Dnp
# bise patch (with dns.bend and Wire.lookup): see dns.bend.

# Why a name gave no address to connect to. why: the resolver's own words.
type Miss is Data:
  MissName{why: String}
  MissNet{why: String}
  MissV6{addrs: String}
  MissOther{why: String}

def ipv4.go(s: String) -> Bool:
  match s:
    case SNil{}:
      True{}
    case SCon{Chr{+c}, t}:
      Bool.and(Bool.or(U32.is_eq(c, 46), Bool.and(U32.is_le(48, c), U32.is_le(c, 57))), ipv4.go(t))

# Digits and dots; TCP.connect rejects anything else that is not an address.
def ipv4(+s: String) -> Bool:
  Bool.and(Bool.not(String.is_empty(s)), ipv4.go(s))

def v4s.put(+a: String, rest: List<&2, String>, keep: Bool) -> List<&2, String>:
  match keep:
    case True{}:
      Con{a, rest}
    case False{}:
      rest

# The IPv4 addresses of xs, in their order.
def v4s(xs: List<&2, String>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+a, t}:
      v4s.put(a, v4s(t), ipv4(a))

def failed(+code: U32, +why: String) -> Miss:
  Bool.pick(Miss, U32.is_eq(code, 1), MissName{why}, Bool.pick(Miss, U32.is_eq(code, 2), MissNet{why}, MissOther{why}))

def found.v4(+all: List<&2, String>, v4: List<&2, String>) -> Result<&2, &2, Miss, List<&2, String>>:
  match v4:
    case Nil{}:
      Fail{MissV6{String.join(all, ", ")}}
    case Con{h, t}:
      Done{Con{h, t}}

# What Wire.lookup answered (codes: 1 no address for the name, 2 no answer,
# 3 another failure), as the IPv4 addresses to try in order, or a Miss.
def found(r: Result<&1, &1, U32 & String, List<&2, String>>) -> Result<&2, &2, Miss, List<&2, String>>:
  match r:
    case Fail{(+code, +why)}:
      Fail{failed(code, why)}
    case Done{+xs}:
      found.v4(xs, v4s(xs))

# Why, in one plain line, after "cannot resolve <host>: ".
def why(m: Miss) -> String:
  match m:
    case MissName{+w}:
      String.concat(["the system resolver has no address for it (", w, ")"])
    case MissNet{+w}:
      String.concat(["the system resolver did not answer (", w, ")"])
    case MissV6{+a}:
      String.concat(["it has only IPv6 addresses (", a, ") and bise connects over IPv4"])
    case MissOther{+w}:
      String.concat(["the system resolver failed (", w, ")"])

# What the user can check, "" when nothing on his side would help.
def check(m: Miss) -> String:
  match m:
    case MissName{_}:
      "the host name, your network or VPN"
    case MissNet{_}:
      "your network or VPN"
    case MissV6{_}:
      ""
    case MissOther{_}:
      ""

# Every address in order
# ----------------------

def each.step(~A: Type, ~E: Data, ~next: E -> Bool, r: Result<&1, &1, E, A>) -> Bool & Result<&1, &1, E, A>:
  match r:
    case Done{c}:
      (False{}, Done{c})
    case Fail{+e}:
      (next(e), Fail{e})

# Each address in order until one connects: a host whose first address does
# not connect (an IPv6 one, a dead replica) still works. open(ctx, address)
# is one attempt; next(error) says whether to go on after a failed one; st is
# (go on?, the answer so far): start it at (True, the error for no address).
def each(~A: Type, ~E: Data, ~C: Data, ~next: E -> Bool, ~open: C -> String -> IO(Result<&1, &1, E, A>), +ctx: C, addrs: List<&2, String>, st: Bool & Result<&1, &1, E, A>) -> IO(Result<&1, &1, E, A>):
  match addrs:
    case Nil{}:
      (go, r) = st
      IO.pure(Result<&1, &1, E, A>, r)
    case Con{+a, rest}:
      (go, r) = st
      match go:
        case False{}:
          IO.pure(Result<&1, &1, E, A>, r)
        case True{}:
          do IO<Result<&1, &1, E, A>>:
            c : Result<&1, &1, E, A> <- open(ctx, a)
            each(~A, ~E, ~C, ~next, ~open, ctx, rest, each.step(~A, ~E, ~next, c))
