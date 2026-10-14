# bend/laws/inbox.bend: the inbox's history (inbox-record, architect
# m_24257): what a card's close journals of his answer, and its position
# in the asker's thread (hub/answers.bend). Closed by bend/proofs/inbox.bend;
# the gate checks every bend/proofs/*.bend: a law here with no proof there
# fails it.
import Base
import ../hub/model.bend as HM
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/answers.bend as HA
import ../hub/picks.bend as HPK

# LAW: a card closed without him (withdrawn, closed, an agent stopped)
# journals no answer.
law closed_without_him_has_no_answer:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +id: Nat
  for +res: String
  {HC.close_card(o, cx, id, res) == HC.close_card_ans(o, cx, id, res, HM.no_ans()) : HX.Cx<o>}

# LAW: his answer to a question journals his words as he said them, and
# the option's words when he picked by its number (the pick of the route
# line, picks.bend): the history never reads the digit alone.
law answered_close_carries_his_words:
  for +c: HM.Card
  for +said: String
  for +via: String
  {HA.his_ans(c, said, via) == HM.Ans{said, HPK.pick_n(HPK.option_pick(HM.Card.text(c), said)), HA.opt_words(HPK.pick_words(HPK.option_pick(HM.Card.text(c), said))), via, "", ""} : HM.Ans}

# LAW: the digit `2` on '2. only at checkout' journals the option's words.
law a_picked_digit_journals_its_words:
  {HA.his_ans(HM.Card{7n, "question", "perf", "which one?
1. at every step
2. only at checkout", None{}, 0n, None{}, None{}}, "2", "inbox") == HM.Ans{"2", Some{2n}, "only at checkout", "inbox", "", ""} : HM.Ans}

# LAW: an approval's digit journals its words (1 allow, 2 always, 3 no).
law an_approval_digit_journals_its_words:
  {HA.confirm_ans(" 2 ", "inbox") == HM.Ans{"2", Some{2n}, "always", "inbox", "", ""} : HM.Ans}

# LAW: a card not due (closed without him, or its position given
# already) takes no position: nothing changes.
law answer_pos_not_due:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +card: Nat
  for +agent: String
  for +pos: Nat
  {HA.answer_pos.go(o, False{}, cx, card, agent, pos) == cx : HX.Cx<o>}

# LAW: the position is journaled at most once per card: a second
# answer_pos for the same card changes nothing.
law answer_pos_once:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +card: Nat
  for +agent: String
  for +pos: Nat
  for +agent2: String
  for +pos2: Nat
  {HA.answer_pos(o, HA.answer_pos(o, cx, card, agent, pos), card, agent2, pos2) == HA.answer_pos(o, cx, card, agent, pos) : HX.Cx<o>}
