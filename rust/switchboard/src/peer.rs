//! Who may do what on a hub's two sockets (docs/issues/16). Pure: the
//! socket, the first line's op and a process table in; a decision out.
//! The shell (`daemon/accept.rs`, `peer_os.rs`) reads the peer's pid and
//! the table, and only calls this.
//!
//! - `agent.sock` (the agents' `SB_SOCKET`): agent requests (`agent`,
//!   `version`) and `ping`, nothing else;
//! - `hub.sock` (clients: the TUI, the desktop's core, tests): `hello`
//!   only from a process that is not an agent's ([`judge`]; a peer whose
//!   process is gone is refused), `notice` unless it is proven an agent's;
//!   `xin`/`xreply`/`xfollow` (hub to hub, judged like `hello`);
//!   `ping`. Never an agent request (`agent`, `version`): those are
//!   agent.sock's.
//!
//! Who is an agent's process is `bise_peer::judge` (shared with the
//! computer-use broker, docs/issues/18): this hub's agent or a sibling
//! hub's (another project's, same `hubs/` folder), unless that tag or
//! process is the hub's own owner (a throwaway hub an agent started lets
//! that agent's processes be its clients). It is defense in depth: the
//! sandbox's deny of hub.sock is the wall.
//!
//! Who speaks (docs/issues/17): an agent request (`agent`, `version`, on
//! agent.sock) counts as the agent whose process sent it, whatever its
//! `from` says (`sb` fills it from `SB_AGENT`, which any shell can
//! change). [`speaker`] decides: an agent's process speaks only as that
//! agent; a process with no tag of this hub ([`Who::Outside`]: the
//! user's own shell, tests, scripts, a throwaway hub's owner) may name
//! any `from`, as the user may speak as main. That is the rule, not a
//! gap: the user is not an agent. Gone or unreadable: refused (fail
//! closed). Its refusal words live here once: `sb` prints them, hub.log
//! has them with the peer's pid.

pub use bise_peer::judge::{judge, HubSide, Who};

/// An agent this hub knows, for [`speaker`].
#[derive(Clone, Copy, Debug)]
pub struct Known<'a> {
    pub name: &'a str,
    /// its folder (the dir in its processes' tags)
    pub dir: &'a str,
    pub aliases: &'a [String],
}

/// Whether a request that says `from` may be served, its sender's
/// process being `who` (pure; docs/issues/17). Err: the line `sb` prints.
pub fn speaker(who: &Who, from: &str, agents: &[Known]) -> Result<(), String> {
    match who {
        Who::Outside => Ok(()),
        Who::Agent(dir) => {
            // a tag's dir is kept to [A-Za-z0-9_-] (bise_peer::tags)
            let key = |d: &str| bise_peer::tags::agent_key("", d);
            let Some(me) = agents.iter().find(|a| key(a.dir) == key(dir)) else {
                return Err(format!("this request comes from the process of agent folder {dir}, which this hub does not know: refused"));
            };
            if me.name == from || me.aliases.iter().any(|a| a == from) {
                return Ok(());
            }
            let says = if from.is_empty() { "no one" } else { from };
            Err(format!(
                "this request says it is from {says}, but it comes from agent {}'s process: an agent speaks only as itself (SB_AGENT is not for changing)",
                me.name
            ))
        }
        Who::OtherHub(dir) => Err(format!(
            "this request comes from agent {dir}'s process (another project's hub): an agent speaks only on its own hub"
        )),
        Who::Gone => Err("the hub could not read which process sent this request (gone already?): refused".into()),
    }
}

/// Which socket a connection came in on.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Sock {
    /// `agent.sock`: the agents' `sb`.
    Agent,
    /// `hub.sock`: the user's clients.
    Client,
}

/// What a socket does with a connection's first op.
#[derive(Debug, PartialEq, Eq)]
pub enum Access {
    /// Served to anyone (`ping`).
    Open,
    /// An agent request, served as today (`agent`, `version`).
    Agent,
    /// The user's: served only when [`judge`] says [`Who::Outside`].
    User,
    /// Not served on this socket.
    No,
}

/// What `sock` does with a first line whose op is `op`.
pub fn access(sock: Sock, op: &str) -> Access {
    match (sock, op) {
        (_, "ping") => Access::Open,
        (Sock::Agent, "agent" | "version") => Access::Agent,
        (Sock::Client, "hello" | "notice") => Access::User,
        // hub to hub (desktop S2, `daemon/xhub.rs`): bise's hub and a
        // project's hub talk on each other's hub.sock, as the user's
        (Sock::Client, "xin" | "xreply" | "xfollow") => Access::User,
        _ => Access::No,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_sockets_serve_their_ops() {
        assert_eq!(access(Sock::Agent, "agent"), Access::Agent);
        assert_eq!(access(Sock::Agent, "version"), Access::Agent);
        assert_eq!(access(Sock::Agent, "ping"), Access::Open);
        for op in ["hello", "notice", "stop_hub", "xin", "xreply", "xfollow", ""] {
            assert_eq!(access(Sock::Agent, op), Access::No, "{op}");
        }
        assert_eq!(access(Sock::Client, "hello"), Access::User);
        assert_eq!(access(Sock::Client, "notice"), Access::User);
        for op in ["xin", "xreply", "xfollow"] {
            assert_eq!(access(Sock::Client, op), Access::User, "{op}");
        }
        assert_eq!(access(Sock::Client, "ping"), Access::Open);
        // an agent request is agent.sock's only (the hub.sock shim for
        // REPLs adopted from an older hub went, debt-t3)
        assert_eq!(access(Sock::Client, "agent"), Access::No);
        assert_eq!(access(Sock::Client, "version"), Access::No);
        assert_eq!(access(Sock::Client, "whatever"), Access::No);
    }

    /// The law table of [`speaker`] (docs/issues/17): who may say which
    /// `from`.
    #[test]
    fn an_agent_speaks_only_as_itself() {
        let renamed = vec!["old-t1".to_string()];
        let agents = [
            Known { name: "main", dir: "main", aliases: &[] },
            Known { name: "t1", dir: "old t1", aliases: &renamed },
            Known { name: "t2", dir: "t2", aliases: &[] },
        ];
        let agent = |d: &str| Who::Agent(d.to_string());
        let rows: &[(&str, Who, &str, bool)] = &[
            ("the user's shell may say anything", Who::Outside, "main", true),
            ("the user's shell, no from", Who::Outside, "", true),
            ("an agent as itself", agent("t2"), "t2", true),
            ("main as itself", agent("main"), "main", true),
            ("an agent as main", agent("t2"), "main", false),
            ("an agent as a peer", agent("t2"), "t1", false),
            ("main as an agent", agent("main"), "t2", false),
            ("an agent with no from", agent("t2"), "", false),
            ("a renamed agent, by its tag's dir, as its name", agent("old_t1"), "t1", true),
            ("a renamed agent, as its old name (its REPL's SB_AGENT)", agent("old_t1"), "old-t1", true),
            ("a folder this hub does not know", agent("gone"), "gone", false),
            ("another project's agent", Who::OtherHub("t2".into()), "t2", false),
            ("unreadable: fail closed", Who::Gone, "t2", false),
        ];
        for (why, who, from, ok) in rows {
            assert_eq!(speaker(who, from, &agents).is_ok(), *ok, "{why}");
        }
        let e = speaker(&agent("t2"), "main", &agents).unwrap_err();
        assert!(e.contains("from main") && e.contains("agent t2's process") && e.contains("itself"), "{e}");
        assert!(speaker(&Who::Gone, "t2", &agents).unwrap_err().contains("could not read"));
    }
}
