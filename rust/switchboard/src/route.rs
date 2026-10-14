//! His explicit address to a project (bise desktop S2, route-name,
//! architect m_24939): bise's home hub sends his words to a project only
//! when he wrote `@<project> …` (a registered project's name, its first
//! word), never because a name, a front file, a page or a recent thread
//! points there. Anything else stays with bise's main, which forwards
//! with `sb project send --input` when it decides. Pure: no I/O; the home
//! hub's shell (daemon/routing.rs) gives the projects, checks that no
//! local agent has that name (an agent wins), and steps the hold.

/// A project his words may be addressed to.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Candidate {
    /// its hub id (`bise_home::hub_id`): what a route names
    pub id: String,
    /// its name in the projects list
    pub name: String,
}

/// The `@name` his words start with, and the words after it (None: no
/// address, or nothing after it).
pub fn address(text: &str) -> Option<(&str, &str)> {
    let rest = text.trim_start().strip_prefix('@')?;
    let (name, words) = rest.split_once(char::is_whitespace)?;
    let name = name.trim_end_matches([':', ',']);
    (!name.is_empty() && !words.trim().is_empty()).then_some((name, words))
}

/// The project his words are addressed to: `@<its name> words` (case
/// aside); None for anything else.
pub fn addressed<'a>(text: &str, projects: &'a [Candidate]) -> Option<&'a Candidate> {
    let (name, _) = address(text)?;
    projects.iter().find(|c| c.name.eq_ignore_ascii_case(name))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn world() -> Vec<Candidate> {
        ["harness", "checkout", "rapid-site"].iter().map(|n| Candidate { id: format!("{n}-1a2b"), name: n.to_string() }).collect()
    }

    fn to(text: &str) -> Option<String> {
        addressed(text, &world()).map(|c| c.id.clone())
    }

    #[test]
    fn an_explicit_address_routes() {
        assert_eq!(to("@harness fix the login").as_deref(), Some("harness-1a2b"));
        assert_eq!(to("  @Harness: fix the login").as_deref(), Some("harness-1a2b"));
        assert_eq!(to("@rapid-site, the hero").as_deref(), Some("rapid-site-1a2b"));
        assert_eq!(to("@checkout\nthe card form").as_deref(), Some("checkout-1a2b"));
    }

    // regress (his m_75): words ABOUT a project, sent to bise's main, stay
    #[test]
    fn a_name_in_his_words_never_routes() {
        for t in [
            "je les voie pas dans harness non plus",
            "au fait demande a harness de faire en sorte que…",
            "harness: is it green?",
            "what's the state of checkout?",
            "tell @harness to fix it",
            "check ~/code/harness/out.txt",
            "see https://github.com/acme/harness/pull/3",
        ] {
            assert_eq!(to(t), None, "{t}");
        }
    }

    #[test]
    fn an_address_needs_a_known_project_and_words() {
        assert_eq!(to("@harness"), None, "no words");
        assert_eq!(to("@harness   "), None, "no words");
        assert_eq!(to("@telemetry fix it"), None, "not a project");
        assert_eq!(to("@harnes fix it"), None, "no near match");
        assert_eq!(to("@ harness fix it"), None);
        assert_eq!(addressed("@harness fix it", &[]), None);
    }

    #[test]
    fn the_address_is_read_once() {
        assert_eq!(address("@harness: fix it"), Some(("harness", "fix it")));
        assert_eq!(address("fix @harness now"), None);
    }
}
