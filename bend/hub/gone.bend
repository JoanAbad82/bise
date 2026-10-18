# hub/gone.bend — the cards main withdrew (`sb card --withdraw`) that he
# has not answered yet (withdrawn-answer, architect m_30039): his answer
# that reaches the hub after the withdraw still goes to main, once.
# Each card's id and question (main reads what he was answering),
# newest first, MAX at most (the race is seconds: nothing grows forever). sb-core's state holds the list, rebuilt from the journal:
# `card_withdrawn` adds an id, `card_late` (his late answer, delivered)
# takes it out. Pure; its laws are in bend/laws/gone.bend.
import Base
import ./lazy.bend as LZ

# a withdrawn card: its id and its question
type Item is Data:
  Item{id: Nat, text: String}

def Item.id(x: Item) -> Nat:
  match x:
    case Item{+id, _}:
      id

def Item.text(x: Item) -> String:
  match x:
    case Item{_, +text}:
      text

# how many withdrawn cards stay answerable (the newest)
def MAX() -> Nat:
  64n

# the list cut to its newest MAX
def keep(xs: List<&2, Item>) -> List<&2, Item>:
  List.take(&2, Item, xs, MAX())

# the list without `id`
def del(xs: List<&2, Item>, +id: Nat) -> List<&2, Item>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      +rest = del(t, id)
      Bool.pick(List<&2, Item>, Nat.is_eq(Item.id(h), id), rest, h <> rest)

# card `id` withdrawn (`text` its question): first in the list (once),
# the oldest past MAX out
def add(xs: List<&2, Item>, +id: Nat, +text: String) -> List<&2, Item>:
  keep(Item{id, text} <> del(xs, id))

# the withdrawn card `id`, if it is still answerable (None: refused)
def find(xs: List<&2, Item>, +id: Nat) -> Maybe<&2, Item>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, Item>, Nat.is_eq(Item.id(h), id), u => Some{h}, u => find(t, id))

# his late answer to card `id` delivered: out of the list
def drop(xs: List<&2, Item>, +id: Nat) -> List<&2, Item>:
  keep(del(xs, id))
