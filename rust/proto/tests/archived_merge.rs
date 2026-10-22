//! agents-light (architect m_37220): `rows::Archived::merge` on
//! fixtures/archived_merge.json, the fixture the desktop's
//! store/archived.test.ts reads too, so both merges stay one rule.

use bise_proto::hub::HubEv;
use bise_proto::rows::Archived;
use serde_json::Value;

#[test]
fn the_archived_list_merges_as_the_fixture_says() {
    let fx: Value = serde_json::from_str(include_str!("../fixtures/archived_merge.json")).unwrap();
    let mut kept = Archived::default();
    for step in fx["steps"].as_array().unwrap() {
        let what = step["what"].as_str().unwrap();
        let HubEv::Agents { agents, archived, .. } = HubEv::from_value(step["ev"].clone()).unwrap() else { panic!("{what}: not an agents event") };
        let rows = kept.merge(&agents, archived.as_deref());
        assert_eq!(serde_json::to_value(&rows).unwrap(), step["rows"], "{what}");
    }
}
