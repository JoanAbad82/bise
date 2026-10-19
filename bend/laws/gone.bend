# bend/laws/gone.bend: the withdrawn cards still answerable
# (hub/gone.bend, withdrawn-answer, architect m_30039). Closed by
# bend/proofs/gone.bend; the gate checks every bend/proofs/*.bend.
import Base
import ../hub/gone.bend as G
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC

# LAW: a withdraw keeps the list at MAX cards at most, whatever it held.
law gone_add_bound:
  for +xs: List<&2, HS.Item>
  for +id: Nat
  for +text: String
  {Nat.is_le(List.length(&2, HS.Item, G.add(xs, id, text)), G.MAX()) == True{} : Bool}

# LAW: his late answer delivered keeps it at MAX cards at most too.
law gone_drop_bound:
  for +xs: List<&2, HS.Item>
  for +id: Nat
  {Nat.is_le(List.length(&2, HS.Item, G.drop(xs, id)), G.MAX()) == True{} : Bool}

# LAW: a card just withdrawn is answerable, with its question.
law gone_add_finds:
  for +xs: List<&2, HS.Item>
  for +id: Nat
  for +text: String
  {G.find(G.add(xs, id, text), id) == Some{G.item(id, text)} : Maybe<&2, HS.Item>}

# LAW: once his late answer is delivered, the card is no longer
# answerable: a second answer is today's refusal (the "once").
law gone_drop_once:
  for +xs: List<&2, HS.Item>
  for +id: Nat
  {G.find(G.drop(xs, id), id) == None{} : Maybe<&2, HS.Item>}

# ---- the list in sb-core's state (St.gone, hub/model.bend's apply) ----

# LAW: main's withdraw (card_withdrawn) puts the card in the list...
law gone_withdrawn_adds:
  for +s: HM.St
  for +id: Nat
  for +text: String
  {HM.St.gone(HM.apply(s, HM.ECardWithdrawn{id, text})) == G.add(HM.St.gone(s), id, text) : List<&2, HS.Item>}

# ...his late answer delivered (card_late) takes it out...
law gone_late_drops:
  for +s: HM.St
  for +id: Nat
  {HM.St.gone(HM.apply(s, HM.ECardLate{id})) == G.drop(HM.St.gone(s), id) : List<&2, HS.Item>}

# ...so a replay of both lines leaves it unanswerable, and of the
# withdraw alone answerable with its question.
law gone_replay_withdrawn:
  for +s: HM.St
  for +id: Nat
  for +text: String
  {G.find(HM.St.gone(HM.apply_all([HM.ECardWithdrawn{id, text}], s)), id) == Some{G.item(id, text)} : Maybe<&2, HS.Item>}

law gone_replay_late:
  for +s: HM.St
  for +id: Nat
  for +text: String
  {G.find(HM.St.gone(HM.apply_all([HM.ECardWithdrawn{id, text}, HM.ECardLate{id}], s)), id) == None{} : Maybe<&2, HS.Item>}

# LAW: no journal line grows the list past MAX.
law gone_bound_after_apply:
  for +s: HM.St
  for +e: HM.Ev
  for h: {Nat.is_le(List.length(&2, HS.Item, HM.St.gone(s)), G.MAX()) == True{} : Bool}
  {Nat.is_le(List.length(&2, HS.Item, HM.St.gone(HM.apply(s, e))), G.MAX()) == True{} : Bool}

# LAW: a new hub's list is empty.
law gone_init_empty:
  for +workspace: String
  {HM.St.gone(HM.init(workspace)) == Nil{} : List<&2, HS.Item>}

# ---- his answer to a withdrawn card (withdrawn-answer, architect m_30039) ----
# Main withdraws a card while he answers it: his answer reaches the hub
# after the close. A card not open goes to answer.late: one main withdrew
# and still answerable (hub/gone.bend's list, laws/gone.bend) reaches
# main as a message; any other card keeps the refusal.

# LAW: an answer to a card that isn't open is decided by the withdrawn
# list alone.
law answer_closed_card_is_late:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +id: Nat
  for +text: String
  for +parts: String
  for +via: String
  {HC.answer.card(o, None{}, cx, id, text, parts, via) == HC.answer.late(o, G.find(HM.St.gone(HX.d(o, cx)), id), cx, id, text, parts) : HX.Cx<o>}

# LAW: a card main did not withdraw (or whose late answer went already)
# is refused: one notice, nothing sent, nothing journaled.
law late_answer_refused:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +id: Nat
  for +text: String
  for +parts: String
  {HC.answer.late(o, None{}, cx, id, text, parts) == HC.notice(o, cx, HC.cat(["notification #", HC.ns(id), " isn't open"])) : HX.Cx<o>}

# LAW: a withdrawn card's answer is sent to main, never dropped...
law late_answer_sent:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +it: HS.Item
  for +id: Nat
  for +text: String
  for +parts: String
  {HC.answer.late(o, Some{it}, cx, id, text, parts) == HC.answer.late.sent(o, HC.send(o, cx, HC.late.snd(it, text, parts)), id) : HX.Cx<o>}

# ...once: sent, card_late takes it out of the list (gone_drop_once: a
# second answer is refused)...
law late_answer_once:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +m: HS.Msg
  for +id: Nat
  {HC.answer.late.sent(o, (cx, HC.SOk{m}), id) == HC.emit(o, cx, HM.ECardLate{id}, Unit{}, Unit{}, Unit{}) : HX.Cx<o>}

# ...to main, his words whole after the question's line, his parts
# (images, quotes) on the message.
law late_answer_keeps_its_parts:
  for +it: HS.Item
  for +text: String
  for +parts: String
  {HC.Snd.parts(HC.late.snd(it, text, parts)) == parts : String}

law late_answer_to_main:
  for +it: HS.Item
  for +text: String
  for +parts: String
  {HC.Snd.to(HC.late.snd(it, text, parts)) == HM.MAIN() : String}

law late_answer_keeps_his_words:
  for +it: HS.Item
  for +text: String
  for +parts: String
  {HC.Snd.text(HC.late.snd(it, text, parts)) == String.append(HC.late.head(it), text) : String}
