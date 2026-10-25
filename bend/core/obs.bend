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
import ./gen/obs.bend as OG

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
    # the whole summary, exactly the one the model gets after the
    # compaction (compaction.bend summary_message, what --resume injects
    # again), never a preview: the thread unfolds it as markdown. The
    # JSON encoder escapes its newlines, tabs and quotes, so it stays one
    # wire line.
    case T.CompactionDone{summary}:
      OG.compaction_done(summary)
    case T.NullIteration{}:
      OG.null_iteration()
    case T.TurnDone{end, why}:
      OG.turn_done(end, why)
