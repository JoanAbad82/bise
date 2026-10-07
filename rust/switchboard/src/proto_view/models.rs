//! The typed `models` rows (bar A.5, architect m_10427): pure, from
//! bise_catalog's `/model` list (the TUI's popup reads the same picks)
//! and the hub's catalog: each pick's facts, its vision (the catalog's K4
//! rule), its efforts and the roles it is the default of. The shell that
//! reads the hub's keys and config is `daemon/proto.rs`.

use bise_catalog::picks::Pick;
use bise_catalog::Setup;
use bise_proto::rows::{Model, ModelRole};

/// The rows of `picks` (an alias takes its model's efforts and vision).
pub fn models(setup: &Setup, picks: &[Pick]) -> Vec<Model> {
    let c = &setup.catalog;
    picks
        .iter()
        .map(|p| {
            let target = p.alias_of.clone().unwrap_or_else(|| p.value.clone());
            let r = c.resolve(&target);
            let (main, agents) = bise_catalog::picks::default_for(setup, &target);
            let mut default_for = Vec::new();
            if main && p.alias_of.is_none() {
                default_for.push(ModelRole::Main);
            }
            if agents && p.alias_of.is_none() {
                default_for.push(ModelRole::Agents);
            }
            let efforts = r.efforts();
            Model {
                id: p.value.clone(),
                label: bise_catalog::names::long_name(&p.value),
                provider: p.provider.clone(),
                short: p.short.clone(),
                context: p.context,
                config: p.config,
                alias_of: p.alias_of.clone(),
                vision: c.vision(&target),
                default_effort: Some(r.default_effort()).filter(|e| !e.is_empty() && !efforts.is_empty()),
                efforts,
                default_for,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_model_list_becomes_the_typed_rows() {
        let s = Setup::from_text(None, &|_| None);
        let picks = bise_catalog::picks::picks(&s, &|_| true);
        let rows = models(&s, &picks);
        assert_eq!(rows.len(), picks.len(), "one row per pick, in its order");
        for (r, p) in rows.iter().zip(&picks) {
            assert_eq!((r.id.as_str(), r.short.as_str(), r.context, r.config), (p.value.as_str(), p.short.as_str(), p.context, p.config));
            assert_eq!(r.vision, s.catalog.vision(p.alias_of.as_deref().unwrap_or(&p.value)), "the K4 rule");
        }
        // the roles' defaults: config.toml's [roles] (Setup::model_for)
        for r in rows.iter().filter(|r| r.alias_of.is_none()) {
            let (main, agents) = bise_catalog::picks::default_for(&s, &r.id);
            assert_eq!((r.default_for.contains(&ModelRole::Main), r.default_for.contains(&ModelRole::Agents)), (main, agents), "{r:?}");
        }
        assert!(rows.iter().filter(|r| r.alias_of.is_some()).all(|r| r.default_for.is_empty() && r.provider.is_empty()));
        // efforts as the catalog's words, the default among them
        for r in rows.iter().filter(|r| !r.efforts.is_empty()) {
            assert!(r.default_effort.as_ref().is_some_and(|d| r.efforts.contains(d)), "{r:?}");
        }
    }
}
