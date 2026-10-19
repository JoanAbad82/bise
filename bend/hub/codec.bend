# hub/codec.bend — the records inside sb-core's journal lines and its
# messages as JSON (a route...; a message, a card, a timer, an act, a watch: gen/state-codec.bend), in the exact
# serde format of rust/switchboard/src/model.rs, each with its round law.
# The lines themselves are generated (gen/journal.bend, from
# bise_proto::core::journal): a new journal kind is a row there, never a
# branch here.
import Base

import ../vendor/json.bend as J

import ./model.bend as M

import ./xhub-model.bend as XH

def jmaybe_nat(m: Maybe<&2, Nat>) -> J.Json:
  match m:
    case None{}:
      J.JNull{}
    case Some{+n}:
      J.JNum{n}

def jmaybe_str(m: Maybe<&2, String>) -> J.Json:
  match m:
    case None{}:
      J.JNull{}
    case Some{+s}:
      J.JStr{s}

# ---- decoding (the journal replayed at boot) ----

def get_nat(+j: J.Json, +k: String) -> Nat:
  J.get_num_or(j, k, 0n)

def get_s(+j: J.Json, +k: String) -> String:
  J.get_str_or(j, k, "")

def get_b(+j: J.Json, +k: String) -> Bool:
  J.get_bool_or(j, k, False{})

def get_j(+j: J.Json, +k: String) -> J.Json:
  Maybe.default(&2, J.Json, J.get(j, k), J.JNull{})

def opt_nat(m: Maybe<&2, J.Json>) -> Maybe<&2, Nat>:
  match m:
    case Some{J.JNum{+n}}:
      Some{n}
    case _:
      None{}

def opt_str(m: Maybe<&2, J.Json>) -> Maybe<&2, String>:
  match m:
    case Some{J.JStr{+s}}:
      Some{s}
    case _:
      None{}


# ---- the records inside a journal line, for gen/journal.bend (one codec
# per record; journal.rs's Codec rows name them) ----





# ---- each record reads back what it writes (gen/journal-laws.bend's
# round laws go through these) ----


