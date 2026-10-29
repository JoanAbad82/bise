use super::*;
use crate::roles;

fn ids(v: &[&str]) -> Vec<String> {
    v.iter().map(|s| s.to_string()).collect()
}

/// Gabriel's plan (token-audit m_33677): no gpt-6.1-sol, the catalog's pick.
fn his_list() -> Vec<String> {
    ids(&["gpt-6-luna", "gpt-5.6-terra", "gpt-5.6-luna"])
}

fn catalog_with(list: Vec<String>) -> Catalog {
    let mut c = Setup::from_text(None, &|_| None).catalog;
    c.plan.listed = vec![("chatgpt".into(), list)];
    c
}

/// pick_among's table (architect m_33692): main listed kept; main absent
/// from the list: the provider's pick when listed, else the first listed;
/// no list: the catalog as before; other providers untouched.
#[test]
fn pick_among_reads_the_list_first_and_the_catalog_as_the_fallback() {
    let c = Setup::from_text(None, &|_| None).catalog;
    let pick = |main: &str, l: &[&str]| pick_among(&c, "chatgpt", main, &ids(l));
    assert_eq!(pick("chatgpt/gpt-5.6-terra", &["gpt-6-luna", "gpt-5.6-terra"]).as_deref(), Some("chatgpt/gpt-5.6-terra"));
    assert_eq!(pick("chatgpt/gpt-6.1-sol", &["gpt-6-luna", "gpt-6.1-sol"]).as_deref(), Some("chatgpt/gpt-6.1-sol"));
    assert_eq!(pick("chatgpt/gpt-6-astra", &["gpt-6-luna", "gpt-6.1-sol"]).as_deref(), Some("chatgpt/gpt-6.1-sol"));
    assert_eq!(pick("chatgpt/gpt-6.1-sol", &["gpt-6-luna", "gpt-5.6-terra", "gpt-5.6-luna"]).as_deref(), Some("chatgpt/gpt-6-luna"));
    assert_eq!(pick("", &["gpt-5.6-terra"]).as_deref(), Some("chatgpt/gpt-5.6-terra"));
    assert_eq!(pick("anthropic/claude-opus-5-5", &["gpt-5.6-terra"]).as_deref(), Some("chatgpt/gpt-5.6-terra"));
    // no list: the catalog's pick, main of that provider kept
    assert_eq!(pick("", &[]).as_deref(), Some("chatgpt/gpt-6.1-sol"));
    assert_eq!(pick("chatgpt/gpt-6-astra", &[]).as_deref(), Some("chatgpt/gpt-6-astra"));
    // pick_for reads the catalog's list; another provider has none
    let c = catalog_with(his_list());
    assert_eq!(roles::pick_for(&c, "chatgpt", "").as_deref(), Some("chatgpt/gpt-6-luna"));
    assert_eq!(roles::pick_for(&c, "anthropic", "").as_deref(), Some("anthropic/claude-opus-5-5"));
    assert_eq!(swap_of(&c, "anthropic/claude-opus-5-5"), None);
    // the sign-in's defaults: the same rule
    let (main, _) = roles::one_login_defaults(&c, "chatgpt", "openai", &his_list()).unwrap();
    assert_eq!(main, "chatgpt/gpt-6-luna");
}

/// A setup over a cached list: a listed main is kept; an unlisted one is
/// swapped with one warning and one swap row (the agents and the small
/// jobs model follow); no list: unchanged.
#[test]
fn a_role_the_plan_lacks_is_swapped_with_a_warning() {
    let cfg = roles::with_role("", roles::MAIN, "chatgpt/gpt-6.1-sol");
    let s = Setup::from_text(Some(&cfg), &|_| None);
    assert_eq!(s.model, "chatgpt/gpt-6.1-sol");
    let same = s.clone().with_plan_lists(Vec::new());
    assert_eq!((same.model.as_str(), same.catalog.plan.swaps.len()), ("chatgpt/gpt-6.1-sol", 0));
    assert!(!same.handoff_toml().contains("[swaps]"));

    let w = s.clone().with_plan_lists(vec![("chatgpt".into(), his_list())]);
    assert_eq!((w.model.as_str(), w.agent_model.as_str()), ("chatgpt/gpt-6-luna", "chatgpt/gpt-6-luna"));
    assert_eq!(w.small_model, "chatgpt/gpt-6-luna", "listed: kept");
    assert_eq!(w.catalog.plan.swaps, vec![("chatgpt/gpt-6.1-sol".to_string(), "chatgpt/gpt-6-luna".to_string())]);
    let warn: Vec<&String> = w.catalog.warnings.iter().filter(|x| x.contains("isn't on")).collect();
    assert_eq!(warn, vec!["gpt-6.1-sol isn't on your ChatGPT plan: bise uses gpt-6-luna · /model to pick another"]);
    let h = w.handoff_toml();
    assert!(h.contains("\n[swaps]\n\"chatgpt/gpt-6.1-sol\" = \"chatgpt/gpt-6-luna\"\n"), "{h}");

    let listed = s.with_plan_lists(vec![("chatgpt".into(), ids(&["gpt-6.1-sol", "gpt-6-luna"]))]);
    assert_eq!((listed.model.as_str(), listed.catalog.plan.swaps.len()), ("chatgpt/gpt-6.1-sol", 0));
    assert!(!listed.handoff_toml().contains("[swaps]"));
}

/// The cache file: chatgpt's list in the server's order; none or broken:
/// no list.
#[test]
fn the_cached_list_is_read_in_its_order() {
    let d = std::env::temp_dir().join(format!("bise-plan-list-{}", std::process::id()));
    std::fs::create_dir_all(&d).unwrap();
    assert!(read(&d).is_empty());
    std::fs::write(d.join("chatgpt-models.json"), "not json").unwrap();
    assert!(read(&d).is_empty());
    let m = |s: &str| serde_json::json!({"slug": s, "display_name": s, "efforts": []});
    let v = serde_json::json!({"fetched_at": 1, "models": [m("gpt-6-luna"), m("gpt-5.6-terra"), m("gpt-5.6-luna")]});
    std::fs::write(d.join("chatgpt-models.json"), v.to_string()).unwrap();
    assert_eq!(read(&d), vec![("chatgpt".to_string(), his_list())]);
    let _ = std::fs::remove_dir_all(&d);
}

/// /model offers what the plan lists: the catalog's chatgpt models it
/// lacks go, the ones only it has come in.
#[test]
fn the_model_list_offers_the_plans_models() {
    let mut s = Setup::from_text(None, &|_| None);
    s.catalog.plan.listed = vec![("chatgpt".into(), ids(&["gpt-6-luna", "gpt-5.6-terra"]))];
    let got: Vec<String> =
        crate::picks::picks(&s, &|id| id == "chatgpt").into_iter().filter(|p| p.alias_of.is_none()).map(|p| p.value).collect();
    assert_eq!(got, ids(&["chatgpt/gpt-6-luna", "chatgpt/gpt-5.6-terra"]));
}
