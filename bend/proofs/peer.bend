# bend/proofs/peer.bend: the proofs of bend/laws/peer.bend. Each unfolds
# speaker's picks on the fact's word; the sock law rewrites with its
# premise; the table and the fixture compute.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/peer.bend as HPR
import ../hub/lazy.bend as HLZ
import ../laws/peer.bend as Laws

def Laws.speaker_outside_any(st, dir, from):
  {==}

def Laws.speaker_hub_any(st, dir, from):
  {==}

def Laws.speaker_other_hub_refused(st, dir, from):
  {==}

def Laws.speaker_gone_refused(st, dir, from):
  {==}

def Laws.speaker_unknown_refused(st, dir, from):
  {==}

def Laws.speaker_agent_only_itself(a, from):
  {==}

def Laws.speaker_unknown_folder(dir, from):
  {==}

def Laws.agent_req_only_on_agent_sock(st, who, dir, from, e):
  %Equal.sym(Bool, String.eq(who, "hub") || String.eq("client", "agent"), False{}, e) : {HLZ.pick(Maybe<&2, String>, _, u => HPR.speaker(st, who, dir, from), u => Some{HPR.SOCK_REFUSED()}) == Some{HPR.SOCK_REFUSED()} : Maybe<&2, String>}
  {==}

def Laws.req_refused_says_only_why(o, cx, token, from, q, why):
  {==}

def Laws.req_ok_runs(o, cx, token, from, q):
  {==}

def Laws.speaker_table():
  {==}

def Laws.speaker_words():
  {==}

def Laws.agent_key_fixture():
  {==}
