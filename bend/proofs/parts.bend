# bend/proofs/parts.bend: the proofs of bend/laws/parts.bend. Each holds
# by unfolding: the message keeps the request's parts, and an empty parts
# string picks the branch that writes nothing.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/gen/state-laws.bend as HSL
import ../hub/gen/feed.bend as HFD
import ../hub/lazy.bend as HLZ
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/newtask.bend as HNT
import ../laws/parts.bend as Laws

def Laws.agent_send_keeps_parts(from, to, expect, reply_to, q):
  {==}

def Laws.agent_no_parts_no_line(o, cx, agent, m):
  %Equal.sym(String, HS.Msg.parts(HS.Msg.with_parts(m, "")), "", HSL.Msg.parts.get_with(m, "")) : {HLZ.pick(HX.Cx<o>, String.is_empty(_), u => cx,
    u => HC.feed(o, cx, agent, HFD.msg_parts(HS.Msg.id(HS.Msg.with_parts(m, "")), HC.parts_json(HS.Msg.parts(HS.Msg.with_parts(m, "")))))) == cx : HX.Cx<o>}
  {==}

def Laws.agent_no_parts_no_sent_line(o, cx, agent, m):
  %Equal.sym(String, HS.Msg.parts(HS.Msg.with_parts(m, "")), "", HSL.Msg.parts.get_with(m, "")) : {HLZ.pick(HX.Cx<o>, String.is_empty(_), u => cx,
    u => HC.feed(o, cx, agent, HFD.sent_parts(HS.Msg.id(HS.Msg.with_parts(m, "")), HC.parts_json(HS.Msg.parts(HS.Msg.with_parts(m, "")))))) == cx : HX.Cx<o>}
  {==}

def Laws.brief_no_parts(head):
  {==}
