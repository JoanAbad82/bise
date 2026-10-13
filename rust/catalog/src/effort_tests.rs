//! effort-table: each default model's reasoning-effort list, and the Bend
//! runtime's copy of the family lists.
use super::*;

fn no_env(_: &str) -> Option<String> {
    None
}

#[test]
fn each_default_model_has_its_own_list() {
    let s = Setup::from_text(Some(""), &no_env);
    let c = &s.catalog;
    // Opus 5.5 takes Claude's xhigh ("extra high"), high stays its default
    for id in ["anthropic/claude-opus-5-5", "foundry/claude-opus-5-5"] {
        let opus = c.resolve(id);
        assert_eq!(opus.efforts(), ["none", "low", "medium", "high", "xhigh", "max"], "{id}");
        assert_eq!(opus.default_effort(), "high");
        assert_eq!(opus.effort_for("xhigh"), "xhigh");
    }
    // Haiku's efforts are budget sizes: no xhigh
    assert_eq!(c.resolve("anthropic/claude-haiku-4-5").efforts(), ["none", "low", "medium", "high", "max"]);
    // OpenRouter refuses none on Claude; grok-4.7 always reasons, takes xhigh
    assert_eq!(c.resolve("openrouter/anthropic/claude-opus-5.5").efforts(), ["low", "medium", "high", "xhigh", "max"]);
    assert_eq!(c.resolve("xai/grok-4.7").efforts(), ["low", "medium", "high", "xhigh"]);
    assert_eq!(c.resolve("google/gemini-3.8-flash").efforts(), ["low", "medium", "high"]);
}

/// The Bend runtime has its own copy of the family lists
/// (runtime/provider-pure.bend anth_efforts, chat_efforts) until it reads
/// them from the models file: they must say the same as the catalog.
#[test]
fn the_runtime_family_efforts_are_the_catalogs() {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../bend/runtime/provider-pure.bend");
    let src = std::fs::read_to_string(path).unwrap();
    let list = |def: &str| -> Vec<String> {
        let at = src.find(&format!("def {def}() -> List<&2, String>:")).unwrap_or_else(|| panic!("no {def} in {path}"));
        let line = src[at..].lines().nth(1).unwrap().trim();
        line.trim_matches(|c| c == '[' || c == ']').split(',').map(|w| w.trim().trim_matches('"').to_string()).collect()
    };
    assert_eq!(list("anth_efforts"), ANTHROPIC_EFFORTS.map(String::from).to_vec());
    assert_eq!(list("chat_efforts"), CHAT_EFFORTS.map(String::from).to_vec());
}
