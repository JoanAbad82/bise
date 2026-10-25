# bend/proofs/forward.bend: the proofs of bend/laws/forward.bend. Each
# holds by unfolding: the setters open the request's record, the door's
# pick turns on the forwarder's `mine`, and an empty note or parts string
# picks the branch that adds nothing.
import Base
import ../hub/gen/state.bend as HS
import ../hub/gen/state-laws.bend as HSL
import ../hub/core.bend as HC
import ../hub/newtask.bend as HNT
import ../hub/forward.bend as HFW
import ../laws/forward.bend as Laws

def Laws.forward_records_source(s, m, at):
  match s:
    case HC.Snd{from, to, text, expect, reply_to, plain, auto, queued, via, parts, fwd}:
      {==}

def Laws.forward_brief_records_source(t, m, at):
  match t:
    case HC.NewTask{parent, base, brief, brief_text, objective, worktree, with_changes, parts, fwd}:
      {==}

def Laws.forward_only_own(names, m, id, e):
  %Equal.sym(Bool, HFW.mine(names, m), False{}, e) : {HFW.door.pick(_, m) == HFW.FErr{HFW.not_yours(HS.Msg.id(m))} : HFW.Door}
  {==}

def Laws.forward_own_passes(names, m, id, e):
  %Equal.sym(Bool, HFW.mine(names, m), True{}, e) : {HFW.door.pick(_, m) == HFW.FOk{m} : HFW.Door}
  {==}

def Laws.forward_unknown(names, id):
  {==}

def Laws.forward_keeps_text(note, m, by, at):
  {==}

def Laws.forward_no_note(m, by, at):
  {==}

def Laws.forward_names_source(m, by):
  {==}

def Laws.forward_no_parts(note, m, by, at):
  %Equal.sym(String, HS.Msg.parts(HS.Msg.with_parts(m, "")), "", HSL.Msg.parts.get_with(m, "")) : {HNT.brief_parts(HFW.lead(note, HS.Msg.with_parts(m, ""), by, at), _) == "" : String}
  {==}
