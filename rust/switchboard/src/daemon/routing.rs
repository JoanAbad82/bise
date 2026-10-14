//! bise's home hub routes his words (bise desktop S2 step 3; route-name,
//! architect m_24939): named routing, not route: [`crate::route`] is the
//! pure parser of his explicit address it calls.
//!
//! His plain words to bise's main come here before sb-core sees them:
//! [`Shell::route_input`] reads `@<project> …` with [`crate::route::addressed`]
//! against the registry's projects, and when he addressed one (and no
//! agent of this hub has that name: an agent wins) steps sb-core with
//! `Input::RouteHold` (sb-core holds it 2 s for his correction, then
//! forwards it) instead of the user input. Anything else: false, the
//! caller steps his input to bise's main unchanged; main forwards with
//! `sb project send --input` when it decides. No guess: a project's name
//! in his words, the front file, page or title, a project's recent
//! threads never route (his m_75: words ABOUT a project stayed with bise).
//!
//! Read-only: never starts a hub, never writes.

use super::Shell;
use crate::core::Input;
use crate::model::MAIN;
use crate::route::{self, Candidate};

impl Shell {
    /// His input to bise's main goes to a project when he addressed it
    /// (true: sb-core was stepped with `RouteHold`); false: not routed,
    /// the caller steps the input as today.
    /// `context`: the input's fn context as it came, carried to the
    /// project (never read here). `text`: his words (the address is read
    /// from them); `held`: what goes to the project, his words with his
    /// attached files already rendered once (item H). `parts`: his
    /// message's parts (msg-parts JSON, "" none), held and forwarded with
    /// his words (R41 (6)). His words go whole, `@<project>` included.
    #[allow(clippy::too_many_arguments)]
    pub(super) fn route_input(&mut self, focus: &str, text: &str, held: &str, via: &str, queued: bool, context: Option<&serde_json::Value>, parts: &str) -> bool {
        if !routable(focus, text, via, queued) || !crate::paths::is_home(&self.opts.paths.workspace) {
            return false;
        }
        // an agent of this hub by that name: his `@name` is for it
        if route::address(text).is_some_and(|(name, _)| self.hub.st.resolve(name).is_some()) {
            return false;
        }
        let home = bise_home::Home::from_env();
        let rows = bise_home::projects::list(&home, &crate::paths::home_workspace());
        let projects: Vec<Candidate> = rows.iter().filter(|r| !r.home).map(|r| Candidate { id: r.id.clone(), name: r.name.clone() }).collect();
        let Some(c) = route::addressed(text, &projects) else { return false };
        let (to, name) = (c.id.clone(), c.name.clone());
        let why = format!("you wrote @{name}");
        self.step(Input::RouteHold { text: held.to_string(), via: via.to_string(), to, name, why, context: context.cloned(), parts: parts.to_string() });
        true
    }
}

/// Words that may go to a project: to main, sent now, not a command (an
/// `/answer` included), not fn space's 'start an agent' (bise's main
/// starts it), not empty.
fn routable(focus: &str, text: &str, via: &str, queued: bool) -> bool {
    let t = text.trim_start();
    (focus.is_empty() || focus == MAIN) && !queued && !t.is_empty() && !t.starts_with('/') && via != "capsule-start"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_plain_words_to_main_now_are_routed() {
        assert!(routable("", "@shop the checkout is slow", "", false));
        assert!(routable(MAIN, "@shop the checkout is slow", "capsule", false));
        assert!(!routable("docs", "@shop the checkout is slow", "", false), "to another agent");
        assert!(!routable(MAIN, "@shop the checkout is slow", "", true), "queued");
        assert!(!routable(MAIN, "/answer 3 yes", "", false), "a command");
        assert!(!routable(MAIN, "  ", "", false), "empty");
        assert!(!routable(MAIN, "@shop fix it", "capsule-start", false), "start an agent");
    }
}
