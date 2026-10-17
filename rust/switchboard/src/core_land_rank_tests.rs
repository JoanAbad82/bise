//! The land queue's line on a place's row (land-rank): its rank
//! (`landing`, 1-based) and the lid said from it (`landing`, `waits to
//! land · 2nd`, `land_queue::lid`), in trunk flow and with a PR flow.

use super::prs::{place_view, report, spawn_wt};
use super::*;

#[test]
fn trunk_flow_has_no_no_pr_yet_line() {
    let mut t = T::new();
    spawn_wt(&mut t, "dark");
    t.hub.flow = Some(crate::flow::FlowMode::Trunk);
    t.go(report(1_000, Ok(vec![]), None));
    assert_eq!(place_view(&mut t, 1_000)["lid"], Value::Null);
    // the land queue's line is the held line there
    t.hub.landing.insert("wt:dark".into(), 2);
    assert_eq!(place_view(&mut t, 1_000)["lid"], "waits to land · 2nd");
    assert_eq!(place_view(&mut t, 1_000)["landing"], 2);
}

/// Law: a place row's `landing` and its lid agree. In line at rank n,
/// its lid is `land_queue::lid(n)` (the queue's lid wins over `no PR
/// yet` and a feature's); a lid in the queue's words has its rank. Over
/// no rank and every rank 1..=12, both flows, every other lid source.
#[test]
fn law_a_places_rank_and_lid_agree() {
    let queue_words = |l: &str| l == "landing" || l.starts_with("waits to land");
    for flow in [None, Some(crate::flow::FlowMode::Trunk)] {
        for rank in std::iter::once(None).chain((1..=12).map(Some)) {
            let mut t = T::new();
            spawn_wt(&mut t, "dark");
            t.hub.flow = flow;
            t.go(report(1_000, Ok(vec![]), None));
            // the other sources of a lid, all at once
            t.hub.feature_lids.insert("wt:dark".into(), "feature · 2 commits · not tried".into());
            if let Some(n) = rank {
                t.hub.landing.insert("wt:dark".into(), n);
            }
            let rows = crate::proto_view::places(&t.hub.snapshot_checked(1_000));
            assert!(!rows.is_empty());
            for row in rows {
                let lid = row.lid.as_deref().unwrap_or("");
                match row.landing {
                    Some(n) => assert_eq!(lid, crate::land_queue::lid(n), "{flow:?} {rank:?}"),
                    None => assert!(!queue_words(lid), "{flow:?}: {lid:?} without a rank"),
                }
                assert_eq!(row.landing, rank, "{flow:?}");
            }
        }
    }
    assert_eq!(crate::land_queue::lid(1), "landing");
    assert_eq!(crate::land_queue::lid(2), "waits to land · 2nd");
    assert_eq!(crate::land_queue::lid(13), "waits to land · 13th");
}
