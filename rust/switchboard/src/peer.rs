//! Who sent a request on a hub's two sockets (docs/issues/16 and 17;
//! issue 37 #2), as sb-core reads it. The shell (`daemon/accept.rs`,
//! `peer_os.rs`) reads the peer's pid and the process table; the judge
//! (`bise_peer::judge`, shared with the computer-use broker,
//! docs/issues/18) says who the peer is: the user's own process, an agent
//! of this hub or of a sibling hub (another project's, same `hubs/`
//! folder), or nothing readable. [`Sender`] carries that fact and the
//! socket into sb-core's inputs (`req`, `speaks`); sb-core decides whether
//! it may speak as the request's `from` (bend/hub/peer.bend `speaker`):
//! the judge owns "who", sb-core owns "may". It fails closed: a fact
//! sb-core does not know reads `gone` and is refused, and no request is
//! served without sb-core's ok.
//!
//! What each socket serves at all is a protocol table read before the
//! loop (`bise_proto::socket::access`), and the `hello` gate on hub.sock
//! (`Who::refusal_of`) stays here in Rust, on the accept thread: an agent's
//! flood of connections never reaches the loop.

pub use bise_peer::judge::{judge, HubSide, Who};
pub use bise_proto::socket::{access, Access, Sock};

/// A request's sender as sb-core's inputs carry it (`who`, `dir`,
/// `sock`): the judge's fact on its process and the socket it came on,
/// or the hub's own request (`hub`: no peer, no socket).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Sender {
    /// `outside` (the user's process), `hub`, `agent`, `other_hub`, `gone`
    pub who: String,
    /// the agent folder of an `agent` or `other_hub` ("" else)
    pub dir: String,
    /// `agent` (agent.sock), `client` (hub.sock), "" for the hub's own
    pub sock: String,
}

impl Sender {
    /// The hub's own request (a report it makes for an agent, a card it
    /// opens, bise's home hub asking through `xin`).
    pub fn hub() -> Sender {
        Sender { who: "hub".into(), dir: String::new(), sock: String::new() }
    }

    /// sb-core's `speaks` input: may this sender speak as `from`?
    pub fn speaks(self, token: u64, from: String, cmd: String) -> bise_proto::core::input::Speaks {
        bise_proto::core::input::Speaks { token, from, cmd, who: self.who, dir: self.dir, sock: self.sock }
    }

    /// The judge's verdict `who` on a request that came on `sock`.
    pub fn of(who: &Who, sock: Sock) -> Sender {
        let (w, dir) = match who {
            Who::Outside => ("outside", String::new()),
            Who::Agent(d) => ("agent", d.clone()),
            Who::OtherHub(d) => ("other_hub", d.clone()),
            Who::Gone => ("gone", String::new()),
        };
        Sender { who: w.into(), dir, sock: sock.word().into() }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_sender_carries_the_judges_fact_and_the_socket() {
        let s = |w: &Who| Sender::of(w, Sock::Agent);
        assert_eq!(s(&Who::Outside), Sender { who: "outside".into(), dir: "".into(), sock: "agent".into() });
        assert_eq!(s(&Who::Agent("old_t1".into())), Sender { who: "agent".into(), dir: "old_t1".into(), sock: "agent".into() });
        assert_eq!(s(&Who::OtherHub("t2".into())).who, "other_hub");
        assert_eq!(s(&Who::Gone).who, "gone");
        assert_eq!(Sender::of(&Who::Outside, Sock::Client).sock, "client");
        assert_eq!(Sender::hub(), Sender { who: "hub".into(), dir: "".into(), sock: "".into() });
    }
}
