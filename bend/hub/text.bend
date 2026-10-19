# hub/text.bend: one-line and clipped text for the hub's notes (util::one_line,
# util::clip, util::clip_tail), moved out of model.bend (the 1,000-line gate,
# when the messages split in two: issue 21 steps 3-4).
import Base

import ./model.bend as M

def one_line.push(empty: Bool, +word: String, +acc: List<&2, String>) -> List<&2, String>:
  match empty:
    case True{}:
      acc
    case False{}:
      M.snoc(String, acc, String.reverse(word))

# matches, not Bool.pick: pick would push (snoc, reverse) at every char
def one_line.word(space: Bool, +c: Char, +word: String) -> String:
  match space:
    case True{}:
      ""
    case False{}:
      SCon{c, word}

def one_line.acc(space: Bool, +word: String, +acc: List<&2, String>) -> List<&2, String>:
  match space:
    case True{}:
      one_line.push(String.is_empty(word), word, acc)
    case False{}:
      acc

# one line: whitespace runs collapse (util::one_line)
def one_line.go(s: String, +word: String, +acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      one_line.push(String.is_empty(word), word, acc)
    case SCon{+c, +t}:
      one_line.go(t, one_line.word(Char.is_space(c), c, word), one_line.acc(Char.is_space(c), word, acc))

def one_line(+s: String) -> String:
  String.join(one_line.go(s, "", Nil{}), " ")

# at most `max` chars, with an ellipsis when cut (util::clip)
def clip.pick(fits: Bool, +s: String, +max: Nat) -> String:
  match fits:
    case True{}:
      s
    case False{}:
      String.append(String.take(s, Nat.sub(max, 1n)), "…")

def clip(+s: String, +max: Nat) -> String:
  clip.pick(Nat.is_le(String.length(s), max), s, max)

# the last `max` chars, after an ellipsis when cut (util::clip_tail)
def clip_tail.pick(fits: Bool, +s: String, +max: Nat) -> String:
  match fits:
    case True{}:
      s
    case False{}:
      String.append("…", String.drop(s, Nat.sub(String.length(s), Nat.sub(max, 1n))))

def clip_tail(+s: String, +max: Nat) -> String:
  clip_tail.pick(Nat.is_le(String.length(s), max), s, max)

# the agents whose names are close to `target` (its first letter, or it
# inside them), main aside, as `@name`s: the 'did you mean' of an unknown
# `@target` (moved out of core.bend unchanged: its line limit)
def close_names(xs: List<&2, String>, +target: String) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+n, +t}:
      +rest = close_names(t, target)
      +first = String.take(target, 1n)
      Bool.pick(List<&2, String>, Bool.not(String.eq(n, M.MAIN())) && (String.starts_with(n, Bool.pick(String, String.is_empty(first), "?", first)) || String.contains(n, target)),
        String.append("@", n) <> rest, rest)
