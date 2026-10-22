//! The land queue's line on a place's row (land-rank): its rank
//! (`landing`, 1-based) and the lid said from it (`landing`, `waits to
//! land · 2nd`, `land_line::lid`), in trunk flow and with a PR flow.

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
/// its lid is `land_line::lid(n)` (the queue's lid wins over `no PR
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
            let rows = crate::proto_view::places(&t.hub.snapshot(1_000));
            assert!(!rows.is_empty());
            for row in rows {
                let lid = row.lid.as_deref().unwrap_or("");
                match row.landing {
                    Some(n) => assert_eq!(lid, crate::land_line::lid(n), "{flow:?} {rank:?}"),
                    None => assert!(!queue_words(lid), "{flow:?}: {lid:?} without a rank"),
                }
                assert_eq!(row.landing, rank, "{flow:?}");
            }
        }
    }
    assert_eq!(crate::land_line::lid(1), "landing");
    assert_eq!(crate::land_line::lid(2), "waits to land · 2nd");
    assert_eq!(crate::land_line::lid(13), "waits to land · 13th");
}

/// sb-core restarted while a land holds go (issue 37 #3, architect
/// m_36620): the hub gives the live lands back before the input runs
/// again, so a second land on the same target waits until the first
/// ends, the first's place stays claimed, and the waiter gets go at the
/// first's end (nobody waits forever).
#[test]
fn a_core_restart_mid_land_keeps_the_line() {
    use bise_proto::core::{input as ci, Fx as CoreFx, In};
    let mut t = T::new();
    let journal = t.journal.clone();
    t.hub.set_revive(Revive::new(Box::new(move || journal.borrow().clone()), Box::new(|_| {})));
    let land = |t: &mut T, i: In| -> Vec<CoreFx> {
        t.go(Input::Land(i)).into_iter().filter_map(|e| if let Effect::LandFx(f) = e { Some(f) } else { None }).collect()
    };
    let claim = |key: &str| In::LandClaim(ci::LandClaim { key: key.into() });
    let claimed = |fx: &[CoreFx]| fx.iter().find_map(|f| if let CoreFx::LandClaimed(c) = f { Some(c.ok) } else { None });
    let main = "refs/heads/main";
    let join = |n: u64, place: &str| {
        let (place, agent, trunk) = (place.into(), place.into(), main.into());
        In::LandJoin(ci::LandJoin { ticket: n, target: main.into(), place, agent, trunk, dirty: json!([]) })
    };
    let gos = |fx: &[CoreFx]| fx.iter().filter_map(crate::land_line::go_of).map(|(n, _)| n).collect::<Vec<u64>>();
    assert_eq!(claimed(&land(&mut t, claim("wt:a"))), Some(true));
    assert_eq!(gos(&land(&mut t, join(1, "wt:a"))), vec![1]);
    t.hub.kill_core();
    // the next land step restarts sb-core: land 1 is back, holding go
    assert_eq!(gos(&land(&mut t, join(2, "wt:b"))), Vec::<u64>::new(), "two lands on one target");
    assert_eq!(claimed(&land(&mut t, claim("wt:a"))), Some(false), "a's claim came back");
    assert_eq!(gos(&land(&mut t, In::LandEnd(ci::LandEnd { ticket: 1, key: "wt:a".into() }))), vec![2]);
    // a ticket sb-core does not know ends as a no-op
    assert_eq!(gos(&land(&mut t, In::LandEnd(ci::LandEnd { ticket: 9, key: "wt:z".into() }))), Vec::<u64>::new());
}
