//! issue 36 chunk 3: sb-core's photo / restore_photo, through the real
//! sb-core. A restore only takes a hub that applied nothing yet: a photo
//! never replaces a live state (architect m_34907, law restore_only_fresh).
//! Out of core_tests.rs (its line limit).

use super::super::*;
use serde_json::json;

fn photo(t: &mut T) -> Value {
    let out = t.hub.raw(&json!({"t": "photo"}));
    out.get("st").cloned().unwrap_or_else(|| panic!("no photo: {out}"))
}

#[test]
fn a_hub_that_stepped_refuses_a_photo_and_stays_as_it_is() {
    let mut t = T::new();
    t.spawn_task("a");
    let before = photo(&mut t);
    let out = t.hub.raw(&json!({"t": "restore_photo", "st": {"agents": []}}));
    assert!(out.get("error").is_some(), "a live hub took a photo: {out}");
    assert_eq!(photo(&mut t), before, "the refused restore changed the state");
}

#[test]
fn a_fresh_hub_restores_the_photo_once() {
    let mut t = T::new();
    t.spawn_task("a");
    let st = photo(&mut t);
    assert_eq!(t.hub.raw(&json!({"t": "init", "workspace": "/w"})), json!({}));
    assert_eq!(t.hub.raw(&json!({"t": "restore_photo", "st": st})), json!({}));
    assert_eq!(photo(&mut t), st, "the restored state is the photo's");
    let again = t.hub.raw(&json!({"t": "restore_photo", "st": st}));
    assert!(again.get("error").is_some(), "a second restore was taken: {again}");
}
