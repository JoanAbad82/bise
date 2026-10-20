# bend/laws/say_from.bend: his words typed in another thread (at-start,
# architect m_34123): a message he sends to `to` from a live agent's
# thread `from` leaves one quiet route row there. Closed by
# bend/proofs/say_from.bend; the gate checks every bend/proofs/*.bend.
import Base
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/gen/feed.bend as HFD

# LAW: words typed in their own thread (no `from`) leave no route row:
# the trace writes nothing.
law say_from_none_no_row:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +to: String
  for +id: Nat
  for +text: String
  for +parts: String
  {HC.says.trace(o, cx, "", to, id, text, parts) == cx : HX.Cx<o>}

# LAW: typed in a live agent's thread `from` (not to's), his message to
# `to` leaves one route row in from's feed (to, his words, the message's
# id, no card), then its parts there; never in another feed.
law say_from_leaves_one_route_row:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +from: String
  for +to: String
  for +id: Nat
  for +text: String
  for +parts: String
  for e: {String.is_empty(from) || String.eq(from, to) || Bool.not(HM.live_agent(HM.get_agent(HC.st(o, cx), from))) == False{} : Bool}
  {HC.says.trace(o, cx, from, to, id, text, parts) == HC.route_parts.at(o, HC.feed(o, cx, from, HFD.route(to, None{}, text, Some{id}, None{}, None{})), from, parts) : HX.Cx<o>}

# LAW: `from` changes nothing else: a message sent with it is the same
# step as one sent without it, after its trace (same delivery, same
# 'you' line, same notices).
law say_from_changes_nothing_else:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +m: HS.Msg
  for +to: String
  for +text: String
  for +from: String
  for +parts: String
  {HC.says.sent(o, (cx, HC.SOk{m}), to, text, from, parts) == HC.says.sent(o, (HC.says.trace(o, cx, from, to, HS.Msg.id(m), text, parts), HC.SOk{m}), to, text, "", parts) : HX.Cx<o>}
