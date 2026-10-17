# hub/answers.bend — his answer as a card's close journals it, and its
# position in the asker's thread (inbox-record, architect m_24257).
# core.bend closes a card with one of these (close_card_ans); the inbox's
# history reads them from the journal (bise_proto::inbox). The position
# is a fact the shell gives (`answer_pos`): journaled once per card closed
# with his answer while this hub runs (law answer_pos_once). Its laws are
# in bend/laws/inbox.bend.
import Base

import ./model.bend as M
import ./cx.bend as X
import ./picks.bend as PK

def opt_words(m: Maybe<&2, String>) -> String:
  match m:
    case None{}:
      ""
    case Some{+s}:
      s

# his answer to a question card `c`: his words, and the option's words
# when he picked one by its number (law answered_close_carries_his_words)
def his_ans(+c: M.Card, +said: String, +via: String) -> M.Ans:
  +p = PK.option_pick(M.Card.text(c), said)
  M.Ans{said, PK.pick_n(p), opt_words(PK.pick_words(p)), via, "", ""}

# a deny alias (lead m_10900): `no` or `no: <why>`, any case, on the
# lowered trimmed answer; it can only refuse (`nope`, `now` are words)
def is_no(+l: String) -> Bool:
  String.eq(l, "no") || String.starts_with(l, "no:")

# a deny alias is an answer; else the options and the TUI's `deny:`
def confirm_pick(no: Bool, +s: String) -> Bool:
  match no:
    case True{}:
      True{}
    case False{}:
      String.eq(s, "1") || String.eq(s, "2") || String.eq(s, "3") || String.starts_with(String.to_lower(s), "deny:")

# an approval card's answer (the composer rule, lead m_8777): its options
# 1 allow, 2 always, 3 no, the TUI's explicit deny action (`deny: <why>`,
# a refusal with its note) or its aliases `no` and `no: <why>`; typed
# words never answer it
def confirm_ok(+t: String) -> Bool:
  +s = String.trim(t)
  confirm_pick(is_no(String.to_lower(s)), s)

# what a confirm card waits for, said when words are refused
def confirm_opts() -> String:
  "1 allow · 2 always · 3 no · or no: <why>"

# an approval's words: 1 allow, 2 always, 3 no; else what he typed
# (`no: <why>`, `deny: <why>`)
def confirm_words(+s: String) -> String:
  Bool.pick(String, String.eq(s, "1"), "allow",
    Bool.pick(String, String.eq(s, "2"), "always",
      Bool.pick(String, String.eq(s, "3"), "no", "")))

def confirm_n(+s: String) -> Maybe<&2, Nat>:
  Bool.pick(Maybe<&2, Nat>, String.eq(s, "1"), Some{1n},
    Bool.pick(Maybe<&2, Nat>, String.eq(s, "2"), Some{2n},
      Bool.pick(Maybe<&2, Nat>, String.eq(s, "3"), Some{3n}, None{})))

def confirm_ans(+text: String, +via: String) -> M.Ans:
  +s = String.trim(text)
  M.Ans{s, confirm_n(s), confirm_words(s), via, "", ""}

# his plain answer (a drop's yes or no)
def said_ans(+text: String, +via: String) -> M.Ans:
  M.Ans{String.trim(text), None{}, "", via, "", ""}

# his answer on page `page`, question `block` (the option's words: the
# shell already turned a digit into them)
def page_ans(+text: String, +page: String, +block: String) -> M.Ans:
  M.Ans{text, None{}, "", "page", page, block}

def nat_del(xs: List<&2, Nat>, +n: Nat) -> List<&2, Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = nat_del(t, n)
      Bool.pick(List<&2, Nat>, Nat.is_eq(h, n), rest, h <> rest)

def nat_in(xs: List<&2, Nat>, +n: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      Nat.is_eq(h, n) || nat_in(t, n)

# a card whose route line the shell will place (answer_pos): due
def due_add(-o: M.St, +cx: X.Cx<o>, +id: Nat) -> X.Cx<o>:
  +r = X.Cx.r(o, cx)
  X.with_r(o, cx, X.R.with_due(r, M.snoc(Nat, nat_del(X.R.due(r), id), id)))

# {"t":"answer_pos"}: the shell wrote card `card`'s route line in
# `agent`'s transcript at `pos`: journaled when the card is due, once
# (law answer_pos_once); else nothing
def answer_pos.go(-o: M.St, due: Bool, +cx: X.Cx<o>, +card: Nat, +agent: String, +pos: Nat) -> X.Cx<o>:
  match due:
    case True{}:
      +r = X.Cx.r(o, cx)
      +cx2 = X.with_r(o, cx, X.R.with_due(r, nat_del(X.R.due(r), card)))
      X.emit(o, cx2, M.ECardAnswerPos{card, agent, pos}, Unit{}, Unit{}, Unit{})
    case False{}:
      cx

def answer_pos(-o: M.St, +cx: X.Cx<o>, +card: Nat, +agent: String, +pos: Nat) -> X.Cx<o>:
  answer_pos.go(o, nat_in(X.R.due(X.Cx.r(o, cx)), card), cx, card, agent, pos)
