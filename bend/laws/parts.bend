# bend/laws/parts.bend: an agent's message parts (send-parts, architect
# m_23962): `sb send/spawn --attach` keeps them on its message and writes
# them in the feeds by its id; none, nothing new. His own parts' laws
# (msg-parts, routes) are in bend/laws/hub.bend. Closed by
# bend/proofs/parts.bend; the gate checks every bend/proofs/*.bend: a law
# here with no proof there fails it.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/codec.bend as HCD
import ../hub/newtask.bend as HNT

# ---- an agent's message parts (send-parts, architect m_23962) ----

# LAW: an agent's `sb send` keeps the parts the hub checked (`--attach`)
# on its message, beside its text, unchanged.
law agent_send_keeps_parts:
  for +from: String
  for +to: String
  for +expect: Bool
  for +reply_to: Maybe<&2, Nat>
  for +q: J.Json
  {HC.Snd.parts(HC.req_send.snd(from, to, expect, reply_to, q)) == HCD.get_s(q, "parts") : String}

# LAW: a message without parts writes no msg-parts / sent-parts line, so
# every feed is what it always was.
law agent_no_parts_no_line:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +agent: String
  for +id: Nat
  for +thread: Nat
  for +from: String
  for +to: String
  for +reply_to: Maybe<&2, Nat>
  for +expect: Bool
  for +auto: Bool
  for +text: String
  for +ms: Nat
  for +plain: Bool
  for +queued: Bool
  for +via: Maybe<&2, String>
  {HC.msg_parts(o, cx, agent, HM.new_msg(id, thread, from, to, reply_to, expect, auto, text, ms, plain, queued, via, "")) == cx : HX.Cx<o>}

law agent_no_parts_no_sent_line:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +agent: String
  for +id: Nat
  for +thread: Nat
  for +from: String
  for +to: String
  for +reply_to: Maybe<&2, Nat>
  for +expect: Bool
  for +auto: Bool
  for +text: String
  for +ms: Nat
  for +plain: Bool
  for +queued: Bool
  for +via: Maybe<&2, String>
  {HC.sent_parts(o, cx, agent, HM.new_msg(id, thread, from, to, reply_to, expect, auto, text, ms, plain, queued, via, "")) == cx : HX.Cx<o>}

# LAW: a brief without parts has none (its message is the one it always
# was); with them, the task's head goes in front as a text part.
law brief_no_parts:
  for +head: String
  {HNT.brief_parts(head, "") == "" : String}
