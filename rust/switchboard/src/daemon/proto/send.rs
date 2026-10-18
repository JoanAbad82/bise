//! `turn/send`'s result (A1, send-reason, architect m_30519): what the
//! hub did with his words, from what the input handler took
//! (`daemon/capsule.rs` [`Took`]) and the id sb-core gave his message
//! (`Hub::said`). A message: its id, `made`; none: why (a page took it,
//! it was routed to a project, a command ran), so the sender's row settles
//! on the result, never on words. Pure; `proto_input` (cmds.rs) answers it.
//! Client socket only (issue 16).

use super::super::capsule::Took;
use bise_proto::rpc::{SendReason, SendResult};

/// The result of one `turn/send`: `said` the id of the message sb-core
/// made in the step (none: it made none). A page that took his words
/// may write a message of its own in the same step (its notes to the
/// page's agent, in that agent's thread): never his send's, so no id.
pub(super) fn send_result(took: Took, said: Option<u64>) -> SendResult {
    let (msg_id, reason) = match (took, said) {
        (Took::Page, _) => (None, SendReason::Page),
        (Took::Routed, _) => (None, SendReason::Routed),
        (Took::Stepped, Some(id)) => (Some(id), SendReason::Made),
        (Took::Stepped, None) => (None, SendReason::Command),
    };
    SendResult { msg_id, reason: Some(reason) }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_message_is_made_with_its_id_else_the_reason_why_none() {
        let r = |took, said| send_result(took, said);
        assert_eq!(r(Took::Stepped, Some(7)), SendResult { msg_id: Some(7), reason: Some(SendReason::Made) });
        assert_eq!(r(Took::Page, None), SendResult { msg_id: None, reason: Some(SendReason::Page) });
        // the page's own note to its agent, made in the same step, is not his send's
        assert_eq!(r(Took::Page, Some(8)), SendResult { msg_id: None, reason: Some(SendReason::Page) });
        assert_eq!(r(Took::Routed, None), SendResult { msg_id: None, reason: Some(SendReason::Routed) });
        assert_eq!(r(Took::Routed, Some(9)), SendResult { msg_id: None, reason: Some(SendReason::Routed) });
        assert_eq!(r(Took::Stepped, None), SendResult { msg_id: None, reason: Some(SendReason::Command) });
    }
}
