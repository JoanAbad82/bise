# hub/peer.bend — who may speak as whom on the hub's sockets (issue 37 #2,
# docs/issues/16 and 17), pure. The judge (rust/peer judge.rs, shared with
# the computer-use broker) reads the process table and says who sent a
# request: the user's own process (`outside`), the hub itself (`hub`: its
# own requests, no peer), agent folder `dir` of this hub (`agent`) or of a
# sibling hub (`other_hub`), or nothing readable (`gone`). That fact rides
# the input; this module owns the rule on top of it: `speaker`. The judge
# owns "who", sb-core owns "may". Anything it does not know is refused:
# fail closed. Laws: bend/laws/peer.bend.
import Base

import ./model.bend as M
import ./gen/state.bend as S

import ./lazy.bend as LZ

import ../vendor/json.bend as J
import ./gen/fx.bend as F

# a tag's dir as bise_peer::tags::agent_key keys it (with no hub): every
# char but ASCII letters, digits, '-' and '_' becomes '_' (one per char).
# Pinned to Rust's by rust/proto/fixtures/agent_key.jsonl (law
# agent_key_fixture, bise_peer's test reads the same file).
def key_char(c: Char) -> Char:
  match c:
    case Chr{+x}:
      Bool.pick(Char, (U32.is_ge(x, 48) && U32.is_le(x, 57)) || (U32.is_ge(x, 65) && U32.is_le(x, 90)) || (U32.is_ge(x, 97) && U32.is_le(x, 122)) || U32.is_eq(x, 45) || U32.is_eq(x, 95), Chr{x}, Chr{95})

def agent_key(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{+h, +t}:
      SCon{key_char(h), agent_key(t)}

# the agent of this hub whose folder keys like `dir`: the list's first
def by_dir(xs: List<&2, S.Agent>, +k: String) -> Maybe<&2, S.Agent>:
  match xs:
    case Nil{}:
      None{}
    case Con{+a, +t}:
      LZ.pick(Maybe<&2, S.Agent>, String.eq(agent_key(S.Agent.dir(a)), k), u => Some{a}, u => by_dir(t, k))

def says(+from: String) -> String:
  Bool.pick(String, String.is_empty(from), "no one", from)

# agent `a`'s process: it speaks as its name or one of its aliases only
def as_itself(+a: S.Agent, +from: String) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, String.eq(S.Agent.name(a), from) || M.str_in(S.Agent.aliases(a), from),
    None{},
    Some{String.concat(["this request says it is from ", says(from), ", but it comes from agent ", S.Agent.name(a), "'s process: an agent speaks only as itself (SB_AGENT is not for changing)"])})

def agent.go(m: Maybe<&2, S.Agent>, +dir: String, +from: String) -> Maybe<&2, String>:
  match m:
    case None{}:
      Some{String.concat(["this request comes from the process of agent folder ", dir, ", which this hub does not know: refused"])}
    case Some{+a}:
      as_itself(a, from)

def GONE() -> String:
  "the hub could not read which process sent this request (gone already?): refused"

def other_hub(+dir: String) -> String:
  String.concat(["this request comes from agent ", dir, "'s process (another project's hub): an agent speaks only on its own hub"])

# Whether a request that says `from` may be served, its sender being
# `kind`/`dir` (the judge's fact): None, served; Some, the line `sb`
# prints (refused). The user's process may name any `from`, as the user
# may speak as main: the user is not an agent (law speaker_outside_any).
def speaker(+st: S.St, +kind: String, +dir: String, +from: String) -> Maybe<&2, String>:
  LZ.pick(Maybe<&2, String>, String.eq(kind, "outside") || String.eq(kind, "hub"),
    u => None{},
    u => LZ.pick(Maybe<&2, String>, String.eq(kind, "agent"),
      v => agent.go(by_dir(S.St.agents(st), agent_key(dir)), dir, from),
      v => Bool.pick(Maybe<&2, String>, String.eq(kind, "other_hub"), Some{other_hub(dir)}, Some{GONE()})))

# An agent request (input req): the speaker's rule, and it came on
# agent.sock (law agent_req_only_on_agent_sock). The hub's own requests
# (kind `hub`) have no socket: made in the hub's process, never by a
# connection (rust peer.rs Sender::hub, its callers named there: a model
# switch's report, a page step's card, bise's home hub's xfollow, the
# turn-failed report; the accept threads never set it, test
# no_connection_is_the_hub).
def SOCK_REFUSED() -> String:
  "an agent request is served on agent.sock only"

def req_ok(+st: S.St, +kind: String, +dir: String, +sock: String, +from: String) -> Maybe<&2, String>:
  LZ.pick(Maybe<&2, String>, String.eq(kind, "hub") || String.eq(sock, "agent"),
    u => speaker(st, kind, dir, from),
    u => Some{SOCK_REFUSED()})

# fx spoke of a request `token` and its sender's verdict (None: ok)
def spoke(+token: Nat, m: Maybe<&2, String>) -> List<&2, Sigma<&2, &2, String, _ => J.Json>>:
  match m:
    case None{}:
      F.spoke(token, True{}, "")
    case Some{+why}:
      F.spoke(token, False{}, why)
