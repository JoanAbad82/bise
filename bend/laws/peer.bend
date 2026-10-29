# bend/laws/peer.bend: who may speak as whom on the hub's sockets (issue
# 37 #2, architect m_35407; docs/issues/16 and 17). bend/hub/peer.bend
# `speaker` decides on the judge's fact (rust/peer judge.rs: who sent it),
# and core.bend runs no agent request without its ok. Closed by
# bend/proofs/peer.bend; the gate checks every bend/proofs/*.bend.
import Base
import ../vendor/json.bend as J
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/model.bend as HM
import ../hub/peer.bend as HPR

# LAW: the user's own process (and the hub's own request) may speak as
# any `from`: the user is not an agent.
law speaker_outside_any:
  for +st: HS.St
  for +dir: String
  for +from: String
  {HPR.speaker(st, "outside", dir, from) == None{} : Maybe<&2, String>}

law speaker_hub_any:
  for +st: HS.St
  for +dir: String
  for +from: String
  {HPR.speaker(st, "hub", dir, from) == None{} : Maybe<&2, String>}

# LAW: another project's agent and an unreadable sender are always
# refused, whatever they say (fail closed).
law speaker_other_hub_refused:
  for +st: HS.St
  for +dir: String
  for +from: String
  {HPR.speaker(st, "other_hub", dir, from) == Some{HPR.other_hub(dir)} : Maybe<&2, String>}

law speaker_gone_refused:
  for +st: HS.St
  for +dir: String
  for +from: String
  {HPR.speaker(st, "gone", dir, from) == Some{HPR.GONE()} : Maybe<&2, String>}

# LAW: a fact sb-core does not know (an older shell's "", a typo) reads
# gone: refused.
law speaker_unknown_refused:
  for +st: HS.St
  for +dir: String
  for +from: String
  {HPR.speaker(st, "", dir, from) == Some{HPR.GONE()} : Maybe<&2, String>}

# LAW: an agent's process speaks only as the agent its folder belongs to
# (its name or an alias), never as another, main or the user.
law speaker_agent_only_itself:
  for +a: HS.Agent
  for +from: String
  {HPR.as_itself(a, from) == Bool.pick(Maybe<&2, String>, String.eq(HS.Agent.name(a), from) || HM.str_in(HS.Agent.aliases(a), from), None{}, Some{String.concat(["this request says it is from ", HPR.says(from), ", but it comes from agent ", HS.Agent.name(a), "'s process: an agent speaks only as itself (SB_AGENT is not for changing)"])}) : Maybe<&2, String>}

# LAW: a folder this hub does not know is refused.
law speaker_unknown_folder:
  for +dir: String
  for +from: String
  {HPR.agent.go(None{}, dir, from) == Some{String.concat(["this request comes from the process of agent folder ", dir, ", which this hub does not know: refused"])} : Maybe<&2, String>}

# LAW: an agent request is served on agent.sock only; the hub's own have
# no socket.
law agent_req_only_on_agent_sock:
  for +st: HS.St
  for +who: String
  for +dir: String
  for +from: String
  for e: {String.eq(who, "hub") || String.eq("client", "agent") == False{} : Bool}
  {HPR.req_ok(st, who, dir, "client", from) == Some{HPR.SOCK_REFUSED()} : Maybe<&2, String>}

# LAW: no path serves an agent request without the speaker's ok: a
# refused request makes only its fx spoke (no reply, no journal line, no
# delivery), and an ok one runs as before.
law req_refused_says_only_why:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +token: Nat
  for +from: String
  for +q: J.Json
  for +why: String
  {HC.agent_req.by(o, Some{why}, cx, token, from, q) == HC.out(o, cx, HPR.spoke(token, Some{why})) : HX.Cx<o>}

law req_ok_runs:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +token: Nat
  for +from: String
  for +q: J.Json
  {HC.agent_req.by(o, None{}, cx, token, from, q) == HC.agent_req(o, cx, token, from, q) : HX.Cx<o>}

# peer.rs's table (docs/issues/17), as instances: agents main (dir main),
# t1 (dir "old t1", alias old-t1), t2 (dir t2)
def hub3() -> HS.St:
  +main = HS.Agent.with_dir(HS.Agent.with_name(HS.Agent.empty(), "main"), "main")
  +t1 = HS.Agent.with_aliases(HS.Agent.with_dir(HS.Agent.with_name(HS.Agent.empty(), "t1"), "old t1"), ["old-t1"])
  +t2 = HS.Agent.with_dir(HS.Agent.with_name(HS.Agent.empty(), "t2"), "t2")
  HS.St.with_agents(HS.St.empty(), [main, t1, t2])

def served(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      True{}
    case Some{_}:
      False{}

law speaker_table:
  {[served(HPR.speaker(hub3(), "outside", "", "main")), served(HPR.speaker(hub3(), "outside", "", "")), served(HPR.speaker(hub3(), "agent", "t2", "t2")), served(HPR.speaker(hub3(), "agent", "main", "main")), served(HPR.speaker(hub3(), "agent", "t2", "main")), served(HPR.speaker(hub3(), "agent", "t2", "t1")), served(HPR.speaker(hub3(), "agent", "main", "t2")), served(HPR.speaker(hub3(), "agent", "t2", "")), served(HPR.speaker(hub3(), "agent", "old_t1", "t1")), served(HPR.speaker(hub3(), "agent", "old_t1", "old-t1")), served(HPR.speaker(hub3(), "agent", "gone", "gone")), served(HPR.speaker(hub3(), "other_hub", "t2", "t2")), served(HPR.speaker(hub3(), "gone", "", "t2"))]
    == [True{}, True{}, True{}, True{}, False{}, False{}, False{}, False{}, True{}, True{}, False{}, False{}, False{}] : List<&2, Bool>}

law speaker_words:
  {[HPR.speaker(hub3(), "agent", "t2", "main"), HPR.speaker(hub3(), "agent", "t2", "")]
    == [Some{"this request says it is from main, but it comes from agent t2's process: an agent speaks only as itself (SB_AGENT is not for changing)"}, Some{"this request says it is from no one, but it comes from agent t2's process: an agent speaks only as itself (SB_AGENT is not for changing)"}] : List<&2, Maybe<&2, String>>}

# agent_key: rust/proto/fixtures/agent_key.jsonl, line for line (bise_peer's
# tags test reads the same file and checks this block names every line)
# agent_key fixture:
law agent_key_fixture:
  {[HPR.agent_key("t2"), HPR.agent_key("old t1"), HPR.agent_key("x.2"), HPR.agent_key("a-b_c9"), HPR.agent_key("café"), HPR.agent_key("日本"), HPR.agent_key(""), HPR.agent_key("a/b c.d")]
    == ["t2", "old_t1", "x_2", "a-b_c9", "caf_", "__", "", "a_b_c_d"] : List<&2, String>}
