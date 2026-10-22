# core/obs.bend — observation rendering, pure.
#
# Every obs renders as ONE record line, `obs <kind> :: <json>` (issue 38):
# the wire contract, written by the encoders generated from
# bise_proto::thread::obs::ObsRec (gen/obs.bend, keys sorted, each proven
# equal to its fixture line in proofs/obs.bend) and read by the clients
# through bise_proto's lines::read. The older text form (`  obs: …`) is
# only read, in rust/proto/src/thread/legacy.rs, for older transcripts.
import Base
import ./types.bend as T
import ./wire.bend as W
import ./gen/obs.bend as OG

# a preview must stay on ONE wire line: newlines become spaces (a raw
# newline in an obs splits it, and the client reads the tail as noise).
# In-session texts carry newlines escaped (backslash-n, the wire
# convention): the preview unescapes them first, then flattens.
def one_line.code(nl: Bool, c: U32) -> U32:
  match nl:
    case True{}:
      32
    case False{}:
      c

def one_line(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{+c}, +t}:
      SCon{Chr{one_line.code(U32.is_eq(c, 10), c)}, one_line(t)}

def show_obs(o: T.Obs) -> String:
  match o:
    case T.TurnStarted{}:
      OG.turn_started()
    case T.SteerReceived{text}:
      OG.steering_received(text)
    case T.Steered{text}:
      OG.steered(text)
    case T.NotifReceived{text}:
      OG.notification_received(text)
    case T.NotifDelivered{text}:
      OG.notification_delivered(text)
    case T.CandidateDiscarded{cause}:
      OG.candidate_discarded(cause)
    case T.Assistant{text}:
      OG.assistant(text)
    case T.ToolStarted{call}:
      OG.tool_started(U32.to_nat(call))
    case T.ToolFinished{call, ok}:
      OG.tool_finished(U32.to_nat(call), ok)
    case T.ToolCommitted{call}:
      OG.tool_result_committed(U32.to_nat(call))
    case T.CompactionStarted{compaction, auto}:
      OG.compaction_started(U32.to_nat(compaction), auto)
    case T.CompactionFailed{code}:
      OG.context_compaction_failed(code)
    case T.CompactionDone{summary}:
      OG.compaction_done(String.append(String.take(one_line(String.trim(W.unescape_nl(summary))), 40n), "..."))
    case T.NullIteration{}:
      OG.null_iteration()
    case T.TurnDone{end, why}:
      OG.turn_done(end, why)
