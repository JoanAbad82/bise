# hub/reach.bend — who a message from bise reaches, and when (wake-deliver,
# the user's « répondre … devrait toujours réveiller l'agent … s'il est déjà
# actif, au milieu du turn comme une notification »): the pure decisions
# behind a timer's fire, a watch's wake and a page answer's word to the
# card's asker.
#
# - an agent (by its name or an old one) and whether it is active;
# - `reachable`: a run a wake reaches NOW. Idle: it starts a turn. Busy: it
#   is steered into the turn (pump's steer, like `sb send`'s default
#   --mode steer). Starting or down: it stays queued until the REPL is up.
# - a page question answered (`page_answered`): the card's asker (main, who
#   opened the page's card) hears it too when the page's agent is another
#   agent, in one message from bise with his answer.
#
# Not here: the send, the pump and the pause guard (core.bend: a paused
# project delivers and steers nothing, laws paused_delivers_nothing and
# timer_held_while_paused). Laws in bend/laws/hub.bend: wake_steers_busy,
# busy_steers_now, timer_fires_busy, timer_reaches_busy,
# page_answer_tells_asker.
import Base

import ./model.bend as M
import ./wakes.bend as WK

# a message from bise in `xs` (a wake not delivered yet: law
# wake_never_stacked)
def from_bise(xs: List<&2, M.Msg>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      String.eq(M.Msg.from(h), M.HUB()) || from_bise(t)

def agent_of.go(+s: M.St, m: Maybe<&2, String>) -> Maybe<&2, M.Agent>:
  match m:
    case None{}:
      None{}
    case Some{+n}:
      M.get_agent(s, n)

# the agent named `n` (its name or an old one)
def agent_of(+s: M.St, +n: String) -> Maybe<&2, M.Agent>:
  agent_of.go(s, M.resolve(s, n))

def life_active(l: M.Life) -> Bool:
  match l:
    case M.LActive{}:
      True{}
    case _:
      False{}

def agent_active.go(m: Maybe<&2, M.Agent>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+a}:
      life_active(M.Agent.life(a))

# known (by its name or an old one) and active
def agent_active(+s: M.St, +n: String) -> Bool:
  agent_active.go(agent_of(s, n))

# a wake reaches this run now: idle (a turn starts) or busy (steered in)
def reachable(r: M.Run) -> Bool:
  match r:
    case M.RIdle{}:
      True{}
    case M.RBusy{}:
      True{}
    case _:
      False{}

def same(a: Maybe<&2, String>, b: Maybe<&2, String>) -> Bool:
  match a:
    case None{}:
      False{}
    case Some{+x}:
      match b:
        case None{}:
          False{}
        case Some{+y}:
          String.eq(x, y)

# the card's asker hears a page answer when it is a known agent and not
# the page's agent (that one got the pick already): `asker`, `to` resolved
def tells_asker(+asker: Maybe<&2, String>, +to: Maybe<&2, String>) -> Bool:
  Maybe.is_some(&2, String, asker) && Bool.not(same(asker, to))

# the asker's message: which card, which page, who got the pick, his words
def answer_words(+card: Nat, +page: String, +to: String, +text: String) -> String:
  String.concat(["the user answered card #", Nat.show(card), " on the page ", page, " (its pick went to @", to, "): \"",
    M.one_line(text), "\""])

# ---- a reply still pending (ask-wait, core.bend replies_tick) ----

def life_gone(l: M.Life) -> Bool:
  match l:
    case M.LArchived{}:
      True{}
    case _:
      False{}

# the asked agent is gone: dropped (archived), or no agent of that name
def asked_gone.go(m: Maybe<&2, M.Agent>) -> Bool:
  match m:
    case None{}:
      True{}
    case Some{+a}:
      life_gone(M.Agent.life(a))

def asked_gone(+s: M.St, +n: String) -> Bool:
  asked_gone.go(agent_of(s, n))

# the reply watches whose asked agent is gone (dropped, or no such agent)
def replies_orphan(+s: M.St, xs: List<&2, WK.Watch>) -> List<&2, WK.Watch>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(List<&2, WK.Watch>, WK.is_reply(h) && asked_gone(s, WK.reply_to_of(h)), h <> replies_orphan(s, t), replies_orphan(s, t))
