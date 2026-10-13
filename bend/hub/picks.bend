# hub/picks.bend — a card's options and his pick (inbox picks, architect
# m_22243): which answer is one of the card's options, and that option's
# words. Pure; core.bend writes the route line with them (answer_rec).
import Base

import ../vendor/json.bend as J

# a when b is true, else c, only the one taken computed (core's pick_lazy)
def lazy(-A: Type, c: Bool, a: Unit -> A, b: Unit -> A) -> A:
  match c:
    case True{}:
      a(Unit{})
    case False{}:
      b(Unit{})

# his pick: the option's number and its words, both or neither
type Pick is Data:
  Pick{n: Nat, words: String}

def digits(cs: List<&2, Char>) -> Bool:
  match cs:
    case Nil{}:
      True{}
    case Con{+h, +t}:
      Char.is_digit(h) && digits(t)

# an option's number (`1`), not words
def is_number(+t: String) -> Bool:
  +s = String.trim(t)
  Bool.pick(Bool, String.is_empty(s), False{}, digits(String.to_list(s)))

def opt_line(+l: String, +n: String) -> Bool:
  String.starts_with(l, String.append(n, ".")) || String.starts_with(l, String.append(n, ")"))

def any_opt(xs: List<&2, String>, +n: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      opt_line(String.trim(h), n) || any_opt(t, n)

# one of the card's options: a number with its line (`2.` or `2)`) in the
# card's text
def is_option(+card: String, +t: String) -> Bool:
  is_number(t) && any_opt(String.lines(card), String.trim(t))

# the words of the first line `n.` / `n)` in xs, past its mark
def opt_words(xs: List<&2, String>, +n: String) -> Maybe<&2, String>:
  match xs:
    case Nil{}:
      None{}
    case Con{+h, +t}:
      +l = String.trim(h)
      lazy(Maybe<&2, String>, opt_line(l, n), u => Some{String.trim(String.drop(l, Nat.add(String.length(n), 1n)))}, u => opt_words(t, n))

# his pick (inbox picks, architect m_22243): an option's number and that
# option's words (`2` on '2. only at checkout' -> 2, 'only at
# checkout'); words, or a number that isn't an option: none. `said`
# stays what he said
def option_words(+card: String, +t: String) -> Maybe<&2, String>:
  lazy(Maybe<&2, String>, is_option(card, t), u => opt_words(String.lines(card), String.trim(t)), u => None{})

def pick_of(n: Maybe<&2, Nat>, +w: Maybe<&2, String>) -> Maybe<&2, Pick>:
  match n:
    case None{}:
      None{}
    case Some{+k}:
      match w:
        case None{}:
          None{}
        case Some{+x}:
          Some{Pick{k, x}}

def option_pick(+card: String, +t: String) -> Maybe<&2, Pick>:
  pick_of(J.parse_nat(String.trim(t)), option_words(card, t))

def pick_n(p: Maybe<&2, Pick>) -> Maybe<&2, Nat>:
  match p:
    case None{}:
      None{}
    case Some{+k}:
      match k:
        case Pick{+n, _}:
          Some{n}

def pick_words(p: Maybe<&2, Pick>) -> Maybe<&2, String>:
  match p:
    case None{}:
      None{}
    case Some{+k}:
      match k:
        case Pick{_, +w}:
          Some{w}
